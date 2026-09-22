/**
 * Original Author: .eskie
 * Update Author: bakanabaka
 */

import { MODULE_ID } from '../../../../lib/constants.js';
import { closest } from '../../../../lib/filemanager.js';
import { util } from './rage-util.js';

import { adapter } from "../../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../utils/sound.js";
export const DEFAULT_CONFIG = {
    id: 'RageV2',
    color: 'red',
    effect: {
        ground: { enabled: true, persist: true },
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, effect, sound } = mConfig;
    const label = `${id} - ${token.id}`;

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        .motion(token)
        .scaleTo(1.05, { duration: 500 })
        .noise({ strength: 0.05, frequency: 50, gridUnits: true });

    // Canvas pan and shake
    seq = seq
        .canvasPan()
        .delay(250)
        .shake({ duration: 1100, strength: 1, rotation: false, fadeOut: 500 });

    if (effect.ground.enabled) {
    // Ground crack impact
    seq = seq
        .effect()
        .name(label)
        .delay(250)
        .file(closest(`jb2a.impact.ground_crack.${color}.02`))
        .atLocation(token)
        .belowTokens()
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(1);

    // Ground crack still frame (persistent based on groundCrack config)
    seq = seq
        .effect()
        .name(`${label} - ground-crack`)
        .delay(250)
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(token)
        .belowTokens()
        .fadeIn(1000)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(0);
        seq = (effect.ground.persist) ? seq.persist() : seq.duration(10000);
    }

    // Roar sound effect
    seq = seq
        .effect()
        .name(label)
        .delay(250)
        .file(closest("eskie.sound.roar.02"))
        .atLocation(token)
        .size(8, { gridUnits: true })
        .opacity(0.5);

    // Buff loop simple red effect (initial burst)
    seq = seq
        .effect()
        .name(label)
        .delay(250)
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(token, { offset: { y: -0.05 }, gridUnits: true })
        .scaleToObject(1.5)
        .opacity(0.9)
        .filter("ColorMatrix", { saturate: 1 })
        .playbackRate(1.5)
        .duration(8000)
        .fadeOut(3000)
        .zIndex(1);

    // Buff loop simple red effect (persistent)
    seq = seq
        .effect()
        .name(label)
        .delay(250)
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(token, { offset: { y: -0.05 }, gridUnits: true })
        .scaleToObject(1)
        .opacity(0.5)
        .filter("ColorMatrix", { saturate: 1 })
        .playbackRate(1)
        .fadeOut(500)
        .persist()
        .zIndex(1);

    // Aura token generic red (persistent)
    seq = seq
        .effect()
        .name(label)
        .file(closest(`eskie.aura.token.generic.02.${color}`))
        .attachTo(token)
        .scaleToObject(2.1)
        .persist();

    return seq;
}

async function play(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { rageImg } = mConfig;

    if ( rageImg ) {
        let originalImg = token.document.getFlag(MODULE_ID, 'rage_v2');   // Make sure we don't have an original yet...
        if (!originalImg) await token.document.setFlag(MODULE_ID, 'rage_v2', token.document.texture.src); // Store original
        await token.document.update({ texture: { src: rageImg } }, { animate: true });
    }

    let seq = create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { rageImg } = mConfig;

    if ( rageImg ) {
        let originalImg = token.document.getFlag(MODULE_ID, 'rage_v2');
        if (originalImg) {
            await Promise.all([
                token.document.update({ texture: { src: originalImg } }, { animate: true }),
                token.document.unsetFlag(MODULE_ID, 'rage_v2')    // Cleanup flag
            ]);
        }
    }
    return util.stop(token, mConfig);
}

async function clean(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    return util.clean(token, mConfig);
}

export const rageV2 = {
    create,
    play,
    stop,
    clean,
    default_config: DEFAULT_CONFIG,
};