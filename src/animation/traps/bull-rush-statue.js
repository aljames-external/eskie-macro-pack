/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    pushDistance: 1,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { pushDistance } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const target = targets.length ? targets[0] : null;
    const targetTileIds = tile.document?.getFlag(MODULE_ID, 'trap.trapTargetTileIds') || [];
    let targetTile = targetTileIds.length ? canvas.tiles.get(targetTileIds[0]) : null;

    if (!targetTile) {
        const triggerTile = canvas.tiles.placeables.find(t => t.document.getFlag(MODULE_ID, 'trap.trapTileIds')?.includes(tile.id));
        if (triggerTile) targetTile = triggerTile;
    }

    const tilePlaceable = tile.object || tile;
    const targetTilePlaceable = targetTile?.object || targetTile;
    const targetLoc = targetTilePlaceable?.center || (target ? (target.object?.center || target) : null);

    let seq = new Sequence();

    if (targetLoc) {
        const distance = {
            x: targetLoc.x - tilePlaceable.center.x,
            y: targetLoc.y - tilePlaceable.center.y
        };

        const getDirection = (value) => {
            if (value > 0) return 1;
            if (value < 0) return -1;
            return 0;
        };

        const direction = {
            x: getDirection(distance.x),
            y: getDirection(distance.y)
        };

        const destination = {
            x: targetLoc.x + (canvas.grid.size * pushDistance) * direction.x,
            y: targetLoc.y + (canvas.grid.size * pushDistance) * direction.y
        };

        seq = seq
            .wait(500)

            // Animate statue sliding out and back
            .effect()
            .copySprite(tilePlaceable)
            .atLocation(tilePlaceable)
            .size({ width: tile.width * (tile.texture?.scaleX ?? 1), height: tile.height * (tile.texture?.scaleY ?? 1) })
            .animateProperty('sprite', 'position.x', { from: 0, to: distance.x * 0.5, duration: 500, ease: 'easeOutQuint', delay: 200 })
            .animateProperty('sprite', 'position.y', { from: 0, to: distance.y * 0.5, duration: 500, ease: 'easeOutQuint', delay: 200 })
            .animateProperty('sprite', 'position.x', { from: 0, to: -distance.x * 0.5, duration: 3000, ease: 'easeInOutQuad', delay: 700 })
            .animateProperty('sprite', 'position.y', { from: 0, to: -distance.y * 0.5, duration: 3000, ease: 'easeInOutQuad', delay: 700 })
            .belowTokens()
            .duration(4000)
            .zIndex(0)

            // Hide the actual tile while animating copy sprite
            .animation()
            .delay(200)
            .on(tile)
            .opacity(0)

            // Smoke at statue origin
            .effect()
            .delay(200)
            .file(closest('animated-spell-effects-cartoon.smoke.53'))
            .atLocation(tile)
            .size({ width: tile.width * 1.75, height: tile.height * 1.75 })
            .belowTokens()
            .opacity(0.5);

        if (target) {
            seq = seq
                // Move the target back
                .animation()
                .delay(300)
                .on(target)
                .moveTowards(destination, { relativeToCenter: true });
        }

        seq = seq
            .wait(3700)

            // Restore the actual tile opacity
            .animation()
            .on(tile)
            .opacity(1);
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
    return matt.trap.setup('eskie.traps.bull-rush-statue', { tileCount: 3, ...config });
}

export const bullRushStatue = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
