//Last Updated: 1/09/2026
//Author: .eskie

import { time } from '../../../lib/time.js';
import { file } from '../../../lib/filemanager.js'
import { dependency } from '../../../lib/dependency.js';
import { socket } from '../../../integration/socketlib.js';

const DEFAULT_CONFIG = {
    id: 'tokenMask',
    deleteToken: false,
    tokenOverlay: undefined,
    revealOverlay: undefined,
    padding: 1,
    rotation: 0
}

async function createTiles(token, config) {
    const { revealOverlay, padding, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const revealOverlayConfig = img(revealOverlay);
    let revealOverlayPath = revealOverlayConfig;
    try { revealOverlayPath = Sequencer.Database.getEntry(revealOverlayConfig).originalData; } catch(e) { revealOverlayPath = revealOverlayConfig; }

    const overlayMaskUpdates = {
        "texture.src": revealOverlayPath,
        "alpha": 0,
        "hidden": false,
        "x": token.x - (canvas.grid.size * token.document.width * (padding - 1) / 2),
        "y": token.y - (canvas.grid.size * token.document.width * (padding - 1) / 2),
        "video": {
            autoplay: false,
            loop: false,
            volume: 0
        },
        "width": canvas.grid.size * (token.document.width * padding),
        "height": canvas.grid.size * (token.document.width * padding),
        "rotation": rotation,
    };

    const tokenMaskUpdates = {
        "texture.src": token.document.texture.src,
        "alpha": 1,
        "hidden": false,
        "x": token.x,
        "y": token.y,
        "rotation": token.document.rotation,
        "width": canvas.grid.size * token.document.width,
        "height": canvas.grid.size * token.document.height,
        "texture.scaleX": token.document.texture.scaleX,
        "texture.scaleY": token.document.texture.scaleY,
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
    dependency.required({id: 'token-attacher', ref: "Token Attacher"});
    dependency.required({id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers"});

    const { id, deleteToken, revealOverlay, tokenOverlay, padding, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    if ( !tokenOverlay || !revealOverlay ) {
        throw new Error(`EMP | tokenMaskEffect: Missing required configuration 'tokenOverlay' or 'revealOverlay'. Effect aborted.`);
    }

    const label = `${id} - ${token.id}`;
    const tiles = await createTiles(token, {revealOverlay, padding, rotation});
    const [tokenRevealMask, sceneRevealMask, tokenShapeMask] = tiles;

    //Attach tiles to token
    await tokenAttacher.attachElementsToToken([tokenRevealMask, sceneRevealMask, tokenShapeMask], token, true);

    let seq = new Sequence();
    if (canvas.scene.background.src) {
        seq = seq.effect()
            .name(label)
            .file(canvas.scene.background.src)
            .atLocation({x:(canvas.dimensions.width)/2,y:(canvas.dimensions.height)/2})
            .size({width:canvas.scene.width/canvas.grid.size, height:canvas.scene.height/canvas.grid.size}, {gridUnits: true})
            .persist()
            .belowTokens()
            .mask(sceneRevealMask)
            .spriteOffset({x:-canvas.scene.background.offsetX,y:-canvas.scene.background.offsetY})
    }

    seq = seq.animation()
        .delay(250)
        .on(token)
        .opacity(0)
        .show(false)

    .effect()
        .name(label)
        .copySprite(token)
        .attachTo(token, {bindAlpha: false, bindVisibility: false, bindRotation: true})
        .scaleToObject(padding, {considerTokenScale:true})
        .spriteRotation(-token.document.rotation)
        .mask(tokenRevealMask)
        .persist()

    .wait(250)

    .thenDo(async () => {
        return Promise.all([
            sceneRevealMask.update({ alpha: 1, }),
            tokenRevealMask.update({
                alpha: 1,
                video: { autoplay: true, }
            })
        ]);
      })

    .effect()
      .file(file(tokenOverlay))
      .attachTo(token, {bindAlpha: false, bindVisibility: false, bindRotation: false})
      .mask(tokenShapeMask)
      .rotate(-rotation)
      .scaleToObject(padding)
      .zIndex(1)
      .waitUntilFinished()

    .thenDo(async () => {
        if (deleteToken) {
            await token.document.delete();
        } else {
            await Promise.all([
                socket.tile.destroy(tokenRevealMask.id),
                socket.tile.destroy(tokenShapeMask.id),
                socket.tile.destroy(sceneRevealMask.id),
            ]);
        }
        await Sequencer.EffectManager.endEffects({name: label})
    });

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    return seq?.play();
}

async function stop(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} - ${token.id}`;

    return Promise.all([
        new Sequence().animation().on(token).opacity(1).show(true).play(),
        Sequencer.EffectManager.endEffects({name: label})
    ]);
}

export const tokenMaskEffect = {
    create,
    play,
    stop,
}