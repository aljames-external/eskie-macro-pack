/* **
   Original Author: .eskie
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'shockingGrasp',
};

/**
 * Creates a Sequencer effect for a Shocking Grasp spell.
 *
 * @param {Token} token The token casting the spell.
 * @param {Token} target The token being targeted.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createShockingGrasp(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    const sequence = new Sequence();

    sequence
        .effect()
        .file(closest("jb2a.breath_weapons.lightning.line.blue"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: token.document.width * 0.4 }, { gridUnits: true })
        .scale(0.25)
        .endTime(4000)
        .playbackRate(3)
        .animateProperty("spriteContainer", "position.x", { from: -0.3, to: 0, duration: 750, gridUnits: true, ease: "easeInBack" })
        .waitUntilFinished(-300)

        .effect()
        .delay(250)
        .file(closest("jb2a.impact.008.blue"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: token.document.width - 1 }, { gridUnits: true })
        .scale(0.25)

        .effect()
        .file(closest("eskie.lightning.03.blue"))
        .atLocation(token)
        .rotateTowards(target)
        .size(token.document.width * 1.2, { gridUnits: true })
        .filter("ColorMatrix", { hue: -24, saturate: 1 })
        .spriteOffset({ x: token.document.width * 0.35 }, { gridUnits: true })
        .zIndex(1)
        .repeats(2, 500, 500)

        .effect()
        .delay(250)
        .file(closest("eskie.lightning.03.blue"))
        .atLocation(token)
        .rotateTowards(target)
        .size(token.document.width * 1.2, { gridUnits: true })
        .filter("ColorMatrix", { hue: -24, saturate: 1 })
        .spriteOffset({ x: token.document.width * 0.35 }, { gridUnits: true })
        .mirrorY()
        .zIndex(1)
        .repeats(2, 500, 500)

        .wait(250)

        .effect()
        .file(closest("jb2a.static_electricity.03.blue"))
        .attachTo(target)
        .scaleToObject(1.25)
        .opacity(1)
        .playbackRate(1)
        .fadeOut(1000)
        .randomRotation()
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .repeats(3, 300, 300)

        .effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(250)
        .fadeOut(1500)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .duration(4000)
        .opacity(0.25);

    return sequence;
}

/**
 * Plays the Shocking Grasp effect.
 *
 * @param {Token} token The token casting the spell.
 * @param {Token} target The token being targeted.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playShockingGrasp(token, target, config = {}) {
    if (!target) {
        console.warn("Shocking Grasp: No target provided.");
        return;
    }
    const sequence = await createShockingGrasp(token, target, config);
    if (sequence) { return sequence.play({ preload: true }); }
}

/**
 * Placeholder for a stop function. Shocking Grasp is a transient effect.
 * @param {Token} token The token.
 * @param {object} options Options for stopping effects.
 */
function stopShockingGrasp(token, { id = DEFAULT_CONFIG.id } = {}) {
    // No persistent effects to stop for Shocking Grasp.
}

export const shockingGrasp = {
    create: createShockingGrasp,
    play: playShockingGrasp,
    stop: stopShockingGrasp,
};
