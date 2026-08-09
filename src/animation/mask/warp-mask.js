import { warpTokenMaskEffect } from "./warp-token-mask.js";

const DEFAULT_CONFIG = {
    id: 'WarpTokenMask',
    deleteObject: false,
    color: 'purple',
    scale: 1,
    portal: {
        scale: undefined
    },
    persistDuration: 500,
    rotation: 0,
    tint: undefined,
    callback: {}
};

async function create(object, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return warpTokenMaskEffect.create(object, { ...mergedConfig, ...config, mode: 'out' });
}

async function play(object, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return warpTokenMaskEffect.play(object, { ...mergedConfig, ...config, mode: 'out' });
}

async function stop(object, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return warpTokenMaskEffect.play(object, { ...mergedConfig, ...config, mode: 'in' });
}

async function clean(object, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return warpTokenMaskEffect.stop(object, { ...mergedConfig, ...config });
}

async function createWarpOut(object, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return warpTokenMaskEffect.create(object, { ...mergedConfig, ...config, mode: 'out' });
}

async function playWarpOut(object, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return warpTokenMaskEffect.play(object, { ...mergedConfig, ...config, mode: 'out' });
}

async function createWarpIn(object, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return warpTokenMaskEffect.create(object, { ...mergedConfig, ...config, mode: 'in' });
}

async function playWarpIn(object, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return warpTokenMaskEffect.play(object, { ...mergedConfig, ...config, mode: 'in' });
}

export const warpMask = {
    create,
    play,
    stop,
    clean,
    out: {
        create: createWarpOut,
        play: playWarpOut,
        default_config: { ...DEFAULT_CONFIG, mode: 'out' }
    },
    in: {
        create: createWarpIn,
        play: playWarpIn,
        default_config: { ...DEFAULT_CONFIG, mode: 'in' }
    },
    warpOut: {
        create: createWarpOut,
        play: playWarpOut,
        default_config: { ...DEFAULT_CONFIG, mode: 'out' }
    },
    warpIn: {
        create: createWarpIn,
        play: playWarpIn,
        default_config: { ...DEFAULT_CONFIG, mode: 'in' }
    },
    default_config: DEFAULT_CONFIG
};
