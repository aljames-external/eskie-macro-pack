import { tokenMaskEffect } from "./token-mask.js";

const DEFAULT_CONFIG = {
    id: 'TearTokenMask',
    deleteToken: false,
    color: 'red',
    padding: 1,
    rotation: 0
};

async function create(token, config = {}) {
    const { id, deleteToken, color, padding, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const tokenOverlay = `eskie.wounds.token_mask.tear.01.${color}.no_base`;
    const revealOverlay = `eskie.texture_mask.tile_base.tear.01`;
    return tokenMaskEffect.create(token, {id, deleteToken, tokenOverlay, revealOverlay, padding, rotation});
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const { id, deleteToken, color, padding, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const tokenOverlay = `eskie.wounds.token_mask.tear.01.${color}.no_base`;
    const revealOverlay = `eskie.texture_mask.tile_base.tear.01`;
    return tokenMaskEffect.stop(token, {id, deleteToken, tokenOverlay, revealOverlay, padding, rotation});
}

export const tearMask = {
    create,
    play,
    stop,
};