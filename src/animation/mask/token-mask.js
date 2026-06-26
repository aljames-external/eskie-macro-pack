//Last Updated: 2026-06-20
//Author: .eskie

import { time } from '../../lib/time.js';
import { object as objectAttachment, getDocumentName } from '../../lib/object.js';
import { absolutePath } from '../../lib/filemanager.js';
import { dependency } from '../../lib/dependency.js';
import { socket, socketlib } from '../../integration/socketlib.js';
import { MODULE_ID } from '../../lib/constants.js';
import { log } from '../../lib/logger.js';

export const tokenMaskTracker = new Map();

const DEFAULT_CONFIG = {
    id: 'tokenMask',
    deleteObject: false,
    tokenOverlay: undefined,    // Internal use only
    revealOverlay: undefined,   // Internal use only
    rotation: 0,
    tint: undefined,
    callback: {},               // Optional callback functions for customisation
    tileIds: undefined,
    localOnly: false,
    initiatorUserId: undefined,
    tokenOverlayPath: undefined,
    revealOverlayPath: undefined,
    animationId: undefined
}

/* Works for tokens and tiles */
async function createMaskTiles(object, config = {}) {
    const widthAdjustment = (getDocumentName(object) === 'Token') ? canvas.grid.size : 1;

    const { revealOverlay, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const revealOverlayPath = absolutePath(revealOverlay);
    const scaleXY = object.document.texture.scaleX;

    const revealMaskUpdatesBase = {
        "texture.src": revealOverlayPath,
        "alpha": 0,
        "hidden": true,
        "x": object.x - (widthAdjustment * object.document.width * (scaleXY - 1) / 2),
        "y": object.y - (widthAdjustment * object.document.height * (scaleXY - 1) / 2),
        "video": {
            autoplay: false,
            loop: false,
            volume: 0
        },
        "width": (widthAdjustment * object.document.width) * scaleXY,
        "height": (widthAdjustment * object.document.height) * scaleXY,
        "rotation": rotation,
    };

    const objectShapeMaskUpdates = {
        "texture": object.document.texture,
        "alpha": 1,
        "hidden": true,
        "x": object.x,
        "y": object.y,
        "rotation": object.document.rotation,
        "width": widthAdjustment * object.document.width,
        "height": widthAdjustment * object.document.height,
    };

    const revealMaskUpdates = foundry.utils.deepClone(revealMaskUpdatesBase);

    // Create all tiles in database and wait for them to replicate to all clients
    const [[objectRevealMask], [sceneRevealMask], [objectShapeMask]] = await Promise.all([
        socket.tile.create(revealMaskUpdatesBase, { waitForPlayers: true }),
        socket.tile.create(revealMaskUpdates, { waitForPlayers: true }),
        socket.tile.create(objectShapeMaskUpdates, { waitForPlayers: true })
    ]);

    return [objectRevealMask, sceneRevealMask, objectShapeMask];
}

/**
 * Internal helper to build the local animation sequence using pre-created tiles.
 * Guaranteed to be called only locally on the client.
 */
async function createLocal(object, tileIds, animationId, config = {}) {
    if (!object) {
        ui.notifications?.warn("Eskie Macros | No token or tile provided or selected.");
        return log.warn("tokenMaskEffect.createLocal: No object provided. Effect aborted.");
    }
    if (!tileIds || tileIds.length === 0) {
        return log.warn("tokenMaskEffect.createLocal: Missing required 'tileIds' for local animation. Effect aborted.");
    }
    if (!animationId) {
        throw new Error("tokenMaskEffect.createLocal: 'animationId' is required.");
    }

    const isToken = getDocumentName(object) === 'Token';
    const isTile = getDocumentName(object) === 'Tile';
    if (!isToken && !isTile) {
        ui.notifications?.warn("Eskie Macros | Provided object is not a Token or a Tile.");
        return log.warn("tokenMaskEffect.createLocal: Invalid object type. Effect aborted.");
    }

    dependency.required([
        { id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }
    ]);

    const { id, deleteObject, revealOverlay, tokenOverlay, rotation, tint, callback } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    let tokenOverlayPath = config.tokenOverlayPath;
    if (!tokenOverlayPath) {
        if (!tokenOverlay) return log.warn(`tokenMaskEffect.createLocal: Missing required configuration 'tokenOverlay'. Effect aborted.`);
        tokenOverlayPath = absolutePath(tokenOverlay);
    }

    const label = `${id} - ${object.id}`;

    // Wait for tiles to replicate to this client's scene
    try {
        await time.waitUntil(() => {
            return tileIds.every(tileId => canvas.scene.tiles.has(tileId));
        }, { timeout: 5000, interval: 100 });
    } catch (err) {
        log.warn("tokenMaskEffect.createLocal | Timeout waiting for tiles to replicate.");
    }
    const tiles = tileIds.map(tileId => canvas.scene.tiles.get(tileId));

    const [objectRevealMask, sceneRevealMask, objectShapeMask] = tiles;
    if (!objectRevealMask || !sceneRevealMask || !objectShapeMask) {
        return log.warn(`tokenMaskEffect.createLocal: Failed to resolve all three tiles. Effect aborted.`);
    }

    // Wait for PIXI objects and video elements to render on this client
    function tilesRendered() {
        return objectRevealMask?.object?.sourceElement &&
            sceneRevealMask?.object?.sourceElement &&
            objectShapeMask?.object?.mesh;
    }

    try {
        await time.waitUntil(tilesRendered, { timeout: 5000 });
    } catch (err) {
        log.error("tokenMaskEffect.createLocal | TIMEOUT waiting for local PIXI rendering!", err);
        throw err;
    }

    // Reset videos to start
    objectRevealMask.object.sourceElement.currentTime = 0;
    sceneRevealMask.object.sourceElement.currentTime = 0;

    const paddingXY = object.document.texture.scaleX;

    let seq = new Sequence();

    // Background mask
    if (canvas.scene.background.src) {
        seq = seq.effect()
            .name(label)
            .file(canvas.scene.background.src)
            .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .persist()
            .belowTokens()
            .mask(sceneRevealMask)
            .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
            .locally(true);
    }

    // Token/Tile clone
    seq = seq.animation()
        .delay(250)
        .on(object)
        .opacity(0)
        .show(false);

    seq = seq.effect()
        .name(label)
        .copySprite(object);
    if (tint && tint !== 'none') seq = seq.tint(tint);
    seq = seq
        .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: true })
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-object.document.rotation)
        .mask(objectRevealMask)
        .persist()
        .locally(true)

        .wait(250)

        .thenDo(async () => {
            if (game.user.isGM) {
                return Promise.all([
                    sceneRevealMask.update({ alpha: 1, hidden: false, video: { autoplay: true } }),
                    objectRevealMask.update({
                        alpha: 1,
                        hidden: false,
                        video: { autoplay: true }
                    })
                ]);
            }
        })

        .effect()
        .file(tokenOverlayPath)
        .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: false })
        .mask(objectShapeMask)
        .rotate(-rotation)
        .scaleToObject(paddingXY)
        .zIndex(1);

    if (callback.tokenOverlay) seq = callback.tokenOverlay(seq);

    seq = seq.waitUntilFinished()
        .thenDo(async () => {
            // Instantly hide tiles locally to prevent them from flickering while database deletion syncs
            if (objectRevealMask.object) objectRevealMask.object.visible = false;
            if (sceneRevealMask.object) sceneRevealMask.object.visible = false;
            if (objectShapeMask.object) objectShapeMask.object.visible = false;

            // If the object is going to be deleted, hide it locally as well to prevent it from popping back
            if (deleteObject && object.object) {
                object.object.visible = false;
            }

            await Sequencer.EffectManager.endEffects({ name: label });

            // Dynamically wait until all masked effects are fully ended and removed from the renderer
            try {
                await time.waitUntil(() => {
                    return Sequencer.EffectManager.getEffects({ name: label }).length === 0;
                }, { timeout: 2000, interval: 50 });
            } catch (err) {
                log.warn(`tokenMaskEffect.createLocal | Timeout waiting for effects with label "${label}" to end. Proceeding with cleanup.`);
            }

            // Coordinated run: report completion to GM initiator
            if (config.initiatorUserId) {
                await socketlib.executeForUsers('tokenMaskClientDone', [config.initiatorUserId], object.id, game.user.id, animationId);
            } else {
                log.warn(`tokenMaskEffect.createLocal | Missing 'initiatorUserId'. Completion could not be reported for session ${animationId}.`);
            }
        });

    return seq;
}

/**
 * Public coordinated create. Returns a Sequence wrapper that triggers host-level playSocketed.
 */
async function create(object, config = {}) {
    if (!object) {
        ui.notifications?.warn("Eskie Macros | No token or tile provided or selected.");
        return log.warn("tokenMaskEffect: No object provided. Effect aborted.");
    }

    const isToken = getDocumentName(object) === 'Token';
    const isTile = getDocumentName(object) === 'Tile';
    if (!isToken && !isTile) {
        ui.notifications?.warn("Eskie Macros | Provided object is not a Token or a Tile.");
        return log.warn("tokenMaskEffect: Invalid object type. Effect aborted.");
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
        log.warn("Running in an insecure context (HTTP). Advanced WebGL features like the Spritesheet Generator and sprite masks require a secure context and may fail or crash. Please connect using a secure address like https://<domain>:<port> or http://localhost:<port>.");
    }

    dependency.required([
        { id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }
    ]);

    let seq = new Sequence();
    seq.thenDo(async () => {
        if (!game.user.isGM) {
            return socketlib.executeAsGM('playTokenMaskGM', object.id, config);
        }
        return playSocketed(object, config);
    });
    return seq;
}

/**
 * Coordinated play function that broadcasts local playback to all clients.
 */
async function playSocketed(object, config = {}) {
    const { id, deleteObject, revealOverlay, tokenOverlay, rotation, tint } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Pre-resolve paths
    const tokenOverlayPath = absolutePath(tokenOverlay);
    const revealOverlayPath = absolutePath(revealOverlay);

    const animationId = foundry.utils.randomID();

    // 1. Create the tiles in the database
    const tiles = await createMaskTiles(object, { revealOverlay, rotation });
    const tileIds = tiles.map(t => t.id);

    // 2. Store tile IDs on the object flags as a backup
    await socket.object.edit(object.id, { [`flags.eskie-macros.token-masks.${animationId}`]: tileIds });

    // 3. Attach tiles to object
    await objectAttachment.attach(tiles, object);

    // 4. Set up the tracking promise for all active users
    const activeUserIds = game.users.filter(u => u.active).map(u => u.id);

    let resolvePromise;
    const promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    // Safety timeout (15 seconds)
    const timeoutId = setTimeout(async () => {
        const tracker = tokenMaskTracker.get(animationId);
        if (tracker) {
            log.warn(`tokenMaskEffect | Tracker TIMEOUT hit for object ${object.id} (Session: ${animationId})! Cleaning up.`);
            await socketlib.executeAsGM("cleanUpTokenMask", object.id, animationId, tracker.tileIds, tracker.deleteObject);
            tracker.resolve();
        }
    }, 15000);

    tokenMaskTracker.set(animationId, {
        expected: new Set(activeUserIds),
        received: new Set(),
        tileIds: tileIds,
        deleteObject: deleteObject,
        resolve: () => {
            clearTimeout(timeoutId);
            tokenMaskTracker.delete(animationId);
            resolvePromise();
        }
    });

    // 5. Broadcast play event to all active clients
    await socketlib.executeForEveryone(
        'playTokenMaskLocal',
        object.id,
        tileIds,
        game.user.id,
        {
            id,
            rotation,
            tint,
            tokenOverlayPath,
            revealOverlayPath,
            animationId,
            deleteObject
        }
    );

    // 6. Wait for all clients to report completion
    return promise;
}

/**
 * Public entry point to play the coordinated multi-client effect.
 */
async function play(object, config = {}) {
    const seq = await create(object, config);
    if (seq) return seq.play();
}

/**
 * Internal entry point to play the local animation sequence on this client.
 */
async function playLocal(object, tileIds, animationId, config = {}) {
    const seq = await createLocal(object, tileIds, animationId, config);
    if (seq) return seq.play({ remote: false });
}

/**
 * Internal entry point to execute the local stop/cleanup sequence.
 */
async function stopLocal(object, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id} - ${object.id}`;

    return Promise.all([
        new Sequence().animation().on(object).opacity(1).show(true).play(),
        Sequencer.EffectManager.endEffects({ name: label })
    ]);
}

/**
 * Public entry point to stop all active token mask sessions.
 */
async function stop(object, config = {}) {
    // Stop all active token mask sessions currently registered on this object
    const masks = object.document.getFlag('eskie-macros', 'token-masks') || {};
    const activeAnimationIds = Object.keys(masks);
    if (activeAnimationIds.length > 0) {
        for (const [animationId, tileIds] of Object.entries(masks)) {
            await socketlib.executeForEveryone('playTokenMaskLocal', object.id, tileIds, game.user.id, {
                ...config,
                toggleOff: true,
                animationId
            });

            // Clean up the database immediately via GM
            await socketlib.executeAsGM('cleanUpTokenMask', object.id, animationId, tileIds, config.deleteObject || false);

            // Resolve the tracker if it exists on this client
            const tracker = tokenMaskTracker.get(animationId);
            if (tracker) {
                tracker.resolve();
            }
        }
    }

    return stopLocal(object, config);
}

export const tokenMaskEffect = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

export { createLocal, playLocal, stopLocal };