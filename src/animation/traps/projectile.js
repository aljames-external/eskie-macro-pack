/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';
import { dialog } from '../../lib/dialog.js';

const DEFAULT_CONFIG = {
    repeats: 10,
    repeatDelay: 50,
    splashScale: 1.5,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { repeats, repeatDelay, splashScale } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Retrieve projectile type from flags, defaulting to arrow
    const projectileType = tile.document?.getFlag(MODULE_ID, 'trap.projectileType') || config.projectileType || 'arrow';

    // Retrieve target/landing tile from flags, falling back to legacy trigger lookup
    const targetTileIds = tile.document?.getFlag(MODULE_ID, 'trap.trapTargetTileIds') || [];
    let targetTile = targetTileIds.length ? canvas.tiles.get(targetTileIds[0]) : null;

    if (!targetTile) {
        const triggerTile = canvas.tiles.placeables.find(t => t.document.getFlag(MODULE_ID, 'trap.trapTileIds')?.includes(tile.id));
        if (triggerTile) targetTile = triggerTile;
    }

    const targetTilePlaceable = targetTile?.object || targetTile;
    const targetLoc = targetTilePlaceable?.center || (targets.length ? (targets[0].object?.center || targets[0]) : null);

    let seq = new Sequence();
    if (projectileType === 'javelin') {
        seq = seq.wait(500);
    }

    if (targetLoc) {
        if (projectileType === 'javelin') {
            const offset = targetLoc.x < tile.x ? -0.15 : 0.15;
            seq = seq
                .effect()
                .file(closest('jb2a.javelin.01.throw'))
                .atLocation(tile, { offset: { y: offset }, gridUnits: true })
                .stretchTo(targetLoc)
                .startTime(750)
                .waitUntilFinished(-1500);
        } else if (projectileType === 'dart') {
            const offset = targetLoc.x < tile.x ? -0.15 : 0.15;
            seq = seq
                .effect()
                .file(closest('jb2a.dart.01.throw.physical.white'))
                .atLocation(tile, { offset: { y: offset }, gridUnits: true })
                .stretchTo(targetLoc, { randomOffset: 0.85, gridUnits: true })
                .startTime(750)
                .repeats(repeats, repeatDelay, repeatDelay);
        } else {
            seq = seq
                .effect()
                .file(closest('jb2a.arrow.physical.white.01'))
                .atLocation(tile)
                .stretchTo(targetLoc, { randomOffset: 0.65, gridUnits: true })
                .startTime(350)
                .repeats(repeats, repeatDelay, repeatDelay);
        }
    }

    if (targets.length > 0) {
        targets.forEach(target => {
            if (projectileType === 'javelin') {
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
            } else if (projectileType === 'dart') {
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
            } else {
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
            }
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
    let projectileType = config.projectileType;
    if (!projectileType) {
        projectileType = await dialog.buttonDialog({
            title: 'Projectile Trap Setup: Choose Type',
            buttons: [
                { label: 'Arrow', value: 'arrow' },
                { label: 'Dart', value: 'dart' },
                { label: 'Javelin', value: 'javelin' },
            ],
        }, {
            content: '<p>Choose the projectile type for this trap.</p>'
        });
    }

    if (!projectileType) return ui.notifications.warn('EMP | No projectile type chosen. Setup cancelled.');

    const setupConfig = {
        tileCount: 3,
        extraFlags: {
            projectileType: projectileType
        },
        ...config
    };

    const playPath = config.playPath || 'eskie.traps.projectile';
    return matt.trap.setup(playPath, setupConfig);
}

export const projectile = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
