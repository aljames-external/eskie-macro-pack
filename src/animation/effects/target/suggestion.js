/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { file } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'suggestion',
};

/**
 * Creates a Sequencer effect for a Suggestion spell.
 *
 * @param {Token} token The token casting the spell.
 * @param {Token} target The token being targeted.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createSuggestion(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    const sequence = new Sequence();

    const offsets = [
        { x: 0, y: -0.55 },
        { x: -0.5, y: -0.15 },
        { x: -0.3, y: 0.45 },
        { x: 0.3, y: 0.45 },
        { x: 0.5, y: -0.15 }
    ];

    sequence.thenDo(function () {
        for (let i = 0; i < offsets.length; i++) {
            new Sequence()
                .effect()
                .delay(250)
                .file(file("jb2a.icon.runes.blue"))
                .attachTo(target, { offset: offsets[i], gridUnits: true, bindRotation: false })
                .scaleToObject(0.4)
                .scaleIn(0, 250, { ease: "easeOutBack" })
                .animateProperty("spriteContainer", "position.x", { from: -0, to: -offsets[i].x, duration: 500, gridUnits: true, delay: 500, ease: "easeInBack" })
                .animateProperty("spriteContainer", "position.y", { from: -0, to: -offsets[i].y, duration: 500, gridUnits: true, delay: 500, ease: "easeInBack" })
                .zIndex(1)
                .duration(1150)

                .effect()
                .file(file("jb2a.template_circle.out_pulse.02.burst.bluewhite"))
                .attachTo(target, { offset: offsets[i], gridUnits: true })
                .scaleToObject(0.4)
                .opacity(0.5)
                .play(); // Play this mini-sequence immediately
        }
    })

        .wait(1250)

        .effect()
        .file(file("jb2a.energy_attack.01.blue"))
        .attachTo(target, { bindRotation: false })
        .scaleToObject(2.25)
        .belowTokens()
        .startTime(500)
        .endTime(2050)
        .fadeOut(400)
        .randomRotation()

        .effect()
        .file(file("jb2a.impact.010.blue"))
        .attachTo(target)
        .scaleToObject(0.9)
        .zIndex(2)
        .waitUntilFinished(-1000)

        .effect()
        .file(file("jb2a.template_circle.symbol.normal.runes.blue"))
        .attachTo(target)
        .scaleToObject(1.25)
        .fadeIn(500)
        .fadeOut(2500)
        .duration(6000)
        .randomRotation()
        .mask(target)

        .effect()
        .file(file("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(target, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .fadeIn(500)
        .fadeOut(2500)
        .belowTokens()
        .opacity(0.45)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .tint("#30aefd")
        .duration(6000)

        .effect()
        .copySprite(target)
        .attachTo(target, { bindAlpha: false })
        .belowTokens()
        .mirrorX(token.document.mirrorX)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("Glow", { color: 0x30aefd, distance: 3, outerStrength: 4, innerStrength: 0 })
        .fadeIn(500)
        .fadeOut(2500)
        .duration(6000)
        .zIndex(0.1);

    return sequence;
}

/**
 * Plays the Suggestion effect.
 *
 * @param {Token} token The token casting the spell.
 * @param {Token} target The token being targeted.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playSuggestion(token, target, config = {}) {
    if (!target) {
        console.warn("Suggestion: No target provided.");
        return;
    }
    const sequence = await createSuggestion(token, target, config);
    if (sequence) { return sequence.play(); }
}

/**
 * Placeholder for a stop function. Suggestion is a transient effect.
 * @param {Token} token The token.
 * @param {object} options Options for stopping effects.
 */
function stopSuggestion(token, { id = DEFAULT_CONFIG.id } = {}) {
    // No persistent effects to stop for Suggestion.
}

export const suggestion = {
    create: createSuggestion,
    play: playSuggestion,
    stop: stopSuggestion,
};
