/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    repeats: 5,
    repeatDelay: 300,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { repeats, repeatDelay } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const target = (targets && targets.length > 0) ? targets[0] : null;

    let seq = new Sequence();

    if (target) {
        seq = seq
            // Electricity burst at the door tile
            .effect()
            .file(closest('eskie.lightning.03.blue'))
            .atLocation(tile)
            .size(1.25, { gridUnits: true })
            .rotateTowards(target)
            .zIndex(1)

            .wait(250);

        targets.forEach(t => {
            seq = seq
                // Shocking electricity on target
                .effect()
                .file(closest('jb2a.static_electricity.03.blue'))
                .attachTo(t)
                .scaleToObject(1.25, { considerTokenScale: true })
                .opacity(1)
                .playbackRate(1)
                .fadeOut(1000)
                .randomRotation()
                .repeats(repeats, repeatDelay, repeatDelay)

                // Shaking copy sprite representing electrocution
                .effect()
                .copySprite(t)
                .attachTo(t)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(1500)
                .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .duration(4000)
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
    const setupConfig = {
        trigger: ['door'],
        ...config
    };
    return matt.trap.setup('eskie.traps.electricDoor', setupConfig);
}

export const electricDoor = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
