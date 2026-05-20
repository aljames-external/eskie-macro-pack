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

    const triggerTile = canvas.tiles.placeables.find(t => t.document.getFlag(MODULE_ID, 'trap.trapTileIds')?.includes(tile.id));
    const targetLoc = triggerTile?.center || (targets.length ? (targets[0].object?.center || targets[0]) : null);

    let seq = new Sequence();

    if (targetLoc) {
        const offset = targetLoc.x < tile.x ? -0.15 : 0.15;

        seq = seq
            .effect()
            .file(closest('jb2a.dart.01.throw.physical.white'))
            .atLocation(tile, { offset: { y: offset }, gridUnits: true })
            .stretchTo(targetLoc, { randomOffset: 0.85, gridUnits: true })
            .startTime(750)
            .repeats(repeats, repeatDelay, repeatDelay);
    }

    if (targets.length > 0) {
        targets.forEach(target => {
            seq = seq
                // Green poison tint effect
                .effect()
                .copySprite(target)
                .delay(250)
                .attachTo(target)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(1000)
                .duration(5000)
                .tint('#a7fe06')
                .opacity(0.5)

                // Poison hit token shake
                .effect()
                .copySprite(target)
                .delay(250)
                .attachTo(target)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(750)
                .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .duration(1000)
                .opacity(0.25)

                // Green bubble markers
                .effect()
                .file(closest('jb2a.markers.bubble.02.complete.green'))
                .delay(250)
                .attachTo(target, { offset: { x: 0.25, y: -0.25 }, gridUnits: true })
                .scaleToObject(0.75, { considerTokenScale: true });
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
    return matt.trap.setup('eskie.traps.dart', config);
}

export const dart = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
