//Last Updated: 2026-06-20
//Author: .eskie

import { time } from '../../../lib/time.js';
import { tokens } from '../../../lib/tokens.js';
import { closest } from '../../../lib/filemanager.js';
import { dependency } from '../../../lib/dependency.js';
import { socket } from '../../../integration/socketlib.js';
import { MODULE_ID } from '../../../lib/constants.js';
import { log } from '../../../lib/logger.js';

const DEFAULT_CONFIG = {
    id: 'tokenMask',
    deleteToken: false,
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

export const pendingRuns = new Map();

export async function createTiles(token, config = {}) {
    const { revealOverlay, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const revealOverlayConfig = closest(revealOverlay);
    let revealOverlayPath = revealOverlayConfig;
    try { 
        const entry = Sequencer.Database.getEntry(revealOverlayConfig, { softFail: true });
        revealOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || revealOverlayConfig);
    } catch (e) { 
        revealOverlayPath = revealOverlayConfig; 
    }
    const scaleXY = token.document.texture.scaleX;

    const tokenRevealMaskUpdates = {
        "texture.src": revealOverlayPath,
        "alpha": 0,
        "hidden": true,
        "x": token.x - (canvas.grid.size * token.document.width * (scaleXY - 1) / 2),
        "y": token.y - (canvas.grid.size * token.document.height * (scaleXY - 1) / 2),
        "video": {
            autoplay: false,
            loop: false,
            volume: 0
        },
        "width": canvas.grid.size * (token.document.width * scaleXY),
        "height": canvas.grid.size * (token.document.height * scaleXY),
        "rotation": rotation,
    };

    const sceneRevealMaskUpdates = {
        "texture.src": revealOverlayPath,
        "alpha": 0,
        "hidden": true,
        "x": token.x - (canvas.grid.size * token.document.width * (scaleXY - 1) / 2),
        "y": token.y - (canvas.grid.size * token.document.height * (scaleXY - 1) / 2),
        "video": {
            autoplay: false,
            loop: false,
            volume: 0
        },
        "width": canvas.grid.size * (token.document.width * scaleXY),
        "height": canvas.grid.size * (token.document.height * scaleXY),
        "rotation": rotation,
    };

    const tokenMaskUpdates = {
        "texture": token.document.texture,
        "alpha": 1,
        "hidden": true,
        "x": token.x,
        "y": token.y,
        "rotation": token.document.rotation,
        "width": canvas.grid.size * token.document.width,
        "height": canvas.grid.size * token.document.height,
    };

    // Create all tiles in database
    const [[tokenRevealMask], [sceneRevealMask], [tokenShapeMask]] = await Promise.all([
        socket.tile.create(tokenRevealMaskUpdates),
        socket.tile.create(sceneRevealMaskUpdates),
        socket.tile.create(tokenMaskUpdates)
    ]);

    return [tokenRevealMask, sceneRevealMask, tokenShapeMask];
}

async function create(token, config = {}) {
    if (!token) {
        ui.notifications?.warn("Eskie Macros | No token provided or selected.");
        return log.warn("tokenMaskEffect: No token provided. Effect aborted.");
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
        console.warn("Eskie Macros | tokenMaskEffect | Warning: Running in an insecure context (HTTP). Advanced WebGL features like the Spritesheet Generator and sprite masks require a secure context and may fail or crash. Please connect using a secure address like https://<domain>:<port> or http://localhost:<port>.");
    }

    dependency.required([
        { id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }
    ]);

    const { id, deleteToken, revealOverlay, tokenOverlay, rotation, tint, callback, tileIds, localOnly } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // If localOnly is false and socketlib is available, coordinate the multi-client animation
    const eskieModule = game.modules.get(MODULE_ID);
    if (!localOnly && eskieModule?.socketlib) {
        let seq = new Sequence();
        seq.thenDo(async () => {
            return playSocketed(token, config);
        });
        return seq;
    }

    // Otherwise, build the real local animation sequence
    let tokenOverlayPath = config.tokenOverlayPath;
    if (!tokenOverlayPath) {
        if (!tokenOverlay) return log.warn(`tokenMaskEffect: Missing required configuration 'tokenOverlay'. Effect aborted.`);
        const tokenOverlayConfig = closest(tokenOverlay);
        tokenOverlayPath = tokenOverlayConfig;
        try { 
            const entry = Sequencer.Database.getEntry(tokenOverlayConfig, { softFail: true });
            tokenOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || tokenOverlayConfig);
        } catch (e) { 
            tokenOverlayPath = tokenOverlayConfig; 
        }
    }

    const label = `${id} - ${token.id}`;

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
        tiles = await createTiles(token, { revealOverlay, rotation });
    }

    const [tokenRevealMask, sceneRevealMask, tokenShapeMask] = tiles;
    if (!tokenRevealMask || !sceneRevealMask || !tokenShapeMask) {
        return log.warn(`tokenMaskEffect: Failed to resolve all three tiles. Effect aborted.`);
    }

    // Wait for PIXI objects and video elements to render on this client
    function tilesRendered() { 
        return tokenRevealMask?.object?.sourceElement && 
               sceneRevealMask?.object?.sourceElement && 
               tokenShapeMask?.object?.mesh; 
    }
    
    try {
        await time.waitUntil(tilesRendered, { timeout: 5000 });
    } catch (err) {
        log.error("tokenMaskEffect | TIMEOUT waiting for local PIXI rendering!", err);
        throw err;
    }

    // Reset videos to start
    tokenRevealMask.object.sourceElement.currentTime = 0;
    sceneRevealMask.object.sourceElement.currentTime = 0;

    const paddingXY = token.document.texture.scaleX;

    // Attach tiles to token
    await tokens.attachElements([tokenRevealMask, sceneRevealMask, tokenShapeMask], token);

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

    // Token clone
    seq = seq.animation()
        .delay(250)
        .on(token)
        .opacity(0)
        .show(false);

    seq = seq.effect()
        .name(label)
        .copySprite(token);
    if (tint && tint !== 'none') seq = seq.tint(tint);
    seq = seq
        .attachTo(token, { bindAlpha: false, bindVisibility: false, bindRotation: true })
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-token.document.rotation)
        .mask(tokenRevealMask)
        .persist()
        .locally(localOnly)

        .wait(250)

        .thenDo(async () => {
            if (game.user.isGM) {
                return Promise.all([
                    sceneRevealMask.update({ alpha: 1, hidden: false, video: { autoplay: true } }),
                    tokenRevealMask.update({
                        alpha: 1,
                        hidden: false,
                        video: { autoplay: true }
                    })
                ]);
            }
        })

        .effect()
        .file(tokenOverlayPath)
        .attachTo(token, { bindAlpha: false, bindVisibility: false, bindRotation: false })
        .mask(tokenShapeMask)
        .rotate(-rotation)
        .scaleToObject(paddingXY)
        .zIndex(1);

    if (callback.tokenOverlay) seq = callback.tokenOverlay(seq);

    seq = seq.waitUntilFinished()
        .thenDo(async () => {
            // Instantly hide tiles locally to prevent them from flickering while database deletion syncs
            if (tokenRevealMask.object) tokenRevealMask.object.visible = false;
            if (sceneRevealMask.object) sceneRevealMask.object.visible = false;
            if (tokenShapeMask.object) tokenShapeMask.object.visible = false;

            // If the token is going to be deleted, hide it locally as well to prevent it from popping back
            if (deleteToken && token.object) {
                token.object.visible = false;
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

            await tokens.detachElements([tokenRevealMask, sceneRevealMask, tokenShapeMask], token);

            if (!config.animationId) {
                // Standalone run: clean up database immediately
                if (deleteToken) {
                    await token.document.delete();
                } else {
                    await Promise.all([
                        socket.tile.destroy(tokenRevealMask.id),
                        socket.tile.destroy(tokenShapeMask.id),
                        socket.tile.destroy(sceneRevealMask.id),
                    ]);
                }
            } else {
                // Coordinated run: report completion to GM initiator
                if (eskieModule?.socketlib && config.initiatorUserId) {
                    await eskieModule.socketlib.executeForUsers('tokenMaskClientDone', [config.initiatorUserId], token.id, game.user.id, config.animationId);
                }
            }
        });

    return seq;
}

/**
 * Coordinated play function that broadcasts local playback to all clients.
 */
async function playSocketed(token, config = {}) {
    const eskieModule = game.modules.get(MODULE_ID);
    if (!eskieModule?.socketlib) return;

    const { id, deleteToken, revealOverlay, tokenOverlay, rotation, tint } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Pre-resolve paths
    const tokenOverlayConfig = closest(tokenOverlay);
    let tokenOverlayPath = tokenOverlayConfig;
    try { 
        const entry = Sequencer.Database.getEntry(tokenOverlayConfig, { softFail: true });
        tokenOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || tokenOverlayConfig);
    } catch (e) {}

    const revealOverlayConfig = closest(revealOverlay);
    let revealOverlayPath = revealOverlayConfig;
    try { 
        const entry = Sequencer.Database.getEntry(revealOverlayConfig, { softFail: true });
        revealOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || revealOverlayConfig);
    } catch (e) {}

    const animationId = foundry.utils.randomID();

    // 1. Create the tiles in the database
    const tiles = await createTiles(token, { revealOverlay, rotation });
    const tileIds = tiles.map(t => t.id);

    // 2. Store tile IDs on the token flags as a backup
    await socket.token.edit(token.id, { [`flags.eskie-macros.token-masks.${animationId}`]: tileIds });

    // 3. Attach tiles to token
    await tokens.attachElements(tiles, token);

    // 4. Set up the tracking promise for all active users
    globalThis.eskie = globalThis.eskie || {};
    globalThis.eskie.tokenMaskTracker = globalThis.eskie.tokenMaskTracker || new Map();

    const activeUserIds = game.users.filter(u => u.active).map(u => u.id);
    
    let resolvePromise;
    const promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    // Safety timeout (15 seconds)
    const timeoutId = setTimeout(async () => {
        const tracker = globalThis.eskie.tokenMaskTracker.get(animationId);
        if (tracker) {
            log.warn(`tokenMaskEffect | Tracker TIMEOUT hit for token ${token.id} (Session: ${animationId})! Cleaning up.`);
            globalThis.eskie.tokenMaskTracker.delete(animationId);
            const eskieModule = game.modules.get(MODULE_ID);
            if (eskieModule?.socketlib) {
                await eskieModule.socketlib.executeAsGM("cleanUpTokenMask", token.id, animationId, tracker.tileIds, tracker.deleteToken);
            }
            resolvePromise();
        }
    }, 15000);

    globalThis.eskie.tokenMaskTracker.set(animationId, {
        expected: new Set(activeUserIds),
        received: new Set(),
        tileIds: tileIds,
        deleteToken: deleteToken,
        resolve: () => {
            clearTimeout(timeoutId);
            resolvePromise();
        }
    });

    // 5. Broadcast play event to all active clients
    await eskieModule.socketlib.executeForEveryone(
        'playTokenMaskLocal',
        token.id,
        tileIds,
        game.user.id,
        {
            id,
            rotation,
            tint,
            tokenOverlayPath,
            revealOverlayPath,
            animationId,
            deleteToken
        }
    );

    // 6. Wait for all clients to report completion
    return promise;
}

async function play(token, config = {}) {
    // If running locally as part of a multi-client run, play locally without broadcasting
    if (config.localOnly) {
        const seq = await create(token, config);
        if (seq) return seq.play({ remote: false });
        return;
    }

    // Otherwise, trigger the coordinating play flow (which wraps the sequence and broadcasts it)
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const eskieModule = game.modules.get(MODULE_ID);
    if (eskieModule?.socketlib && !config.localOnly) {
        // Stop all active token mask sessions currently registered on this token
        const masks = token.document.getFlag('eskie-macros', 'token-masks') || {};
        const activeAnimationIds = Object.keys(masks);
        if (activeAnimationIds.length > 0) {
            for (const [animationId, tileIds] of Object.entries(masks)) {
                await eskieModule.socketlib.executeForEveryone('playTokenMaskLocal', token.id, tileIds, game.user.id, {
                    ...config,
                    toggleOff: true,
                    animationId
                });
            }
        }
    }

    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id} - ${token.id}`;

    return Promise.all([
        new Sequence().animation().on(token).opacity(1).show(true).play(),
        Sequencer.EffectManager.endEffects({ name: label })
    ]);
}

export const tokenMaskEffect = {
    create,
    play,
    stop,
    createTiles,
    pendingRuns,
    default_config: DEFAULT_CONFIG,
};