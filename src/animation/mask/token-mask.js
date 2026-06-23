//Last Updated: 2026-06-20
//Author: .eskie

import { time } from '../../lib/time.js';
import { object as objectAttachment } from '../../lib/object.js';
import { absolutePath } from '../../lib/filemanager.js';
import { dependency } from '../../lib/dependency.js';
import { socket } from '../../integration/socketlib.js';
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
    const widthAdjustment = (object instanceof Token) ? canvas.grid.size : 1;

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

    // Create all tiles in database
    const [[objectRevealMask], [sceneRevealMask], [objectShapeMask]] = await Promise.all([
        socket.tile.create(revealMaskUpdatesBase),
        socket.tile.create(revealMaskUpdates),
        socket.tile.create(objectShapeMaskUpdates)
    ]);

    return [objectRevealMask, sceneRevealMask, objectShapeMask];
}

async function create(object, config = {}) {
    if (!object) {
        ui.notifications?.warn("Eskie Macros | No token or tile provided or selected.");
        return log.warn("tokenMaskEffect: No object provided. Effect aborted.");
    }

    const isToken = object instanceof Token;
    const isTile = object instanceof Tile;
    if (!isToken && !isTile) {
        ui.notifications?.warn("Eskie Macros | Provided object is not a Token or a Tile.");
        return log.warn("tokenMaskEffect: Invalid object type. Effect aborted.");
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
        console.warn("Eskie Macros | tokenMaskEffect | Warning: Running in an insecure context (HTTP). Advanced WebGL features like the Spritesheet Generator and sprite masks require a secure context and may fail or crash. Please connect using a secure address like https://<domain>:<port> or http://localhost:<port>.");
    }

    dependency.required([
        { id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }
    ]);

    const { id, deleteObject, revealOverlay, tokenOverlay, rotation, tint, callback, tileIds, localOnly } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    if (!localOnly) {
        let seq = new Sequence();
        seq.thenDo(async () => {
            return playSocketed(object, config);
        });
        return seq;
    }

    // Otherwise, build the real local animation sequence
    let tokenOverlayPath = config.tokenOverlayPath;
    if (!tokenOverlayPath) {
        if (!tokenOverlay) return log.warn(`tokenMaskEffect: Missing required configuration 'tokenOverlay'. Effect aborted.`);
        tokenOverlayPath = absolutePath(tokenOverlay);
    }

    const label = `${id} - ${object.id}`;

    // Resolve tiles (either reuse pre-created ones or create new ones)
    let tiles;
    if (tileIds) {
        // Wait for tiles to replicate to this client's scene
        try {
            await time.waitUntil(() => {
                return tileIds.every(tileId => canvas.scene.tiles.has(tileId));
            }, { timeout: 5000, interval: 100 });
        } catch (err) {
            log.warn("tokenMaskEffect | Timeout waiting for tiles to replicate.");
        }
        tiles = tileIds.map(tileId => canvas.scene.tiles.get(tileId));
    } else {
        tiles = await createMaskTiles(object, { revealOverlay, rotation });
    }

    const [objectRevealMask, sceneRevealMask, objectShapeMask] = tiles;
    if (!objectRevealMask || !sceneRevealMask || !objectShapeMask) {
        return log.warn(`tokenMaskEffect: Failed to resolve all three tiles. Effect aborted.`);
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
        log.error("tokenMaskEffect | TIMEOUT waiting for local PIXI rendering!", err);
        throw err;
    }

    // Reset videos to start
    objectRevealMask.object.sourceElement.currentTime = 0;
    sceneRevealMask.object.sourceElement.currentTime = 0;

    const paddingXY = object.document.texture.scaleX;

    // Attach tiles to object
    await objectAttachment.attach([objectRevealMask, sceneRevealMask, objectShapeMask], object);

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
            .locally(localOnly);
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
        .locally(localOnly)

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
                log.warn(`tokenMaskEffect | Timeout waiting for effects with label "${label}" to end. Proceeding with cleanup.`);
            }

            await objectAttachment.detach([objectRevealMask, sceneRevealMask, objectShapeMask], object);

            if (!config.animationId) {
                // Standalone run: clean up database immediately
                if (deleteObject) {
                    await object.document.delete();
                } else {
                    await Promise.all([
                        socket.tile.destroy(objectRevealMask.id),
                        socket.tile.destroy(objectShapeMask.id),
                        socket.tile.destroy(sceneRevealMask.id),
                    ]);
                }
            } else {
                // Coordinated run: report completion to GM initiator
                if (config.initiatorUserId) {
                    await eskieModule.socketlib.executeForUsers('tokenMaskClientDone', [config.initiatorUserId], object.id, game.user.id, config.animationId);
                }
            }
        });

    return seq;
}

/**
 * Coordinated play function that broadcasts local playback to all clients.
 */
async function playSocketed(object, config = {}) {
    const eskieModule = game.modules.get(MODULE_ID);

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
            tokenMaskTracker.delete(animationId);
            const eskieModule = game.modules.get(MODULE_ID);
            await eskieModule.socketlib.executeAsGM("cleanUpTokenMask", object.id, animationId, tracker.tileIds, tracker.deleteObject);
            resolvePromise();
        }
    }, 15000);

    tokenMaskTracker.set(animationId, {
        expected: new Set(activeUserIds),
        received: new Set(),
        tileIds: tileIds,
        deleteObject: deleteObject,
        resolve: () => {
            clearTimeout(timeoutId);
            resolvePromise();
        }
    });

    // 5. Broadcast play event to all active clients
    await eskieModule.socketlib.executeForEveryone(
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

async function play(object, config = {}) {
    // If running locally as part of a multi-client run, play locally without broadcasting
    if (config.localOnly) {
        const seq = await create(object, config);
        if (seq) return seq.play({ remote: false });
        return;
    }

    // Otherwise, trigger the coordinating play flow (which wraps the sequence and broadcasts it)
    const seq = await create(object, config);
    if (seq) return seq.play();
}

async function stop(object, config = {}) {
    const eskieModule = game.modules.get(MODULE_ID);
    if (!config.localOnly) {
        // Stop all active token mask sessions currently registered on this object
        const masks = object.document.getFlag('eskie-macros', 'token-masks') || {};
        const activeAnimationIds = Object.keys(masks);
        if (activeAnimationIds.length > 0) {
            for (const [animationId, tileIds] of Object.entries(masks)) {
                await eskieModule.socketlib.executeForEveryone('playTokenMaskLocal', object.id, tileIds, game.user.id, {
                    ...config,
                    toggleOff: true,
                    animationId
                });
            }
        }
    }

    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id} - ${object.id}`;

    return Promise.all([
        new Sequence().animation().on(object).opacity(1).show(true).play(),
        Sequencer.EffectManager.endEffects({ name: label })
    ]);
}

export const tokenMaskEffect = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};