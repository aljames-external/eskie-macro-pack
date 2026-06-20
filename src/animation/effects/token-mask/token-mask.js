//Last Updated: 2026-06-20
//Author: .eskie

import { time } from '../../../lib/time.js';
import { closest } from '../../../lib/filemanager.js';
import { dependency } from '../../../lib/dependency.js';
import { socket } from '../../../integration/socketlib.js';
import { MODULE_ID } from '../../../lib/constants.js';

const DEFAULT_CONFIG = {
    id: 'tokenMask',
    deleteToken: false,
    tokenOverlay: undefined,    // Internal use only
    revealOverlay: undefined,   // Internal use only
    rotation: 0,
    tint: 'none',
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

    const overlayMaskUpdates = {
        "texture.src": revealOverlayPath,
        "alpha": 0,
        "hidden": false,
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
        "hidden": false,
        "x": token.x,
        "y": token.y,
        "rotation": token.document.rotation,
        "width": canvas.grid.size * token.document.width,
        "height": canvas.grid.size * token.document.height,
    };

    // Create all tiles in database
    const [[tokenRevealMask], [sceneRevealMask], [tokenShapeMask]] = await Promise.all([
        socket.tile.create(overlayMaskUpdates),
        socket.tile.create(overlayMaskUpdates),
        socket.tile.create(tokenMaskUpdates)
    ]);

    return [tokenRevealMask, sceneRevealMask, tokenShapeMask];
}

async function create(token, config = {}) {
    if (!token) {
        ui.notifications?.warn("Eskie Macros | No token provided or selected.");
        return console.warn("EMP | tokenMaskEffect: No token provided. Effect aborted.");
    }

    dependency.required([
        { id: 'token-attacher', ref: "Token Attacher" },
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
        if (!tokenOverlay) return console.warn(`EMP | tokenMaskEffect: Missing required configuration 'tokenOverlay'. Effect aborted.`);
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
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        let retries = 0;
        const maxRetries = 50;
        while (tileIds.some(tileId => !canvas.scene.tiles.has(tileId)) && retries < maxRetries) {
            await sleep(100);
            retries++;
        }
        tiles = tileIds.map(tileId => canvas.scene.tiles.get(tileId));
    } else {
        tiles = await createTiles(token, { revealOverlay, rotation });
    }

    const [tokenRevealMask, sceneRevealMask, tokenShapeMask] = tiles;
    if (!tokenRevealMask || !sceneRevealMask || !tokenShapeMask) {
        return console.warn(`EMP | tokenMaskEffect: Failed to resolve all three tiles. Effect aborted.`);
    }

    // Wait for PIXI objects and video elements to render on this client
    function tilesRendered() { 
        return tokenRevealMask?._object?.sourceElement && 
               sceneRevealMask?._object?.sourceElement && 
               tokenShapeMask?._object?.mesh; 
    }
    
    try {
        await time.waitUntil(tilesRendered, { timeout: 5000 });
    } catch (err) {
        console.error("EMP | tokenMaskEffect | TIMEOUT waiting for local PIXI rendering!", err);
        throw err;
    }

    // Reset videos to start
    tokenRevealMask._object.sourceElement.currentTime = 0;
    sceneRevealMask._object.sourceElement.currentTime = 0;

    const paddingXY = token.document.texture.scaleX;

    // Attach tiles to token
    await tokenAttacher.attachElementsToToken([tokenRevealMask, sceneRevealMask, tokenShapeMask], token, true);

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
            .mask(sceneRevealMask._object)
            .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
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
    if (tint) seq = seq.tint(tint);
    seq = seq
        .attachTo(token, { bindAlpha: false, bindVisibility: false, bindRotation: true })
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-token.document.rotation)
        .mask(tokenRevealMask._object)
        .persist()

        .wait(250)

        .thenDo(async () => {
            if (localOnly) {
                // Make tiles visible and play videos completely locally
                tokenRevealMask._object.alpha = 1;
                sceneRevealMask._object.alpha = 1;
                tokenShapeMask._object.alpha = 1;

                tokenRevealMask._object.sourceElement.currentTime = 0;
                tokenRevealMask._object.sourceElement.play().catch(err => {});
                sceneRevealMask._object.sourceElement.currentTime = 0;
                sceneRevealMask._object.sourceElement.play().catch(err => {});
            } else {
                // Instantly show both video masks on all clients in a single database update
                await canvas.scene.updateEmbeddedDocuments("Tile", [
                    { _id: sceneRevealMask.id, alpha: 1 },
                    { _id: tokenRevealMask.id, alpha: 1 }
                ]);
            }
        })

        .effect()
        .file(tokenOverlayPath)
        .attachTo(token, { bindAlpha: false, bindVisibility: false, bindRotation: false })
        .mask(tokenShapeMask._object)
        .rotate(-rotation)
        .scaleToObject(paddingXY)
        .zIndex(1);

    if (callback.tokenOverlay) seq = callback.tokenOverlay(seq);

    seq = seq.waitUntilFinished()
        .thenDo(async () => {
            if (localOnly) {
                // Hide tiles locally
                tokenRevealMask._object.visible = false;
                sceneRevealMask._object.visible = false;
                tokenShapeMask._object.visible = false;

                await Sequencer.EffectManager.endEffects({ name: label });

                if (eskieModule?.socketlib && config.initiatorUserId) {
                    await eskieModule.socketlib.executeForUsers('tokenMaskClientDone', [config.initiatorUserId], token.id, game.user.id, config.animationId);
                } else {
                    // Fallback for standalone/no-socket localOnly
                    if (deleteToken) {
                        await token.document.delete();
                    } else {
                        await Promise.all([
                            socket.tile.destroy(tokenRevealMask.id),
                            socket.tile.destroy(tokenShapeMask.id),
                            socket.tile.destroy(sceneRevealMask.id),
                        ]);
                    }
                }
            } else {
                // Standalone / Non-socketed cleanup
                await socket.tile.destroy([tokenShapeMask.id]);
                await socket.tile.edit(tokenRevealMask.id, { alpha: 0 });
                await Sequencer.EffectManager.endEffects({ name: label });
                await canvas.tokens.get(token.id)?.document.update({ alpha: 0 });

                if (deleteToken) {
                    await token.document.delete();
                } else {
                    await time.wait(500);
                    await socket.tile.destroy([tokenRevealMask.id, sceneRevealMask.id]);
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

    const animationId = randomID();

    // 1. Create the tiles in the database
    const tiles = await createTiles(token, { revealOverlay, rotation });
    const tileIds = tiles.map(t => t.id);

    // 2. Store tile IDs on the token flags as a backup
    await socket.token.edit(token.id, { [`flags.eskie-macros.token-masks.${animationId}`]: tileIds });

    // 3. Attach tiles to token
    if (typeof tokenAttacher !== 'undefined') {
        await tokenAttacher.attachElementsToToken(tiles, token, true);
    }

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
            console.warn(`EMP | tokenMaskEffect | Tracker TIMEOUT hit for token ${token.id} (Session: ${animationId})! Cleaning up.`);
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