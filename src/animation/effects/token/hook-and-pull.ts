// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from '../../../lib/filemanager.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    isHit: false,
    timingAdjust: -50,
    effect: {
        miss: 'eskie.objects.meat_hook.ranged.01.physical.normal.iron',
        hit: 'eskie.objects.meat_hook.ranged.01.physical.latch.iron'
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

/**
 * Creates the Hook and Pull sequence effects.
 * @param {Token} token - The casting token.
 * @param {Token} target - The target token.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token: Token, target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { hitTargets, timingAdjust, effect } = mConfig;
    const isHit = mConfig.isHit ?? hitTargets?.includes(target.document.id);

    // Determine pull location (best adjacent square to the token along the line to the target)
    const location = adapter.getBestAdjacentLocation(token, target);
    if (!location) return new Sequence();

    const grappleEffect = isHit ? effect.hit : effect.miss;

    const sequence = new Sequence();
    applySound(sequence, mConfig.sound);

    // Effect if missed or hit (grapple effect stretched from token to target)
    sequence.effect()
        .file(closest(grappleEffect))
        .attachTo(token)
        .stretchTo(target)
        .zIndex(1)
        .waitUntilFinished(-750);

    // Pull target toward location via Sequencer 4.3.0+ motion API
    sequence.motion(target)
        .moveTo(location, { relativeToCenter: true, duration: 500, delay: 101 + timingAdjust, ease: 'easeInCubic' })
        .playIf(isHit);

    return sequence;
}

/**
 * Plays the Hook and Pull animation.
 * @param {Token} token - The casting token.
 * @param {Token} target - The target token.
 * @param {object} config - Configuration options for the animation.
 */
async function play(token: Token, target: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

/**
 * Stops the Hook and Pull animation (transient effect).
 */
function stop(token: Token, config: any = {}) {
    // No persistent effects to stop
}

export const hookAndPull = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("hookAndPull", "ranged-target", "eskie.effect.hookAndPull", DEFAULT_CONFIG, "0.0.2", "Hook and Pull");