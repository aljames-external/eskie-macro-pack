// Original Author: .eskie
// Modular Conversion: bakanabaka

import { file } from "../../../lib/filemanager.js";

/**
 * Creates the Chain Lightning sequence effects.
 * @param {Token} token - The casting token.
 * @param {Array<Token>} targetTokens - An array of target tokens.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token, targetTokens, config = {}) {
    if (!targetTokens || targetTokens.length === 0) {
        console.warn("Chain Lightning: No targets provided.");
        return new Sequence();
    }

    const initialTarget = targetTokens[0];
    const sequence = new Sequence();

    sequence
        .effect()
        .delay(150)
        .file(file("jb2a.electric_arc.blue02"))
        .atLocation(token)
        .stretchTo(initialTarget, { onlyX: true })
        .duration(1000)
        .fadeIn(250)
        .fadeOut(750)
        .belowTokens()
        .animateProperty("sprite", "height", { from: -2, to: -1, duration: 200, gridUnits: true })
        .opacity(0.75)
        .thenDo(function () {
            for (let e = 1; e <= targetTokens.length - 1; e++) {
                new Sequence()
                    .effect()
                    .delay(150)
                    .file(file("jb2a.electric_arc.blue02"))
                    .atLocation(initialTarget)
                    .stretchTo(targetTokens[e], { onlyX: true })
                    .duration(1000)
                    .fadeIn(250)
                    .fadeOut(750)
                    .belowTokens()
                    .animateProperty("sprite", "height", { from: -2, to: -1, duration: 200, gridUnits: true })
                    .opacity(0.75)
                    .randomizeMirrorY()
                    .play();
            }
        })
        .effect()
        .delay(150)
        .file(file("jb2a.chain_lightning.primary.blue"))
        .atLocation(token, { offset: { x: token.document.width * 0.25 }, gridUnits: true, local: true })
        .stretchTo(initialTarget)
        .zIndex(2)
        .waitUntilFinished(-1150)
        .effect()
        .copySprite(initialTarget)
        .attachTo(initialTarget)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(250)
        .fadeOut(1250)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .duration(2000)
        .opacity(0.25)
        .thenDo(function () {
            for (let i = 1; i <= targetTokens.length - 1; i++) {
                new Sequence()
                    .effect()
                    .file(file("jb2a.chain_lightning.secondary.blue"))
                    .atLocation(initialTarget, { offset: { x: -0.1 }, gridUnits: true, local: true })
                    .stretchTo(targetTokens[i])
                    .randomizeMirrorY()
                    .zIndex(2)
                    .effect()
                    .copySprite(targetTokens[i])
                    .attachTo(targetTokens[i])
                    .scaleToObject(1, { considerTokenScale: true })
                    .fadeIn(250)
                    .fadeOut(1250)
                    .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                    .duration(2000)
                    .opacity(0.25)
                    .play();
            }
        });

    return sequence;
}

/**
 * Plays the Chain Lightning animation.
 * @param {Token} token - The casting token.
 * @param {Array<Token>} targetTokens - An array of target tokens.
 * @param {object} options - Options for playing the animation, including config.
 */
async function play(token, targetTokens, config = {}) {
    const sequence = await create(token, targetTokens, config);
    sequence.play({ preload: true });
}

export const chainLightning = {
    create,
    play,
    // No stop function needed as this is not a persistent effect
};