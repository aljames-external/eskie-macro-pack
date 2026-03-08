import { tokenMaskEffect } from "./token-mask.js";

const DEFAULT_CONFIG = {
    id: 'SmokeTokenMask',
    deleteToken: false,
    color: 'blue',
    rotation: 0
};

async function create(token, config = {}) {
    const { id, deleteToken, color, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const tokenOverlay = `eskie.smoke.token_mask.01.${color}`;
    const revealOverlay = `eskie.texture_mask.tile_base.smoke.01`;
    return tokenMaskEffect.create(token, {id, deleteToken, tokenOverlay, revealOverlay, rotation});
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const { id, deleteToken, color, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const tokenOverlay = `eskie.smoke.token_mask.01.${color}`;
    const revealOverlay = `eskie.texture_mask.tile_base.smoke.01`;
    return tokenMaskEffect.stop(token, {id, deleteToken, tokenOverlay, revealOverlay, rotation});
}

export const smokeMask = {
    create,
    play,
    stop,
};