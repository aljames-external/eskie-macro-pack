import { tokenMaskEffect } from "./token-mask.js";

const DEFAULT_CONFIG = {
    id: 'TearTokenMask',
    deleteObject: false,
    color: 'red',
    rotation: 0
};

async function create(object, config = {}) {
    const { id, deleteObject, color, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const tokenOverlay = `eskie.wounds.token_mask.tear.01.${color}.no_base`;
    const revealOverlay = `eskie.texture_mask.tile_base.tear.01`;
    return tokenMaskEffect.create(object, { id, deleteObject, tokenOverlay, revealOverlay, rotation });
}

async function play(object, config = {}) {
    const seq = await create(object, config);
    if (seq) return seq.play();
}

async function stop(object, config = {}) {
    const { id, deleteObject, color, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const tokenOverlay = `eskie.wounds.token_mask.tear.01.${color}.no_base`;
    const revealOverlay = `eskie.texture_mask.tile_base.tear.01`;
    return tokenMaskEffect.stop(object, { id, deleteObject, tokenOverlay, revealOverlay, rotation });
}

export const tearMask = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};