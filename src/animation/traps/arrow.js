/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { projectile } from './projectile.js';

async function create(tile, targets, config = {}) {
    return projectile.create(tile, targets, { projectileType: 'arrow', ...config });
}

async function play(tile, targets, config = {}) {
    return projectile.play(tile, targets, { projectileType: 'arrow', ...config });
}

async function stop(tile, config = {}) {
    return projectile.stop(tile, config);
}

async function setup(config = {}) {
    return projectile.setup({ projectileType: 'arrow', playPath: 'eskie.traps.arrow', ...config });
}

export const arrow = {
    create,
    play,
    stop,
    setup,
    default_config: projectile.default_config,
};
