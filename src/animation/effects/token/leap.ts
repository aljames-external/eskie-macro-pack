/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
   Sequencer 4.3.0+ .motion() Update
** */

import { closest } from "../../../lib/filemanager.js";
import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { settingsOverride } from "../../../lib/settings.js";

const DEFAULT_CONFIG = {
    id: 'leap',
    position: undefined,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

/**
 * Creates a Sequencer effect for a token leaping to a target position using Sequencer 4.3.0+ .motion().
 *
 * @param {Token} token The token performing the leap.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence | undefined>} The created Sequence object.
 */
async function createLeap(token: Token, config: AnimationEffectConfig = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    let { id, position, sound } = mConfig;

    const { widthUnits: tokenWidth } = adapter.getTokenDimensions(token);
    const tokenRotation = adapter.getTokenRotation(token);

    // UI/Interaction Logic
    if (!position) {
        const crosshairConfig = {
            size: tokenWidth,
            icon: 'icons/skills/movement/feet-winged-boots-brown.webp',
            label: 'Jump',
            tag: 'leap power',
            drawIcon: true,
            drawOutline: true,
            interval: tokenWidth % 2 === 0 ? 1 : -1,
        };
        position = await Sequencer.Crosshair.show(crosshairConfig);
        if (!position || position.cancelled) { return; }
    }

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
        .name(id)
        .file(closest("eskie.smoke.06.white"))
        .atLocation(token)
        .scaleToObject(1.75)
        .belowTokens()

        .effect()
        .name(id)
        .file(closest("eskie.smoke.03.white"))
        .atLocation(token)
        .scaleToObject(1.5)
        .belowTokens()

        .effect()
        .name(id)
        .file(closest("jb2a.impact.009.orange"))
        .atLocation(token)
        .scaleToObject(1.5)
        .belowTokens()

        .effect()
        .name(id)
        .file(closest("jb2a.explosion.01.orange"))
        .atLocation(position)
        .scaleToObject(1.5)
        .belowTokens()
        .delay(1000)

        .effect()
        .name(id)
        .file(closest("jb2a.wind_stream.white"))
        .anchor({ x: 0.5, y: 1 })
        .atLocation(token)
        .duration(1000)
        .opacity(1)
        .scale(tokenWidth * 0.025)
        .moveTowards(position)
        .mirrorX()
        .zIndex(1)

        .effect()
        .name(id)
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .atLocation(token)
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.5)
        .scale(0.9)
        .belowTokens()
        .duration(1000)
        .anchor({ x: 0.5, y: 0.5 })
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .moveTowards(position, { rotate: false })
        .zIndex(2)

        .animation()
        .on(token)
        .moveTowards(position, { rotate: false, ease: "easeInOutQuad" })
        .motion({
            arc: 0.8,
            duration: 1000,
            ease: "easeInOutQuad"
        })
        .snapToGrid();

    return sequence;
}

/**
 * Plays the Leap effect for a token.
 * This function handles the crosshairs user interaction.
 *
 * @param {Token} token The token performing the leap.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<any>} A promise that resolves when the sequence starts playing.
 */
async function playLeap(token: Token, config: AnimationEffectConfig = {}) {
    const sequence = await createLeap(token, config);
    if (sequence) { return sequence.play(); }
}

/**
 * Stop function for Leap. Leap is a transient effect.
 * @param {Token} token The token.
 * @param {object} options Options for stopping effects.
 */
function stopLeap(token: Token, { id = DEFAULT_CONFIG.id }: Record<string, any> = {}) {
    Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const leap = {
    create: createLeap,
    play: playLeap,
    stop: stopLeap,
    default_config: DEFAULT_CONFIG,
};
