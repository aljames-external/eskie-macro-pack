//Last Updated: 2026-06-23
//Author: .eskie

import { object as objectAttachment, getDocumentName } from '../../lib/object.js';
import { absolutePath } from '../../lib/filemanager.js';
import { dependency } from '../../lib/dependency.js';
import { socketlib } from '../../integration/socketlib.js';
import { MODULE_ID } from '../../lib/constants.js';
import { log } from '../../lib/logger.js';

const DEFAULT_CONFIG = {
    id: 'tokenMask',
    deleteObject: false,
    tokenOverlay: undefined,    // Internal use only
    revealOverlay: undefined,   // Internal use only
    rotation: 0,
    tint: undefined,
    callback: {},               // Optional callback functions for customisation
    localOnly: false,
    tokenOverlayPath: undefined,
    revealOverlayPath: undefined,
}

/**
 * Builds the local visual animation sequence on the client using pure Sequencer effects.
 * Uses Sequencer's native masking capabilities to avoid any database tile overhead.
 */
async function createLocal(object, config = {}) {
    if (!object) {
        ui.notifications?.warn("Eskie Macros | No token or tile provided or selected.");
        return log.warn("tokenMaskEffect.createLocal: No object provided. Effect aborted.");
    }

    const isToken = getDocumentName(object) === 'Token';
    const isTile = getDocumentName(object) === 'Tile';
    if (!isToken && !isTile) {
        ui.notifications?.warn("Eskie Macros | Provided object is not a Token or a Tile.");
        return log.warn("tokenMaskEffect.createLocal: Invalid object type. Effect aborted.");
    }

    const { id, deleteObject, revealOverlay, tokenOverlay, rotation, tint, callback } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    let tokenOverlayPath = config.tokenOverlayPath;
    if (!tokenOverlayPath) {
        if (!tokenOverlay) return log.warn(`tokenMaskEffect.createLocal: Missing required configuration 'tokenOverlay'. Effect aborted.`);
        tokenOverlayPath = absolutePath(tokenOverlay);
    }

    let revealOverlayPath = config.revealOverlayPath;
    if (!revealOverlayPath) {
        if (!revealOverlay) return log.warn(`tokenMaskEffect.createLocal: Missing required configuration 'revealOverlay'. Effect aborted.`);
        revealOverlayPath = absolutePath(revealOverlay);
    }

    const label = `${id} - ${object.id}`;
    const scaleXY = object.document.texture.scaleX;

    let seq = new Sequence();

    // Preload the video assets in the browser cache before starting the animation
    await Sequencer.Preloader.preload([tokenOverlayPath, revealOverlayPath]);

    // 1. Define the mask effects. Because they are assigned as masks to other effects,
    // PIXI automatically prevents them from rendering on the screen directly.
    // They are 100% invisible to both GM and players, but fully functional!

    let sceneMaskEffect;
    if (canvas.scene.background.src) {
        const widthAdjustment = isToken ? canvas.grid.size : 1;
        const tileWidth = (widthAdjustment * object.document.width) * scaleXY;
        const tileHeight = (widthAdjustment * object.document.height) * scaleXY;
        const tileX = object.x - (widthAdjustment * object.document.width * (scaleXY - 1) / 2);
        const tileY = object.y - (widthAdjustment * object.document.height * (scaleXY - 1) / 2);

        // Pre-create the background mask effect
        sceneMaskEffect = seq.effect()
            .file(revealOverlayPath)
            .atLocation({
                x: tileX + (tileWidth / 2),
                y: tileY + (tileHeight / 2)
            })
            .size({ width: tileWidth / canvas.grid.size, height: tileHeight / canvas.grid.size }, { gridUnits: true })
            .rotate(rotation)
            .persist()
            .locally(true);
    }

    // Pre-create the token clone mask effect
    const objectRevealMaskEffect = seq.effect()
        .file(revealOverlayPath)
        .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: true })
        .scaleToObject(scaleXY, { considerTokenScale: true })
        .rotate(rotation)
        .persist()
        .locally(true);

    // Pre-create the token shape mask effect for the burn texture overlay
    const shapeMaskEffect = seq.effect()
        .copySprite(object)
        .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: true })
        .persist()
        .locally(true);

    // 2. Play the background reveal
    if (canvas.scene.background.src && sceneMaskEffect) {
        seq = seq.effect()
            .name(label)
            .file(canvas.scene.background.src)
            .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .persist()
            .belowTokens()
            .mask(sceneMaskEffect)
            .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
            .locally(true);
    }

    // 3. Hide the real token/tile on the canvas locally (purely visual, no database updates!)
    seq = seq.animation()
        .delay(250)
        .on(object)
        .opacity(0)
        .show(false);

    // 4. Play the masked token clone (copySprite)
    seq = seq.effect()
        .name(label)
        .copySprite(object);
    if (tint && tint !== 'none') seq = seq.tint(tint);
    seq = seq
        .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: true })
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-object.document.rotation)
        .mask(objectRevealMaskEffect)
        .persist()
        .locally(true);

    // 5. Play the colorful flame edge of the transition in perfect sync on top of the clone
    seq = seq.effect()
        .name(label)
        .file(revealOverlayPath)
        .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: true })
        .scaleToObject(scaleXY, { considerTokenScale: true })
        .rotate(rotation)
        .zIndex(2)
        .locally(true);

    // 6. Play the masked burn texture overlay
    seq = seq.wait(250)
        .effect()
        .file(tokenOverlayPath)
        .attachTo(object, { bindAlpha: false, bindVisibility: false, bindRotation: false })
        .mask(shapeMaskEffect)
        .rotate(-rotation)
        .scaleToObject(scaleXY)
        .zIndex(1);

    if (callback.tokenOverlay) seq = callback.tokenOverlay(seq);

    // 7. Handle cleanup and token deletion at the end of the sequence
    seq = seq.waitUntilFinished()
        .thenDo(async () => {
            // End all active effects in this session
            await Sequencer.EffectManager.endEffects({ name: label });

            if (deleteObject) {
                // Instantly hide the token locally to prevent any visual popping before deletion completes
                if (object.object) object.object.visible = false;
                
                if (game.user.isGM) {
                    await object.document.delete();
                } else {
                    await socketlib.executeAsGM('deleteTokenGM', object.id);
                }
            }
        });

    return seq;
}

/**
 * Builds a local animation sequence. Matches Sequencer API.
 */
async function create(object, config = {}) {
    return createLocal(object, config);
}

/**
 * Public entry point to play the coordinated multi-client effect.
 * Broadcasts to all clients, playing the animation in perfect sync locally.
 */
async function play(object, config = {}) {
    const { id, deleteObject, revealOverlay, tokenOverlay, rotation, tint, localOnly } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Pre-resolve paths to avoid client-side file lookups
    const tokenOverlayPath = absolutePath(tokenOverlay);
    const revealOverlayPath = absolutePath(revealOverlay);

    const playConfig = {
        id,
        deleteObject,
        rotation,
        tint,
        tokenOverlayPath,
        revealOverlayPath,
    };

    if (localOnly) {
        return playLocal(object, playConfig);
    }

    // Broadcast play event to all active clients
    return socketlib.executeForEveryone('playTokenMaskLocal', object.id, playConfig);
}

/**
 * Internal entry point to play the local animation sequence on this client.
 */
async function playLocal(object, config = {}) {
    const seq = await createLocal(object, config);
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
    const { id, localOnly } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    if (localOnly) {
        return stopLocal(object, config);
    }

    return socketlib.executeForEveryone('playTokenMaskLocal', object.id, {
        ...config,
        toggleOff: true
    });
}

export const tokenMaskEffect = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

export { createLocal, playLocal, stopLocal };