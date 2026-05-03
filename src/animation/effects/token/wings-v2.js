/* **
   Original Author: .eskie
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'wingsV2',
    image: 'eskie.wings',
    offset: {x: 0, y: 0},
    hue: 0,             // Hue change
    wingSize: 1,        // Wing Size
    speedMulti: 1,      // Wing Speed multiplier
    swayMulti: 1        // Token Sway Distance multiplier
};

/**
 * Creates a Sequencer effect for a token with wings (version 2).
 *
 * @param {Token} token The token to add wings to.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createWingsV2(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, image, offset, hue, wingSize, speedMulti, swayMulti } = mConfig;

    const sequence = new Sequence();

    sequence
        .animation()
        .on(token)
        .opacity(0)

        .effect()
        .name(`${id} - ${token.id}`) // Unique name for stopping
        .copySprite(token)
        .rotate(token.document.rotation)
        .spriteRotation(token.document.rotation)
        .attachTo(token, { bindAlpha: false })
        .scaleToObject(0.8, { considerTokenScale: true })
        .zIndex(0.1)
        .persist()
        .belowTokens()
        .filter("ColorMatrix", { brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.65)

        .effect()
        .name(`${id} - ${token.id}`) // Unique name for stopping
        .copySprite(token)
        .rotate(token.document.rotation)
        .spriteRotation(token.document.rotation)
        .attachTo(token, { offset: { y: -0.5 - (0.1 * swayMulti) }, gridUnits: true, bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(0.1)
        .persist()
        .animateProperty("spriteContainer", "position.y", { from: 0.5 + (0.1 * swayMulti), to: -0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("spriteContainer", "position.y", { values: [0.075 * swayMulti, 0.1 * swayMulti, 0.025 * swayMulti, 0, 0.025 * swayMulti, 0.05 * swayMulti], duration: (3000 / speedMulti) / 6, gridUnits: true, ease: "linear", pingPong: true })

        .effect()
        .name(`${id} - ${token.id}`) // Unique name for stopping
        .file(closest(image))
        .attachTo(token, { offset: { y: offset.y -0.5 - (0.1 * swayMulti), x: offset.x}, gridUnits: true, bindAlpha: false })
        .scaleToObject(3 * wingSize)
        .persist()
        .animateProperty("spriteContainer", "position.y", { from: 0.5 + (0.1 * swayMulti), to: -0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("spriteContainer", "position.y", { values: [0.075 * swayMulti, 0.1 * swayMulti, 0.025 * swayMulti, 0, 0.025 * swayMulti, 0.05 * swayMulti], duration: (3000 / speedMulti) / 6, gridUnits: true, ease: "linear", pingPong: true })
        .playbackRate(speedMulti)
        .filter("ColorMatrix", { hue: hue })
        .waitUntilFinished()

        .animation()
        .on(token)
        .opacity(1)
    ;

    return sequence;
}

/**
 * Plays or stops the Wings effect (version 2) on a token.
 * Toggles the effect based on its active state.
 *
 * @param {Token} token The token to apply/remove wings from.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the effect is played or stopped.
 */
async function playWingsV2(token, config = {}) {
    const sequence = await createWingsV2(token, config);
    if (sequence) { sequence.play(); }
}

/**
 * Stops the persistent Wings effects (version 2) on a token.
 *
 * @param {Token} token The token to remove wings from.
 * @param {object} config Configuration options for the animation.
 */
function stopWingsV2(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const wingsV2 = {
    create: createWingsV2,
    play: playWingsV2,
    stop: stopWingsV2,
    default_config: DEFAULT_CONFIG,
};
