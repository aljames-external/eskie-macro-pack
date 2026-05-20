/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    boulderSpeed: 2500,
    boulderSize: 4.25,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { boulderSpeed, boulderSize } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Retrieve end tile from flags, falling back to legacy/Tagger search for backward compatibility
    const targetTileIds = tile.document.getFlag(MODULE_ID, 'trap.trapTargetTileIds') || [];
    let endTile = targetTileIds.length ? canvas.tiles.get(targetTileIds[0]) : null;

    if (!endTile) {
        const endTileIds = tile.document.getFlag(MODULE_ID, 'trap.boulderEndTileIds') || [];
        endTile = endTileIds.length ? canvas.tiles.get(endTileIds[0]) : null;
    }

    if (!endTile && typeof Tagger !== 'undefined') {
        const tagged = await Tagger.getByTag('Rolling Boulder End');
        endTile = tagged[0]?.object || tagged[0];
    }

    if (!endTile) {
        ui.notifications.warn('EMP | Rolling Boulder Trap: No end tile found.');
        return new Sequence();
    }

    const startLoc = tile.center || tile;
    const endLoc = endTile.center || endTile;

    return new Sequence()
        .canvasPan()
        .delay(500)
        .shake({ duration: 500, strength: 2, rotation: false })

        // Pre-boulder loop shadow/ground rumble effect
        .effect()
        .file(closest('jb2a.rolling_boulder.loop.01.rock.brown'))
        .atLocation(startLoc)
        .scaleIn(0, boulderSpeed / 3, { ease: 'easeOutCubic' })
        .fadeIn(boulderSpeed / 6)
        .size(boulderSize - 0.5, { gridUnits: true })
        .duration(500)
        .filter('ColorMatrix', { brightness: 0 })
        .filter('Blur', { blurX: 5, blurY: 10 })
        .opacity(0.5)
        .belowTokens()

        // Impact smoke wave at start location
        .effect()
        .delay(boulderSpeed / 6)
        .file(closest('jb2a.impact.white.0'))
        .atLocation(startLoc)
        .size(boulderSize * 1.15, { gridUnits: true })
        .belowTokens()
        .randomRotation()

        // Main rolling boulder loop travelling from start to end tile
        .effect()
        .delay(200)
        .file(closest('jb2a.rolling_boulder.loop.01.rock.brown'))
        .atLocation(startLoc)
        .scaleIn(1, boulderSpeed / 3, { ease: 'easeOutCubic' })
        .fadeIn(boulderSpeed / 6)
        .size(boulderSize - 0.4, { gridUnits: true })
        .moveTowards(endLoc, { ease: 'easeInSine' })
        .duration(boulderSpeed)
        .spriteRotation(-90)
        .zIndex(3)
        .waitUntilFinished(-boulderSpeed / 8)

        // Impact flash at target/crash point
        .effect()
        .delay(250)
        .file(closest('jb2a.impact.white.0'))
        .atLocation(endLoc)
        .size(boulderSize * 1.15, { gridUnits: true })
        .belowTokens()
        .randomRotation()

        // Grenade blast/debris explosion on crash
        .effect()
        .file(closest('jb2a.explosion.shrapnel.grenade.02.black'))
        .atLocation(endLoc)
        .size(boulderSize * 1.25, { gridUnits: true })
        .zIndex(4)

        // Explosion smoke cloud
        .effect()
        .delay(100)
        .file(closest('animated-spell-effects-cartoon.smoke.11'))
        .atLocation(endLoc)
        .playbackRate(0.65)
        .fadeOut(1500)
        .size(boulderSize * 2.2, { gridUnits: true })
        .filter('ColorMatrix', { brightness: 0.65 })
        .zIndex(4);
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
    return matt.trap.setup('eskie.traps.rolling-boulder', { tileCount: 3, ...config });
}

export const rollingBoulder = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
