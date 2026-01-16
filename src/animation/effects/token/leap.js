/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { file } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'leap',
    position: undefined,
};

/**
 * Creates a Sequencer effect for a token leaping to a target position.
 *
 * @param {Token} token The token performing the leap.
 * @param {object} position The target position (x, y coordinates) for the leap.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createLeap(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    let { id, position } = mConfig;

    // UI/Interaction Logic
    if (!position) {
        const crosshairConfig = {
            size: token.document.width / canvas.grid.size,
            icon: 'icons/skills/movement/feet-winged-boots-brown.webp',
            label: 'Jump',
            tag: 'leap power', // Changed from 'chop power' as it makes more sense for leap
            drawIcon: true,
            drawOutline: true,
            interval: token.document.width % 2 === 0 ? 1 : -1,
        };
        position = await Sequencer.Crosshair.show(crosshairConfig);
        if (position.cancelled) { return; }
    }

    const sequence = new Sequence();
    sequence
        .animation()
        .on(token)
        .opacity(0)
        .teleportTo(position)
        .snapToGrid()
        .waitUntilFinished()

        .effect()
        .file(file("animated-spell-effects-cartoon.air.puff.03"))
        .atLocation(token)
        .scaleToObject(1.75)
        .belowTokens()

        .effect()
        .file(file("jb2a.wind_stream.white"))
        .anchor({ x: 0.5, y: 1 })
        .atLocation(token)
        .duration(1000)
        .opacity(1)
        .scale(token.document.width / canvas.grid.size * 0.025)
        .moveTowards(position)
        .mirrorX()
        .zIndex(1)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .opacity(1)
        .duration(1000)
        .anchor({ x: 0.5, y: 1 })
        .loopProperty("sprite", "position.y", { values: [50, 0, 50], duration: 500 })
        .moveTowards(position, { rotate: false })
        .zIndex(2)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .opacity(0.5)
        .scale(0.9)
        .belowTokens()
        .duration(1000)
        .anchor({ x: 0.5, y: 0.5 })
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .moveTowards(position, { rotate: false })
        .zIndex(2)
        .waitUntilFinished()

        .animation()
        .on(token)
        .opacity(1)
    ;

    return sequence;
}

/**
 * Plays the Leap effect for a token.
 * This function handles the crosshairs user interaction.
 *
 * @param {Token} token The token performing the leap.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playLeap(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    let { id } = mConfig;

    const sequence = await createLeap(token, config);
    if (sequence) { return sequence.play(); }
}

/**
 * Placeholder for a stop function. Leap is a transient effect.
 * @param {Token} token The token.
 * @param {object} options Options for stopping effects.
 */
function stopLeap(token, { id = DEFAULT_CONFIG.id } = {}) {
    // No persistent effects to stop for Leap.
}

export const leap = {
    create: createLeap,
    play: playLeap,
    stop: stopLeap,
};
