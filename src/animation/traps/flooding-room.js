/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    fadeTime: 3000,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { fadeTime } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Retrieve water spray origin tiles from flags, falling back to tag search for backward compatibility
    const originIds = tile.document.getFlag(MODULE_ID, 'trap.floodingRoomSplashOrigins') || [];
    let splashOrigins = originIds.map(id => canvas.tiles.get(id)).filter(t => t);
    
    if (splashOrigins.length === 0 && typeof Tagger !== 'undefined') {
        const taggedOrigins = await Tagger.getByTag('Flooding Room Trap Origin');
        splashOrigins = taggedOrigins.map(t => t.object || t).filter(t => t);
    }

    let seq = new Sequence()
        .canvasPan()
        .shake({ duration: 500, strength: 2, rotation: false })
        .wait(500);

    // Spawn persistent water splashes at each origin tile pointing towards the water tile
    if (splashOrigins.length > 0) {
        splashOrigins.forEach(origin => {
            seq = seq
                .effect()
                .name(`flooding-room-splash-${tile.id}`)
                .file(closest('jb2a.water_splash.cone.01.blue'))
                .atLocation(origin)
                .rotateTowards(tile)
                .size({ width: 2 * (origin.width || origin.document.width), height: 2 * (origin.height || origin.document.height) })
                .fadeIn(1000, { ease: 'easeOutCubic' })
                .elevation(origin.document?.elevation ?? origin.elevation ?? 0)
                .persist()
                .belowTokens();
        });
    }

    // Fade in the water tile representation
    seq = seq
        .animation()
        .on(tile)
        .fadeIn(fadeTime, { ease: 'easeInSine' })
        .opacity(1);

    return seq;
}

async function play(tile, targets, config = {}) {
    config = settingsOverride(config);
    const seq = await create(tile, targets, config);
    return seq.play();
}

async function stop(tile, config = {}) {
    // Clear water splash effects
    await Sequencer.EffectManager.endEffects({ name: `flooding-room-splash-${tile.id}` });

    // Reset water tile opacity back to 0
    await new Sequence()
        .animation()
        .on(tile)
        .fadeOut(1000)
        .opacity(0)
        .play();
}

async function setup(config = {}) {
    const setupConfig = {
        extraTiles: [
            {
                key: 'floodingRoomSplashOrigins',
                label: 'Water Splash Origin Tile(s)',
                prompt: 'Select the **Water Splash Origin Tile(s)** on the canvas (where the water sprays out from).'
            }
        ],
        ...config
    };
    return matt.trap.setup('eskie.traps.flooding-room', setupConfig);
}

export const floodingRoom = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
