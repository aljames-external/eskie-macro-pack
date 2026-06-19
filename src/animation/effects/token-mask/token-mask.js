//Last Updated: 1/09/2026
//Author: .eskie

import { time } from '../../../lib/time.js';
import { closest } from '../../../lib/filemanager.js'
import { dependency } from '../../../lib/dependency.js';
import { socket } from '../../../integration/socketlib.js';
import { MODULE_TLA } from '../../../lib/constants.js';

const DEFAULT_CONFIG = {
    id: 'tokenMask',
    deleteToken: false,
    tokenOverlay: undefined,
    revealOverlay: undefined,
    rotation: 0,
    tint: 'none',
    tileIds: undefined,
    localOnly: false,
    initiatorUserId: undefined
}

export async function createTiles(token, config = {}) {
    const { revealOverlay, rotation, tint } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const revealOverlayConfig = closest(revealOverlay);
    let revealOverlayPath = revealOverlayConfig;
    try { revealOverlayPath = Sequencer.Database.getEntry(revealOverlayConfig).originalData; } catch (e) { revealOverlayPath = revealOverlayConfig; }
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

    // Create all tiles
    const [[tokenRevealMask], [sceneRevealMask], [tokenShapeMask]] = await Promise.all([
        socket.tile.create(overlayMaskUpdates),
        socket.tile.create(overlayMaskUpdates),
        socket.tile.create(tokenMaskUpdates)
    ]);

    // Ensure Foundry Tiles are generated are loaded
    function tilesRendered() { 
        return tokenRevealMask?._object?.sourceElement && 
               sceneRevealMask?._object?.sourceElement && 
               tokenShapeMask?._object?.mesh; 
    }
    await time.waitUntil(tilesRendered, { timeout: 5000 });

    // Reset videos to start
    tokenRevealMask._object.sourceElement.currentTime = 0;
    sceneRevealMask._object.sourceElement.currentTime = 0;
    return [tokenRevealMask, sceneRevealMask, tokenShapeMask];
}

async function create(token, config = {}) {
    dependency.required([{ id: 'token-attacher', ref: "Token Attacher" },
    { id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }]);

    const { id, deleteToken, revealOverlay, tokenOverlay, rotation, tint, tileIds, localOnly } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    if (!tokenOverlay || !revealOverlay) return console.warn(`${MODULE_TLA} | tokenMaskEffect: Missing required configuration 'tokenOverlay' or 'revealOverlay'. Effect aborted.`);

    const tokenOverlayConfig = closest(tokenOverlay);
    let tokenOverlayPath = tokenOverlayConfig;
    try { 
        const entry = Sequencer.Database.getEntry(tokenOverlayConfig, { softFail: true });
        tokenOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || tokenOverlayConfig);
    } catch (e) { 
        tokenOverlayPath = tokenOverlayConfig; 
    }

    const label = `${id} - ${token.id}`;
    
    // Use pre-created tiles if provided, otherwise create them
    const tiles = tileIds
        ? tileIds.map(tileId => canvas.scene.tiles.get(tileId))
        : await createTiles(token, { revealOverlay, rotation });
        
    const [tokenRevealMask, sceneRevealMask, tokenShapeMask] = tiles;
    const paddingXY = token.document.texture.scaleX;

    //Attach tiles to token
    await tokenAttacher.attachElementsToToken([tokenRevealMask, sceneRevealMask, tokenShapeMask], token, true);

    let seq = new Sequence();
    if (canvas.scene.background.src) {
        seq = seq.effect()
            .name(label)
            .file(canvas.scene.background.src)
            .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .persist()
            .belowTokens()
            .mask(sceneRevealMask._object)
            .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
    }

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

        .animation()
        .delay(250)
        .on(token)
        .opacity(0)
        .show(false)

        .wait(250)

        .thenDo(async () => {
            if (localOnly) {
                // Make all three video masks visible ONLY locally on this client
                tokenRevealMask._object.alpha = 1;
                sceneRevealMask._object.alpha = 1;
                tokenShapeMask._object.alpha = 1;

                tokenRevealMask._object.sourceElement.currentTime = 0;
                tokenRevealMask._object.sourceElement.play().catch(() => {});
                sceneRevealMask._object.sourceElement.currentTime = 0;
                sceneRevealMask._object.sourceElement.play().catch(() => {});
            } else {
                // Instantly show both video masks on all clients in a single batch database update
                await canvas.scene.updateEmbeddedDocuments("Tile", [
                    { _id: sceneRevealMask.id, alpha: 1 },
                    { _id: tokenRevealMask.id, alpha: 1 }
                ]);
                // Play both video masks in perfect, simultaneous synchronization on all clients via socketlib
                await socket.tile.playVideo([tokenRevealMask.id, sceneRevealMask.id]);
            }
        })

        .effect()
        .file(tokenOverlayPath)
        .attachTo(token, { bindAlpha: false, bindVisibility: false, bindRotation: false })
        .mask(tokenShapeMask._object)
        .rotate(-rotation)
        .scaleToObject(paddingXY)
        .zIndex(1)
        .waitUntilFinished()

        .thenDo(async () => {
            if (localOnly) {
                // Hide tiles locally
                tokenRevealMask._object.visible = false;
                sceneRevealMask._object.visible = false;
                tokenShapeMask._object.visible = false;

                await Sequencer.EffectManager.endEffects({ name: label });

                const eskieModule = game.modules.get('eskie-macros');
                if (eskieModule?.socketlib && config.initiatorUserId) {
                    await eskieModule.socketlib.executeForUsers('saoShatterClientDone', [config.initiatorUserId], token.id, game.user.id);
                } else {
                    // Fallback for standalone/no-socket
                    await time.wait(1000);
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
                // Instantly hide the tiles on all clients to prevent visual duplication
                // and keep their PIXI meshes intact while the effect is ending
                await canvas.scene.updateEmbeddedDocuments("Tile", [
                    { _id: sceneRevealMask.id, hidden: true },
                    { _id: tokenShapeMask.id, hidden: true },
                    { _id: tokenRevealMask.id, hidden: true }
                ]);

                // End the effects on all clients
                await Sequencer.EffectManager.endEffects({ name: label });

                // Wait for other clients to receive the endEffects signal and remove it from their rendering trees
                await time.wait(1000);

                // Safely delete the tiles from the database now that no client is rendering them
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
        });

    if (localOnly) {
        return seq.play({ remote: false });
    }
    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
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
    default_config: DEFAULT_CONFIG,
}