import { tokenMaskEffect } from "./token-mask.js";

const DEFAULT_CONFIG = {
    id: 'ShatteredTokenMask',
    deleteObject: false,
    center: true,
    color: 'white',
    rotation: 0,
    tint: undefined,
    callback: {}, // Used to add additional animations to the sequence.
    overlay: {    // Used to override the default overlay assets
        token: undefined,
        reveal: undefined,
    }
};

async function create(object, config = {}) {
    const { id, deleteObject, center, color, rotation, tint, callback, overlay } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const tokenOverlay = overlay.token ?? `eskie.wounds.token_mask.shatter.${center ? 'center' : 'side'}.01.${color}.no_base`;
    const revealOverlay = overlay.reveal ?? `eskie.texture_mask.tile_base.shatter.${center ? 'center' : 'side'}.01`;
    return tokenMaskEffect.create(object, { id, deleteObject, tokenOverlay, revealOverlay, rotation, tint, callback, override: {} });
}

async function play(object, config = {}) {
    const seq = await create(object, config);
    if (seq) return seq.play();
}

async function stop(object, config = {}) {
    const { id, deleteObject, center, color, rotation, callback, overlay } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const tokenOverlay = overlay.token ?? `eskie.wounds.token_mask.shatter.${center ? 'center' : 'side'}.01.${color}.no_base`;
    const revealOverlay = overlay.reveal ?? `eskie.texture_mask.tile_base.shatter.${center ? 'center' : 'side'}.01`;
    return tokenMaskEffect.stop(object, { id, deleteObject, tokenOverlay, revealOverlay, rotation, callback });
}

export const shatterMask = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};