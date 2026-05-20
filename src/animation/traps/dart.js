/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { projectile } from './projectile.js';

async function create(tile, targets, config = {}) {
    return projectile.create(tile, targets, { projectileType: 'dart', ...config });
}

async function play(tile, targets, config = {}) {
    return projectile.play(tile, targets, { projectileType: 'dart', ...config });
}

async function stop(tile, config = {}) {
    return projectile.stop(tile, config);
}

async function setup(config = {}) {
    return projectile.setup({ projectileType: 'dart', playPath: 'eskie.traps.dart', ...config });
}

export const dart = {
    create,
    play,
    stop,
    setup,
    default_config: projectile.default_config,
};
