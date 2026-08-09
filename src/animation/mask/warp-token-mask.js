//Last Updated: 2026-08-09
//Author: .eskie

import { time } from '../../lib/time.js';
import { object as objectAttachment, getDocumentName } from '../../lib/object.js';
import { absolutePath } from '../../lib/filemanager.js';
import { dependency } from '../../lib/dependency.js';
import { socket, socketlib } from '../../integration/socketlib.js';
import { log } from '../../lib/logger.js';
import { tokenMaskTracker } from './token-mask.js';

export const DEFAULT_CONFIG = {
    id: 'WarpTokenMask',
    deleteObject: false,
    mode: 'out',                                                           // 'out' (warp out/disappear) or 'in' (warp in/appear)
    color: 'purple',                                                      // 'purple', 'red', 'white'
    scale: 1,                                                             // Scale multiplier of the portal effect & mask relative to token
    portal: {
        scale: undefined
    },
    persistDuration: 500,                                                 // Duration (ms) the portal persists open in the middle
    tokenOverlay: undefined,                                              // Portal overlay path/key (defaults to eskie.environment.portal.warp.01.center.one_shot.full.<color>)
    revealOverlay: 'eskie.texture_mask.tile_base.portal.warp.01.center.one_shot', // Mask tile texture
    rotation: 0,
    tint: undefined,
    callback: {},                                                         // Optional callback functions for customization (openingGate, persistentGate, closingGate, tokenOverlay, tokenOverlayClose)
    tileIds: undefined,
    localOnly: false,
    initiatorUserId: undefined,
    tokenOverlayPath: undefined,
    revealOverlayPath: undefined,
    animationId: undefined
};

/**
 * Extracts normalized numerical scale multiplier from config.
 */
function resolveScale(config) {
    const val = config?.scale ?? config?.portal?.scale ?? DEFAULT_CONFIG.scale ?? 1;
    const num = Number(val);
    return Number.isFinite(num) && num > 0 ? num : (DEFAULT_CONFIG.scale ?? 1);
}

/* In Foundry v14 they changed the anchor points of tiles which messes with the math for the masks
 * This function returns the correct offset for the tile based on the Foundry version and the object type (Token or Tile)
 */
function getRevealOffset(object, scale = 1) {
    const updatedTiles = foundry.utils.isNewerVersion(game.version, "14");
    const widthAdjustment = (getDocumentName(object) === 'Token') ? canvas.grid.size : 1;
    const scaleXY = object.document.texture.scaleX;
    const totalScale = scaleXY * scale;
    const legacyOffset = {
        x: object.x - (widthAdjustment * object.document.width * (totalScale - 1) / 2),
        y: object.y - (widthAdjustment * object.document.height * (totalScale - 1) / 2)
    };
    return updatedTiles ? object.center : legacyOffset;
}

function getShapeOffset(object) {
    const updatedTiles = foundry.utils.isNewerVersion(game.version, "14");
    const legacyOffset = {
        x: object.x,
        y: object.y
    };
    return updatedTiles ? object.center : legacyOffset;
}

function getTileOffset(object, type, scale = 1) {
    switch (type) {
        case 'reveal':
            return getRevealOffset(object, scale);
        case 'shape':
            return getShapeOffset(object);
        default:
            throw new Error(`Invalid offset type: ${type}`);
    }
}

const compat = { getTileOffset };

/* Works for tokens and tiles */
async function createMaskTiles(object, config = {}) {
    const widthAdjustment = (getDocumentName(object) === 'Token') ? canvas.grid.size : 1;
    const maskScale = resolveScale(config);

    const { revealOverlay, tokenOverlay, color, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const revealOverlayPath = absolutePath(revealOverlay ?? 'eskie.texture_mask.tile_base.portal.warp.01.center.one_shot');
    const portalOverlayPath = absolutePath(tokenOverlay ?? `eskie.environment.portal.warp.01.center.one_shot.full.${color ?? 'purple'}`);
    const scaleXY = object.document.texture.scaleX;

    const tokenElevation = object.document?.elevation ?? 0;
    const tokenSort = object.document?.sort ?? 0;

    const revealOffset = compat.getTileOffset(object, 'reveal', maskScale);
    const revealMaskUpdatesBase = {
        "texture.src": revealOverlayPath,
        "alpha": 0,
        "hidden": true,
        "x": revealOffset.x,
        "y": revealOffset.y,
        "video": {
            autoplay: false,
            loop: false,
            volume: 0
        },
        "width": (widthAdjustment * object.document.width) * scaleXY * maskScale,
        "height": (widthAdjustment * object.document.height) * scaleXY * maskScale,
        "rotation": rotation,
        "elevation": tokenElevation - 0.01,
        "sort": tokenSort - 10
    };

    const shapeOffset = compat.getTileOffset(object, 'shape');
    const objectShapeMaskUpdates = {
        "texture": object.document.texture,
        "alpha": 1,
        "hidden": true,
        "x": shapeOffset.x,
        "y": shapeOffset.y,
        "rotation": object.document.rotation,
        "width": widthAdjustment * object.document.width,
        "height": widthAdjustment * object.document.height,
        "elevation": tokenElevation,
        "sort": tokenSort
    };

    const revealMaskUpdates = foundry.utils.deepClone(revealMaskUpdatesBase);

    const portalOverlayUpdates = {
        ...foundry.utils.deepClone(revealMaskUpdatesBase),
        "texture.src": portalOverlayPath,
        "elevation": tokenElevation - 0.01,
        "sort": tokenSort - 10
    };

    // Create all four tiles in database in parallel
    const [[objectRevealMask], [sceneRevealMask], [objectShapeMask], [portalOverlayTile]] = await Promise.all([
        socket.tile.create(revealMaskUpdatesBase),
        socket.tile.create(revealMaskUpdates),
        socket.tile.create(objectShapeMaskUpdates),
        socket.tile.create(portalOverlayUpdates)
    ]);

    // Wait for all four tiles to replicate to all active clients in parallel
    await Promise.all([
        socket.tile.sync(objectRevealMask.id),
        socket.tile.sync(sceneRevealMask.id),
        socket.tile.sync(objectShapeMask.id),
        socket.tile.sync(portalOverlayTile.id)
    ]);

    return [objectRevealMask, sceneRevealMask, objectShapeMask, portalOverlayTile];
}

/**
 * Internal helper to build the local warp mask animation sequence using pre-created tiles.
 * Guaranteed to be called only locally on the client.
 */
async function createLocal(object, tileIds, animationId, config = {}) {
    if (!object) {
        ui.notifications?.warn("Eskie Macros | No token or tile provided or selected.");
        return log.warn("warpTokenMaskEffect.createLocal: No object provided. Effect aborted.");
    }
    if (!tileIds || tileIds.length === 0) {
        return log.warn("warpTokenMaskEffect.createLocal: Missing required 'tileIds' for local animation. Effect aborted.");
    }
    if (!animationId) {
        throw new Error("warpTokenMaskEffect.createLocal: 'animationId' is required.");
    }

    const isToken = getDocumentName(object) === 'Token';
    const isTile = getDocumentName(object) === 'Tile';
    if (!isToken && !isTile) {
        ui.notifications?.warn("Eskie Macros | Provided object is not a Token or a Tile.");
        return log.warn("warpTokenMaskEffect.createLocal: Invalid object type. Effect aborted.");
    }

    dependency.required([
        { id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }
    ]);

    const {
        id,
        deleteObject,
        mode,
        persistDuration,
        tint,
        callback
    } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const label = `${id} - ${object.id}`;

    // Wait for tiles to replicate to this client's scene
    try {
        await time.waitUntil(() => {
            return tileIds.every(tileId => canvas.scene.tiles.has(tileId));
        }, { timeout: 5000, interval: 100 });
    } catch (err) {
        log.warn("warpTokenMaskEffect.createLocal | Timeout waiting for tiles to replicate.");
    }
    const tiles = tileIds.map(tileId => canvas.scene.tiles.get(tileId));

    const [objectRevealMask, sceneRevealMask, objectShapeMask, portalOverlayTile] = tiles;
    if (!objectRevealMask || !sceneRevealMask || !objectShapeMask || !portalOverlayTile) {
        return log.warn(`warpTokenMaskEffect.createLocal: Failed to resolve all four tiles. Effect aborted.`);
    }

    // Wait for PIXI objects and video elements to render on this client
    function tilesRendered() {
        return objectRevealMask?.object?.sourceElement &&
            sceneRevealMask?.object?.sourceElement &&
            portalOverlayTile?.object?.sourceElement &&
            objectShapeMask?.object?.mesh &&
            !isNaN(objectRevealMask.object.sourceElement.duration) &&
            objectRevealMask.object.sourceElement.duration > 0 &&
            !isNaN(portalOverlayTile.object.sourceElement.duration) &&
            portalOverlayTile.object.sourceElement.duration > 0;
    }

    try {
        await time.waitUntil(tilesRendered, { timeout: 5000 });
    } catch (err) {
        log.error("warpTokenMaskEffect.createLocal | TIMEOUT waiting for local PIXI rendering!", err);
        throw err;
    }

    const totalDurationSec = portalOverlayTile.object.sourceElement.duration || objectRevealMask.object.sourceElement.duration || 2.0;
    const totalMs = Math.round(totalDurationSec * 1000);
    const halfDurationSec = totalDurationSec / 2;
    const halfMs = Math.round(totalMs / 2);
    const actualPersistDuration = persistDuration ?? 500;

    let seq = new Sequence();

    if (mode === 'out') {
        // =========================================================================
        // === WARP OUT ===
        // Stage 1: Opening Gate (Gate opens behind token, token remains visible)
        // Stage 2: Persistent Gate (Gate stays open behind token)
        // Stage 3: Warp-Out Close Gate (Gate masks off the token as it closes)
        // =========================================================================

        // Stage 1: Opening Gate
        seq = seq.thenDo(async () => {
            if (portalOverlayTile?.object?.sourceElement) {
                portalOverlayTile.object.sourceElement.currentTime = 0;
                portalOverlayTile.object.sourceElement.play();
            }
            if (game.user.isGM) {
                await portalOverlayTile.update({ alpha: 1, hidden: false, video: { autoplay: true } });
            }
        });

        if (callback.openingGate) seq = callback.openingGate(seq);
        if (callback.tokenOverlay) seq = callback.tokenOverlay(seq);

        seq = seq.wait(halfMs);

        // Stage 2: Persistent Gate (Pause gate at midpoint open state, token stays visible)
        seq = seq.thenDo(async () => {
            if (portalOverlayTile?.object?.sourceElement) {
                portalOverlayTile.object.sourceElement.pause();
                portalOverlayTile.object.sourceElement.currentTime = halfDurationSec;
            }
            if (objectRevealMask?.object?.sourceElement) {
                objectRevealMask.object.sourceElement.pause();
                objectRevealMask.object.sourceElement.currentTime = halfDurationSec;
            }
            if (sceneRevealMask?.object?.sourceElement) {
                sceneRevealMask.object.sourceElement.pause();
                sceneRevealMask.object.sourceElement.currentTime = halfDurationSec;
            }
        });

        if (callback.persistentGate) seq = callback.persistentGate(seq);

        seq = seq.wait(actualPersistDuration);

        // Stage 3: Warp-Out Close Gate (Masks off token as gate closes)
        seq = seq.animation()
            .on(object)
            .opacity(0)
            .show(false);

        seq = seq.thenDo(async () => {
            if (portalOverlayTile?.object?.sourceElement) {
                portalOverlayTile.object.sourceElement.currentTime = halfDurationSec;
                portalOverlayTile.object.sourceElement.play();
            }
            if (objectRevealMask?.object?.sourceElement) {
                objectRevealMask.object.sourceElement.currentTime = halfDurationSec;
                objectRevealMask.object.sourceElement.play();
            }
            if (sceneRevealMask?.object?.sourceElement) {
                sceneRevealMask.object.sourceElement.currentTime = halfDurationSec;
                sceneRevealMask.object.sourceElement.play();
            }
            if (game.user.isGM) {
                return Promise.all([
                    sceneRevealMask.update({ alpha: 1, hidden: false, video: { autoplay: true } }),
                    objectRevealMask.update({ alpha: 1, hidden: false, video: { autoplay: true } })
                ]);
            }
        });

        // Background mask (closing phase)
        if (canvas.scene.background?.src) {
            seq = seq.effect()
                .name(label)
                .file(canvas.scene.background.src)
                .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
                .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
                .duration(halfMs)
                .belowTokens()
                .mask(sceneRevealMask)
                .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
                .locally(true);
        }

        // CopySprite token masked by closing mask (warped out into the closing gate)
        seq = seq.effect()
            .name(label)
            .copySprite(object)
            .spriteRotation(-object.document.rotation);
        if (tint && tint !== 'none') seq = seq.tint(tint);
        seq = seq
            .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: true })
            .scaleToObject(1, { considerTokenScale: true })
            .mask(objectRevealMask)
            .duration(halfMs)
            .locally(true);

        if (callback.closingGate) seq = callback.closingGate(seq);
        if (callback.tokenOverlayClose) seq = callback.tokenOverlayClose(seq);

        seq = seq.wait(halfMs);

    } else {
        // =========================================================================
        // === WARP IN ===
        // Stage 1: Warp-In Opening Gate (Gate masks on token as it opens, revealing token)
        // Stage 2: Persistent Gate (Gate stays open behind revealed token)
        // Stage 3: Close Gate (Gate closes behind visible token)
        // =========================================================================

        // Real token starts hidden
        seq = seq.animation()
            .on(object)
            .opacity(0)
            .show(false);

        // Stage 1: Warp-In Opening Gate
        seq = seq.thenDo(async () => {
            if (portalOverlayTile?.object?.sourceElement) {
                portalOverlayTile.object.sourceElement.currentTime = 0;
                portalOverlayTile.object.sourceElement.play();
            }
            if (objectRevealMask?.object?.sourceElement) {
                objectRevealMask.object.sourceElement.currentTime = 0;
                objectRevealMask.object.sourceElement.play();
            }
            if (sceneRevealMask?.object?.sourceElement) {
                sceneRevealMask.object.sourceElement.currentTime = 0;
                sceneRevealMask.object.sourceElement.play();
            }
            if (game.user.isGM) {
                return Promise.all([
                    portalOverlayTile.update({ alpha: 1, hidden: false, video: { autoplay: true } }),
                    sceneRevealMask.update({ alpha: 1, hidden: false, video: { autoplay: true } }),
                    objectRevealMask.update({ alpha: 1, hidden: false, video: { autoplay: true } })
                ]);
            }
        });

        // Background mask (opening phase)
        if (canvas.scene.background?.src) {
            seq = seq.effect()
                .name(label)
                .file(canvas.scene.background.src)
                .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
                .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
                .duration(halfMs)
                .belowTokens()
                .mask(sceneRevealMask)
                .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
                .locally(true);
        }

        // CopySprite token masked by opening mask (revealed as gate opens)
        seq = seq.effect()
            .name(label)
            .copySprite(object)
            .spriteRotation(-object.document.rotation);
        if (tint && tint !== 'none') seq = seq.tint(tint);
        seq = seq
            .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: true })
            .scaleToObject(1, { considerTokenScale: true })
            .mask(objectRevealMask)
            .duration(halfMs)
            .locally(true);

        if (callback.openingGate) seq = callback.openingGate(seq);
        if (callback.tokenOverlay) seq = callback.tokenOverlay(seq);

        seq = seq.wait(halfMs);

        // Stage 2: Persistent Gate (Pause gate at open midpoint, reveal real token, hide masks)
        seq = seq.thenDo(async () => {
            if (portalOverlayTile?.object?.sourceElement) {
                portalOverlayTile.object.sourceElement.pause();
                portalOverlayTile.object.sourceElement.currentTime = halfDurationSec;
            }
            if (objectRevealMask?.object) objectRevealMask.object.visible = false;
            if (sceneRevealMask?.object) sceneRevealMask.object.visible = false;
        });

        seq = seq.animation()
            .on(object)
            .opacity(1)
            .show(true);

        if (callback.persistentGate) seq = callback.persistentGate(seq);

        seq = seq.wait(actualPersistDuration);

        // Stage 3: Close Gate (Gate closes behind visible token)
        seq = seq.thenDo(async () => {
            if (portalOverlayTile?.object?.sourceElement) {
                portalOverlayTile.object.sourceElement.currentTime = halfDurationSec;
                portalOverlayTile.object.sourceElement.play();
            }
        });

        if (callback.closingGate) seq = callback.closingGate(seq);
        if (callback.tokenOverlayClose) seq = callback.tokenOverlayClose(seq);

        seq = seq.wait(halfMs);
    }

    // Common completion & cleanup handler
    seq = seq.waitUntilFinished()
        .thenDo(async () => {
            // Instantly hide tiles locally to prevent them from flickering while database deletion syncs
            if (objectRevealMask?.object) objectRevealMask.object.visible = false;
            if (sceneRevealMask?.object) sceneRevealMask.object.visible = false;
            if (objectShapeMask?.object) objectShapeMask.object.visible = false;
            if (portalOverlayTile?.object) portalOverlayTile.object.visible = false;

            // If the object is going to be deleted, hide it locally as well to prevent it from popping back
            if (deleteObject && object?.object) {
                object.object.visible = false;
            }

            await Sequencer.EffectManager.endEffects({ name: label });

            // Dynamically wait until all masked effects are fully ended and removed from the renderer
            try {
                await time.waitUntil(() => {
                    return Sequencer.EffectManager.getEffects({ name: label }).length === 0;
                }, { timeout: 2000, interval: 50 });
            } catch (err) {
                log.warn(`warpTokenMaskEffect.createLocal | Timeout waiting for effects with label "${label}" to end. Proceeding with cleanup.`);
            }

            // Coordinated run: report completion to GM initiator
            if (config.initiatorUserId) {
                await socketlib.executeForUsers('tokenMaskClientDone', [config.initiatorUserId], object.id, game.user.id, animationId);
            } else {
                log.warn(`warpTokenMaskEffect.createLocal | Missing 'initiatorUserId'. Completion could not be reported for session ${animationId}.`);
            }
        });

    return seq;
}

/**
 * Coordinated play function that broadcasts local playback to all clients.
 */
async function playSocketed(object, config = {}) {
    const maskScale = resolveScale(config);
    const {
        id,
        deleteObject,
        mode,
        color,
        persistDuration,
        revealOverlay,
        tokenOverlay,
        rotation,
        tint
    } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const overlayAsset = tokenOverlay ?? `eskie.environment.portal.warp.01.center.one_shot.full.${color ?? 'purple'}`;
    const revealAsset = revealOverlay ?? 'eskie.texture_mask.tile_base.portal.warp.01.center.one_shot';

    const tokenOverlayPath = absolutePath(overlayAsset);
    const revealOverlayPath = absolutePath(revealAsset);

    const animationId = foundry.utils.randomID();

    // 1. Create all four tiles in database with identical scale factor and elevation behind token
    const tiles = await createMaskTiles(object, {
        revealOverlay: revealAsset,
        tokenOverlay: overlayAsset,
        color,
        rotation,
        scale: maskScale
    });
    const tileIds = tiles.map(t => t.id);

    // 2. Store tile IDs on object flags as backup
    await socket.object.edit(object.id, { [`flags.eskie-macros.token-masks.${animationId}`]: tileIds });

    // 3. Attach tiles to object
    await objectAttachment.attach(tiles, object);

    // 4. Set up tracking promise for all active users
    const activeUserIds = game.users.filter(u => u.active).map(u => u.id);

    let resolvePromise;
    const promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    // Safety timeout (15 seconds)
    const timeoutId = setTimeout(async () => {
        const tracker = tokenMaskTracker.get(animationId);
        if (tracker) {
            log.warn(`warpTokenMaskEffect | Tracker TIMEOUT hit for object ${object.id} (Session: ${animationId})! Cleaning up.`);
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
        'playWarpTokenMaskLocal',
        object.id,
        tileIds,
        game.user.id,
        {
            id,
            mode,
            color,
            scale: maskScale,
            persistDuration,
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
 * Public coordinated create. Returns a Sequence wrapper that triggers host-level playSocketed.
 */
async function create(object, config = {}) {
    if (!object) {
        ui.notifications?.warn("Eskie Macros | No token or tile provided or selected.");
        return log.warn("warpTokenMaskEffect: No object provided. Effect aborted.");
    }

    const isToken = getDocumentName(object) === 'Token';
    const isTile = getDocumentName(object) === 'Tile';
    if (!isToken && !isTile) {
        ui.notifications?.warn("Eskie Macros | Provided object is not a Token or a Tile.");
        return log.warn("warpTokenMaskEffect: Invalid object type. Effect aborted.");
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
            return socketlib.executeAsGM('playWarpTokenMaskGM', object.id, config);
        }
        return playSocketed(object, config);
    });
    return seq;
}

/**
 * Public entry point to play the coordinated multi-client warp mask effect.
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
 * Public entry point to stop all active warp token mask sessions.
 */
async function stop(object, config = {}) {
    const masks = object.document.getFlag('eskie-macros', 'token-masks') ?? {};
    const activeAnimationIds = Object.keys(masks);
    if (activeAnimationIds.length > 0) {
        for (const [animationId, tileIds] of Object.entries(masks)) {
            await socketlib.executeForEveryone('playWarpTokenMaskLocal', object.id, tileIds, game.user.id, {
                ...config,
                toggleOff: true,
                animationId
            });

            // Clean up the database immediately via GM
            await socketlib.executeAsGM('cleanUpTokenMask', object.id, animationId, tileIds, config.deleteObject ?? false);

            // Resolve tracker if present on this client
            const tracker = tokenMaskTracker.get(animationId);
            if (tracker) {
                tracker.resolve();
            }
        }
    }

    return stopLocal(object, config);
}

export const warpTokenMaskEffect = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

export { createLocal, playLocal, stopLocal, createMaskTiles };
