/* **
    Last Updated: 7/12/2022
    Author: EskieMoh#2969
    Updated: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

import { adapter } from "../../../adapters/index.js";
const DEFAULT_CONFIG = {
    id: 'PetrifyingGaze',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

/**
 * Creates a Petrifying Gaze effect sequence from a source token to multiple target tokens.
 *
 * @param {Token} token The token initiating the effect.
 * @param {Array<Token>} targetTokens An array of target tokens.
 * @param {object} [config={}] Configuration for the effect.
 * @param {string} [config.id='PetrifyingGaze'] The id of the effect.
 * @returns {Promise<Sequence>} A promise that resolves with the complete effect sequence.
 */
async function create(token: Token, targets: Token[], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;
    const eyeAnimation = "jb2a.eyes.01.single.orangeyellow";

    let sequence = new Sequence();
    applySound(sequence, sound);
    sequence
        .effect()
        .file(closest(eyeAnimation))
        .atLocation(token)
        .size(0.9, { gridUnits: true })
        .anchor({ x: 0.5, y: 0.5 })
        .duration(6000)
        .fadeIn(200)
        .fadeOut(500)

        .effect()
        .file(closest(eyeAnimation))
        .atLocation(token)
        .size(0.9, { gridUnits: true })
        .anchor({ x: 0.5, y: 0.5 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(1)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .duration(6000)
        .fadeIn(200)
        .fadeOut(500)

        .motion(token)
        .noise({ strength: 0.05, speed: 75, gridUnits: true })
        .duration(5000)

        .effect()
        .file(closest(eyeAnimation))
        .atLocation(token)
        .belowTokens()
        .opacity(0.25)
        .size(3, { gridUnits: true })
        .duration(5000)
        .fadeIn(1000)
        .fadeOut(500);

    // Effects for each target
    for (const target of targets) {
        sequence
            .effect()
            .file(closest(eyeAnimation))
            .atLocation(token)
            .scale({ x: 0.1, y: 1.25 })
            .anchor({ x: 0.5, y: 0.35 })
            .opacity(0.5)
            .rotate(90)
            .rotateTowards(target)
            .belowTokens()
            .duration(5000)
            .fadeIn(500)
            .fadeOut(500)

            .effect()
            .file(closest("jb2a.eyes.01.single.orangered"))
            .atLocation(token)
            .scale({ x: 0.1, y: 1.25 })
            .anchor({ x: 0.5, y: 0.35 })
            .opacity(0.2)
            .filter("ColorMatrix", { saturate: -1, brightness: 2 })
            .rotate(90)
            .rotateTowards(target)
            .duration(5000)
            .fadeIn(500)
            .fadeOut(500)

            .effect()
            .file(closest("jb2a.wind_stream.white"))
            .atLocation(token)
            .stretchTo(target, { onlyX: false })
            .filter("Blur", { blurX: 10, blurY: 20 })
            .loopProperty('spriteContainer', 'position.y', { from: -10, to: 10, duration: 100, pingPong: true })
            .opacity(0.3)

            .motion(target)
            .noise({ strength: 0.05, speed: 100, gridUnits: true })
            .duration(5000);
    }

    return sequence;
}

/**
 * Creates and plays the Petrifying Gaze effect.
 * @param {Token} token The token initiating the effect.
 * @param {Array<Token>} targetTokens An array of target tokens.
 * @param {object} [config={}] Configuration for the effect.
 * @returns {Promise<void>} A promise that resolves when the effect is finished.
 */
async function play(token: Token, targets: Token[], config: any = {}) {
    let seq = await create(token, targets, config);
    if (seq) { await seq.play(); }
}

export const petrifyingGaze = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
