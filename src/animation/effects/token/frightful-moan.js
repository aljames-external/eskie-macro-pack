// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';

/**
 * Creates the Frightful Moan animation sequence.
 * @param {Token} token - The token from which the moan originates.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token, config = {}) {
    const sequence = new Sequence();

    sequence
        .effect()
        .file(closest("jb2a.extras.tmfx.inpulse.circle.01.normal"))
        .attachTo(token, { bindAlpha: false })
        .scaleToObject(1.75)
        .randomRotation()
        .fadeIn(1000, { delay: 0 })
        .opacity(1)
        .aboveLighting()

        .effect()
        .file(closest("jb2a.particles.inward.white.01.02"))
        .atLocation(token)
        .scaleToObject(2)
        .duration(500)
        .randomRotation()
        .fadeOut(400)
        .scaleOut(0, 750, { ease: "easeOutCubic" })
        .repeats(4, 150, 150)
        .opacity(0.5)
        .aboveLighting()
        .zIndex(1)
        .waitUntilFinished(500)

        .effect()
        .file(closest("jb2a.impact.004.blue"))
        .atLocation(token)
        .scaleToObject(6)
        .randomRotation()
        .fadeIn(700)
        .fadeOut(1000)
        .scaleIn(0, 3000, { ease: "easeOutExpo" })
        .repeats(8, 450, 450)
        .opacity(0.4)
        .filter("ColorMatrix", { saturate: -1, brightness: 1.1 })
        .aboveLighting()
        .loopProperty("sprite", "position.x", { from: 0.01, to: -0.01, gridUnits: true, pingPong: true, duration: 50 })
        .zIndex(1)

        .effect()
        .file(closest("jb2a.extras.tmfx.outpulse.circle.01.fast"))
        .attachTo(token, { bindAlpha: false })
        .size(13, { gridUnits: true })
        .repeats(8, 450, 450)
        .opacity(0.25)
        .filter("ColorMatrix", { saturate: -1 })
        .loopProperty("sprite", "position.x", { from: 0.01, to: -0.01, gridUnits: true, pingPong: true, duration: 50 })
        .aboveLighting()
        .zIndex(0)

        .canvasPan()
        .delay(100)
        .shake({ duration: 3600, strength: 2, rotation: false, fadeOut: 1000 });

    return sequence;
}

/**
 * Plays the Frightful Moan animation.
 * @param {Token} token - The token from which the moan originates.
 * @param {object} options - Options for playing the animation, including config.
 */
async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) return sequence.play();
}

export const frightfulMoan = {
    create,
    play,
    // No stop function needed as this is not a persistent effect
};