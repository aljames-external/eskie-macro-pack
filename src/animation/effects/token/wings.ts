/* **
   Original Author: .eskie
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'wings',
    image: 'eskie.wings',
    offset: { x: 0, y: 0 },
    hue: 0,             // Hue change
    wingSize: 1,        // Wing Size
    speedMulti: 1,      // Wing Speed multiplier
    swayMulti: 1,       // Token Sway Distance multiplier
    mirrorX: false,
    mirrorY: false,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

/**
 * Creates a Sequencer effect for a token with wings (version 2).
 *
 * @param {Token} token The token to add wings to.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createWings(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, image, offset, hue, wingSize, speedMulti, mirrorX, mirrorY, sound } = mConfig;
    const label = `${id} - ${token.id}`;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Flying token hover motion via Sequencer 4.3.0+ .motion() API
    sequence.motion(token)
        .name(label)
        .moveBy({ y: -0.5 }, { duration: 1000, gridUnits: true })
        .oscillate({ period: 1500, amplitude: 0.05 });

    // Ground drop shadow beneath token
    sequence.effect()
        .name(label)
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .atLocation(token, { ignoreMotion: true })
        .scaleToObject(0.8, { considerTokenScale: true })
        .zIndex(0.1)
        .persist()
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.65)
        .attachTo(token, { bindAlpha: false, ignoreMotion: true });

    // Wings attachment on token
    sequence.effect()
        .name(label)
        .file(closest(image))
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .attachTo(token, { offset: { y: offset.y, x: offset.x }, gridUnits: true, bindAlpha: false })
        .scaleToObject(3 * wingSize)
        .zIndex(0.15)
        .playbackRate(speedMulti)
        .filter("ColorMatrix", { hue: hue })
        .persist();

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
async function playWings(token: Token, config: any = {}) {
    const sequence = await createWings(token, config);
    if (sequence) { return sequence.play(); }
}

/**
 * Stops the persistent Wings effects (version 2) on a token.
 *
 * @param {Token} token The token to remove wings from.
 * @param {object} config Configuration options for the animation.
 */
function stopWings(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    return Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const wings = {
    create: createWings,
    play: playWings,
    stop: stopWings,
    default_config: DEFAULT_CONFIG,
};
