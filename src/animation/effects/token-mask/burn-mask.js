import { tokenMaskEffect } from "./token-mask.js";

const DEFAULT_CONFIG = {
    id: 'BurningTokenMask',
    deleteObject: false,
    speed: 'fast',
    color: 'orange',
    rotation: 0
};

async function create(object, config = {}) {
    const { id, deleteObject, speed, color, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const tokenOverlay = `eskie.burn.token_mask.${color}.no_base.${speed}.01`;
    const revealOverlay = `eskie.texture_mask.tile_base.burn.01.${speed}`;
    return tokenMaskEffect.create(object, { id, deleteObject, tokenOverlay, revealOverlay, rotation });
}

async function play(object, config = {}) {
    const seq = await create(object, config);
    if (seq) return seq.play();
}

async function stop(object, config = {}) {
    const { id, deleteObject, speed, color, rotation } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const tokenOverlay = `eskie.burn.token_mask.${color}.no_base.${speed}.01`;
    const revealOverlay = `eskie.texture_mask.tile_base.burn.01.${speed}`;
    return tokenMaskEffect.stop(object, { id, deleteObject, tokenOverlay, revealOverlay, rotation });
}

export const burnMask = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

