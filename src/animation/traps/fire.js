/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    size: 3.5,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { size } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const triggerTile = canvas.tiles.placeables.find(t => t.document.getFlag(MODULE_ID, 'trap.trapTileIds')?.includes(tile.id));
    const targetLoc = triggerTile?.center || (targets.length ? (targets[0].object?.center || targets[0]) : null);

    let seq = new Sequence();

    if (targetLoc) {
        seq = seq
            // Cone fire breath weapon
            .effect()
            .file(closest('jb2a.breath_weapons02.burst.cone.fire.orange.02'))
            .atLocation(tile)
            .size(size, { gridUnits: true })
            .rotateTowards(targetLoc)
            .zIndex(1);
    }

    if (targets.length > 0) {
        targets.forEach(target => {
            seq = seq
                // Burning token shake effect
                .effect()
                .copySprite(target)
                .delay(2000)
                .attachTo(target)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(750)
                .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .duration(2000)
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
    return matt.trap.setup('eskie.traps.fire', config);
}

export const fire = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
