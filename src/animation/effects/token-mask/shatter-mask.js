import { tokenMaskEffect } from "./token-mask.js";

const DEFAULT_CONFIG = {
    id: 'ShatteredTokenMask',
    deleteToken: false,
    center: true,
    color: 'white',
    rotation: 0,
    tint: undefined
};

async function create(token, config = {}) {
    const { id, deleteToken, center, color, rotation, tint } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const tokenOverlay = `eskie.wounds.token_mask.shatter.${center ? 'center' : 'side'}.01.${color}.no_base`;
    const revealOverlay = `eskie.texture_mask.tile_base.shatter.${center ? 'center' : 'side'}.01`;
    return tokenMaskEffect.create(token, { id, deleteToken, tokenOverlay, revealOverlay, rotation, tint });
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const { id, deleteToken, center, color, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const tokenOverlay = `eskie.wounds.token_mask.shatter.${center ? 'center' : 'side'}.01.${color}.no_base`;
    const revealOverlay = `eskie.texture_mask.tile_base.shatter.${center ? 'center' : 'side'}.01`;
    return tokenMaskEffect.stop(token, { id, deleteToken, tokenOverlay, revealOverlay, rotation });
}

export const shatterMask = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};