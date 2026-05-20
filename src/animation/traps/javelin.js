/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    splashScale: 1.5,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { splashScale } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const targetTileIds = tile.document?.getFlag(MODULE_ID, 'trap.trapTargetTileIds') || [];
    let targetTile = targetTileIds.length ? canvas.tiles.get(targetTileIds[0]) : null;

    if (!targetTile) {
        const triggerTile = canvas.tiles.placeables.find(t => t.document.getFlag(MODULE_ID, 'trap.trapTileIds')?.includes(tile.id));
        if (triggerTile) targetTile = triggerTile;
    }

    const targetLoc = targetTile?.center || (targets.length ? (targets[0].object?.center || targets[0]) : null);

    let seq = new Sequence().wait(500);

    if (targetLoc) {
        const offset = targetLoc.x < tile.x ? -0.15 : 0.15;

        seq = seq
            .effect()
            .file(closest('jb2a.javelin.01.throw'))
            .atLocation(tile, { offset: { y: offset }, gridUnits: true })
            .stretchTo(targetLoc)
            .startTime(750)
            .waitUntilFinished(-1500);
    }

    if (targets.length > 0) {
        targets.forEach(target => {
            const targetWidth = target.document?.width ?? target.width ?? 1;
            const targetScaleX = target.document?.texture?.scaleX ?? target.texture?.scaleX ?? 1;

            seq = seq
                // Shaking copy sprite for target hit feedback
                .effect()
                .copySprite(target)
                .attachTo(target)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(750)
                .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .duration(1000)
                .opacity(0.25)

                // Blood splash side effect spraying from impact point
                .effect()
                .file(closest('jb2a.liquid.splash_side.red'))
                .atLocation(target)
                .size(splashScale * targetWidth * targetScaleX, { gridUnits: true })
                .spriteOffset({ x: -0.25 }, { gridUnits: true })
                .rotateTowards(tile);
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
    return matt.trap.setup('eskie.traps.javelin', { tileCount: 3, ...config });
}

export const javelin = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
