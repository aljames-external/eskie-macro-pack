/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);

    let seq = new Sequence();

    if (targets.length > 0) {
        targets.forEach(target => {
            const targetObject = target.object || target;
            const targetCenter = targetObject.center || target;
            const tilePlaceable = tile.object || tile;
            const pt = tilePlaceable.center || tilePlaceable;

            const distance = {
                x: pt.x - targetCenter.x,
                y: pt.y - targetCenter.y
            };

            let dodgeDistanceX = 0;
            let dodgeDistanceY = 0;

            if (distance.x > 0) {
                dodgeDistanceX = canvas.grid.size * 0.5;
            } else if (distance.x < 0) {
                dodgeDistanceX = canvas.grid.size * -0.5;
            }

            if (distance.y > 0) {
                dodgeDistanceY = canvas.grid.size * 0.5;
            } else if (distance.y < 0) {
                dodgeDistanceY = canvas.grid.size * -0.5;
            }

            const targetX = target.document?.x ?? target.x ?? 0;
            const targetY = target.document?.y ?? target.y ?? 0;

            const destination = {
                x: targetX + distance.x + dodgeDistanceX,
                y: targetY + distance.y + dodgeDistanceY
            };

            seq = seq
                .animation()
                .on(target)
                .moveTowards(destination, { relativeToCenter: false });
        });
    }

    return seq;
}

async function play(tile, targets, config = {}) {
    config = settingsOverride(config);
    const seq = await create(tile, targets, config);
    return seq.play();
}

async function stop(tile, config = {}) {
    // No persistent effects to stop
}

async function setup(config = {}) {
    return matt.trap.setup('eskie.traps.tile-dodge', config);
}

export const tileDodge = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
