/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
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

    if (!tile) return new Sequence();

    // Find the door tile (the trigger tile that has this trap tile linked in its flags)
    const triggerTile = canvas.tiles.placeables.find(t => t.document.getFlag(MODULE_ID, 'trap.trapTileIds')?.includes(tile.id));
    const doorTile = triggerTile || tile;

    // Detect all tokens currently overlapping the trap tile bounds
    const tileX = tile.document?.x ?? tile.x;
    const tileY = tile.document?.y ?? tile.y;
    const tileWidth = tile.document?.width ?? tile.width;
    const tileHeight = tile.document?.height ?? tile.height;

    const tileMinX = tileX;
    const tileMaxX = tileX + tileWidth;
    const tileMinY = tileY;
    const tileMaxY = tileY + tileHeight;

    const finalTargets = canvas.tokens.placeables.filter(t => {
        const tWidth = t.w ?? ((t.document?.width ?? 1) * canvas.grid.size);
        const tHeight = t.h ?? ((t.document?.height ?? 1) * canvas.grid.size);
        const tMinX = t.document?.x ?? t.x;
        const tMaxX = tMinX + tWidth;
        const tMinY = t.document?.y ?? t.y;
        const tMaxY = tMinY + tHeight;

        // Bounding-box intersection check
        return !(tMaxX <= tileMinX || tMinX >= tileMaxX || tMaxY <= tileMinY || tMinY >= tileMaxY);
    });

    let seq = new Sequence();

    if (finalTargets.length > 0) {
        const target = finalTargets[0];

        seq = seq
            // Electricity burst at the door tile
            .effect()
            .file(closest('eskie.lightning.03.blue'))
            .atLocation(doorTile)
            .size(1.25, { gridUnits: true })
            .rotateTowards(tile)
            .zIndex(1)

            .wait(250);

        finalTargets.forEach(t => {
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
                .spriteRotation(-(t.document?.rotation ?? t.rotation ?? 0))
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
        controlled: 'all',
        ...config
    };
    
    const result = await matt.trap.setup('eskie.traps.electricDoor', setupConfig);
    if (!result) return;

    const { triggerTiles } = result;

    for (const triggerTile of triggerTiles) {
        const tag = `EMP-electric-door-trigger-${triggerTile.id}`;
        await Tagger.addTags(triggerTile, tag);

        // Find all walls on the scene that are doors and geographically intersect/overlap the trigger tile
        const doors = canvas.walls.placeables.filter(w => {
            if (w.document.door === 0) return false; // Not a door
            
            const tileX = triggerTile.x;
            const tileY = triggerTile.y;
            const tileWidth = triggerTile.width;
            const tileHeight = triggerTile.height;

            const minX = tileX;
            const maxX = tileX + tileWidth;
            const minY = tileY;
            const maxY = tileY + tileHeight;

            const [x1, y1, x2, y2] = w.document.c;

            // Bounding box intersection check for wall segment endpoints
            const p1Inside = x1 >= minX && x1 <= maxX && y1 >= minY && y1 <= maxY;
            const p2Inside = x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY;

            return p1Inside || p2Inside;
        });

        // Programmatically update each door wall to trigger our tile when opened
        for (const door of doors) {
            await door.document.update({
                "flags.monks-active-tiles": {
                    checklock: false,
                    close: false,
                    entity: {
                        id: `tagger:${tag}`,
                        match: "all",
                        name: `<i class="fas fa-tag fa-sm"></i> ${tag}`,
                        scene: "_active"
                    },
                    lock: false,
                    open: true,
                    secret: false
                }
            });
        }
    }

    return result;
}

export const electricDoor = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
