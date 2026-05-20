/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    repeats: 10,
    repeatDelay: 50,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { repeats, repeatDelay } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Lookup the trigger tile dynamically to determine projectile path
    const triggerTile = canvas.tiles.placeables.find(t => t.document.getFlag(MODULE_ID, 'trap.trapTileIds')?.includes(tile.id));
    const targetLoc = triggerTile?.center || (targets.length ? (targets[0].object?.center || targets[0]) : null);

    let seq = new Sequence();

    if (targetLoc) {
        seq = seq
            .effect()
            .file(closest('jb2a.arrow.physical.white.01'))
            .atLocation(tile)
            .stretchTo(targetLoc, { randomOffset: 0.65, gridUnits: true })
            .startTime(350)
            .repeats(repeats, repeatDelay, repeatDelay);
    }

    if (targets.length > 0) {
        targets.forEach(target => {
            seq = seq
                .effect()
                .copySprite(target)
                .delay(250)
                .attachTo(target)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(750)
                .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .duration(1000)
                .opacity(0.25);
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
    return matt.trap.setup('eskie.traps.arrow', config);
}

export const arrow = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
