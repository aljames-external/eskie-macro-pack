/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'enlargeReduce',
    scaleFactor: 1, // Default scale factor for enlarge/reduce
    sound: {
        enlarge: { ...DEFAULT_SOUND_CONFIG },
        reduce: { ...DEFAULT_SOUND_CONFIG }
    },
};

/**
 * Creates a Sequencer effect for enlarging a token.
 *
 * @param {Token} token The token to enlarge.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createEnlarge(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, scaleFactor, sound } = mConfig;

    const sequence = new Sequence();
    applySound(sequence, sound.enlarge);

    const targetWidth = token.document.width > 0.5 ? token.document.width + scaleFactor : 1;
    const targetHeight = token.document.height > 0.5 ? token.document.height + scaleFactor : 1;
    const targetScale = targetWidth / token.document.width;

    sequence
        .effect()
        .file(closest("jb2a.static_electricity.03.orange"))
        .atLocation(token)
        .duration(3000)
        .scaleToObject(1)
        .fadeIn(250)
        .fadeOut(250)
        .zIndex(2);

    sequence
        .motion(token)
        .scaleTo(targetScale, { duration: 1000, ease: "easeOutBounce" });

    sequence
        .thenDo(function () {
            return (token.document as any).update({
                height: targetHeight,
                width: targetWidth,
                scale: 1,
            }, { animate: false });
        })

        .effect()
        .file(closest("jb2a.extras.tmfx.outpulse.circle.01.fast"))
        .atLocation(token)
        .belowTokens()
        .opacity(0.75)
        .scaleToObject(2)
        .zIndex(1)

        .effect()
        .file(closest("jb2a.impact.ground_crack.orange.02"))
        .atLocation(token)
        .belowTokens()
        .scaleToObject(2)
        .zIndex(0)

        .effect()
        .file(closest("jb2a.particles.outward.orange.01.04"))
        .scaleIn(0.25, 500, { ease: "easeOutQuint" })
        .fadeIn(500)
        .fadeOut(1000)
        .atLocation(token)
        .randomRotation()
        .duration(3000)
        .scaleToObject(1.5)
        .zIndex(4)

        .effect()
        .file(closest("jb2a.static_electricity.03.orange"))
        .atLocation(token)
        .duration(5000)
        .scaleToObject(1)
        .fadeIn(250)
        .fadeOut(250)
        .waitUntilFinished(-3000);

    return sequence;
}

/**
 * Plays the Enlarge effect for a token.
 *
 * @param {Token} token The token to enlarge.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playEnlarge(token: Token, config: any = {}) {
    const sequence = await createEnlarge(token, config);
    if (sequence) return sequence.play();
}

/**
 * Creates a Sequencer effect for reducing a token.
 *
 * @param {Token} token The token to reduce.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createReduce(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, scaleFactor, sound } = mConfig;

    const sequence = new Sequence();
    applySound(sequence, sound.reduce);

    const targetWidth = (token.document.width - scaleFactor) > 0 ? token.document.width - scaleFactor : 0.5;
    const targetHeight = (token.document.height - scaleFactor) > 0 ? token.document.height - scaleFactor : 0.5;
    const targetScale = targetWidth / token.document.width;

    sequence
        .effect()
        .file(closest("jb2a.static_electricity.03.orange"))
        .atLocation(token)
        .duration(3000)
        .scaleToObject(1)
        .fadeIn(250)
        .fadeOut(250)
        .zIndex(2);

    sequence
        .motion(token)
        .scaleTo(targetScale, { duration: 1000, ease: "easeOutBounce" });

    sequence
        .thenDo(function () {
            return (token.document as any).update({
                height: targetHeight,
                width: targetWidth,
                scale: 1,
            }, { animate: false });
        })

        .effect()
        .file(closest("jb2a.extras.tmfx.outpulse.circle.01.fast"))
        .atLocation(token)
        .opacity(0.75)
        .scaleToObject(2)
        .zIndex(1)

        .effect()
        .file(closest("jb2a.energy_strands.in.yellow.01.2"))
        .atLocation(token)
        .belowTokens()
        .scaleToObject(2)
        .zIndex(0)

        .effect()
        .file(closest("jb2a.particles.outward.orange.01.04"))
        .scaleIn(0.25, 500, { ease: "easeOutQuint" })
        .fadeIn(500)
        .fadeOut(1000)
        .atLocation(token)
        .randomRotation()
        .duration(3000)
        .scaleToObject(1.5)
        .zIndex(4)

        .effect()
        .file(closest("jb2a.static_electricity.03.orange"))
        .atLocation(token)
        .duration(5000)
        .scaleToObject(1)
        .fadeIn(250)
        .fadeOut(250)
        .waitUntilFinished(-3000);

    return sequence;
}

/**
 * Plays the Reduce effect for a token.
 *
 * @param {Token} token The token to reduce.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playReduce(token: Token, config: any = {}) {
    const sequence = await createReduce(token, config);
    if (sequence) return sequence.play();
}

export const enlargeReduce = {
    enlarge: {
        create: createEnlarge,
        play: playEnlarge,
        stop: playReduce,
        default_config: DEFAULT_CONFIG,
    },
    reduce: {
        create: createReduce,
        play: playReduce,
        stop: playEnlarge,
        default_config: DEFAULT_CONFIG,
    },
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("enlarged", "effect", "eskie.effect.enlargeReduce.enlarge", DEFAULT_CONFIG, "0.0.2", "Enlarged");
adapter.autorec.register("reduced", "effect", "eskie.effect.enlargeReduce.reduce", DEFAULT_CONFIG, "0.0.2", "Reduced");
