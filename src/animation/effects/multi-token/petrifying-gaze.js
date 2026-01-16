/* **
    Last Updated: 7/12/2022
    Author: EskieMoh#2969
    Updated: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';

const DEFAULT_CONFIG = {
    id: 'PetrifyingGaze',
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
async function create(token, targetTokens, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;

    let sequence = new Sequence();
    sequence
        .effect()
        .file(closest("animated-spell-effects-cartoon.misc.fiery eyes.04"))
        .atLocation(token)
        .size(0.9, { gridUnits: true })
        .anchor({ x: 0.5, y: 0.5 })
        .duration(6000)
        .fadeIn(200)
        .fadeOut(500)

        .effect()
        .file(closest("animated-spell-effects-cartoon.misc.fiery eyes.04"))
        .atLocation(token)
        .size(0.9, { gridUnits: true })
        .anchor({ x: 0.5, y: 0.5 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(1)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .duration(6000)
        .fadeIn(200)
        .fadeOut(500)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .filter("Blur", { blurX: 5, blurY: 20 })
        .loopProperty("sprite", "position.y", { from: -10, to: 10, duration: 75, pingPong: true })
        .opacity(0.4)
        .duration(5000)
        .fadeOut(500)

        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.02"))
        .atLocation(token)
        .belowTokens()
        .opacity(0.25)
        .size(3, { gridUnits: true })
        .duration(5000)
        .fadeIn(1000)
        .fadeOut(500);

    // Effects for each target
    for (const target of targetTokens) {
        sequence
            .effect()
            .file(closest("animated-spell-effects-cartoon.misc.fiery eyes.04"))
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
            .file(closest("animated-spell-effects-cartoon.misc.fiery eyes.04"))
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
            .loopProperty("sprite", "position.y", { from: -10, to: 10, duration: 100, pingPong: true })
            .opacity(0.3)

            .effect()
            .copySprite(target)
            .atLocation(target)
            .filter("Blur", { blurX: 5, blurY: 20 })
            .loopProperty("sprite", "position.y", { from: -10, to: 10, duration: 100, pingPong: true })
            .opacity(0.8)
            .duration(5000)
            .fadeIn(1000)
            .fadeOut(500);
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
async function play(token, targetTokens, config = {}) {
    let seq = await create(token, targetTokens, config);
    if (seq) { await seq.play(); }
}

export const petrifyingGaze = {
    create,
    play,
};
