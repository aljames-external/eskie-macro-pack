//Last Updated: 1/09/2026
//Author: .eskie

import { time } from '../../../lib/time.js';
import { closest } from '../../../lib/filemanager.js'
import { dependency } from '../../../lib/dependency.js';
import { socket } from '../../../integration/socketlib.js';

const DEFAULT_CONFIG = {
    id: 'tokenMask',
    deleteToken: false,
    tokenOverlay: undefined,    // Internal use only - these functions generally not called by the end user
    revealOverlay: undefined,   // Internal use only - these functions generally not called by the end user
    rotation: 0,
    tint: 'none',
    callback: {} // Optional callback functions for customisation
}

async function createTiles(token, config = {}) {
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
    function tilesRendered() { return tokenRevealMask?._object?.sourceElement && sceneRevealMask?._object?.sourceElement; }
    await time.waitUntil(tilesRendered, { timeout: 5000 });

    // Reset videos to start
    tokenRevealMask._object.sourceElement.currentTime = 0;
    sceneRevealMask._object.sourceElement.currentTime = 0;
    return [tokenRevealMask, sceneRevealMask, tokenShapeMask];
}

async function create(token, config = {}) {
    dependency.required([
        { id: 'token-attacher', ref: "Token Attacher" },
        { id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }
    ]);

    const { id, deleteToken, revealOverlay, tokenOverlay, rotation, tint, callback } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    if (!tokenOverlay || !revealOverlay)
        return console.warn(`EMP | tokenMaskEffect: Missing required configuration.`);

    const label = `${id} - ${token.id}`;
    const tiles = await createTiles(token, { revealOverlay, rotation });
    const [tokenRevealMask, sceneRevealMask, tokenShapeMask] = tiles;
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
            .mask(sceneRevealMask)
            .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
    }

    // Token clone
    seq = seq.animation()
        .delay(250)
        .on(token)
        .opacity(0)
        .show(false)

        .effect()
        .name(label)
        .copySprite(token);
    if (tint) seq = seq.tint(tint);
    seq = seq
        .attachTo(token, { bindAlpha: false, bindVisibility: false, bindRotation: true })
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-token.document.rotation)
        .mask(tokenRevealMask)
        .persist()

        .wait(250)

        .thenDo(async () => {
            return Promise.all([
                sceneRevealMask.update({ alpha: 1 }),
                tokenRevealMask.update({
                    alpha: 1,
                    video: { autoplay: true }
                })
            ]);
        })

        .effect()
        .file(closest(tokenOverlay))
        .attachTo(token, { bindAlpha: false, bindVisibility: false, bindRotation: false })
        .mask(tokenShapeMask)
        .rotate(-rotation)
        .scaleToObject(paddingXY)
        .zIndex(1);
    // Additional customization of the token overlay
    if (callback.tokenOverlay) seq = callback.tokenOverlay(seq)
// Inside token-mask.js -> create() function

seq = seq.waitUntilFinished()
    .thenDo(async () => {
        // 1. Immediately destroy the overlay shape mask
        await socket.tile.destroy([tokenShapeMask.id]);
        // 2. Hide the token reveal mask so the shattered sprite disappears cleanly
        await socket.tile.edit(tokenRevealMask.id, { alpha: 0 });
        // 3. Clean up the local Sequencer sprite/color effects completely
        await Sequencer.EffectManager.endEffects({ name: label });
        
        // 4. If the token needs to be deleted, delete it NOW while sceneRevealMask is still alpha: 1 covering the canvas
        if (deleteToken) {
            await token.document.delete();
        }
        
        // 5. Provide a minor, safer 300ms gap for the database deletion to propagate to clients
        await time.wait(300);
        
        // 6. FINALLY destroy the lingering mask tiles after everything else is gone
        await socket.tile.destroy([tokenRevealMask.id, sceneRevealMask.id]);
    });

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
};