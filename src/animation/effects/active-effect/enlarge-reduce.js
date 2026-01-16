/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'enlargeReduce',
    scaleFactor: 1, // Default scale factor for enlarge/reduce
};

/**
 * Creates a Sequencer effect for enlarging a token.
 *
 * @param {Token} token The token to enlarge.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createEnlarge(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, scaleFactor } = mConfig;

    const sequence = new Sequence();

    sequence
        .effect()
        .file(closest("jb2a.static_electricity.03.orange"))
        .atLocation(token)
        .duration(3000)
        .scaleToObject(1)
        .fadeIn(250)
        .fadeOut(250)
        .zIndex(2)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .scaleToObject(2)
        .duration(500)
        .scaleIn(0.25, 500)
        .fadeIn(250)
        .fadeOut(250)
        .repeats(3, 500, 500)
        .opacity(0.2)
        .zIndex(1)

        .animation()
        .on(token)
        .opacity(0)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 75, pingPong: true, delay: 200 })
        .duration(2000)
        .waitUntilFinished(-200)
        .zIndex(0)

        .thenDo(function () {
            token.document.update({
                height: (token.document.height > 0.5) ? token.document.height + scaleFactor : 1,
                width: (token.document.width > 0.5) ? token.document.width + scaleFactor : 1,
                scale: 1,
            }, { animate: false });
        })

        .animation()
        .on(token)
        .teleportTo({ x: token.x, y: token.y })
        .snapToGrid()

        .wait(200)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .scaleToObject(1)
        .duration(3000)
        .scaleIn(0.25, 700, { ease: "easeOutBounce" })

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
        .waitUntilFinished(-3000)

        .animation()
        .on(token)
        .opacity(1)
    ;

    return sequence;
}

/**
 * Plays the Enlarge effect for a token.
 *
 * @param {Token} token The token to enlarge.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playEnlarge(token, config = {}) {
    const sequence = await createEnlarge(token, config);
    if (sequence) { return sequence.play(); }
}

/**
 * Creates a Sequencer effect for reducing a token.
 *
 * @param {Token} token The token to reduce.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createReduce(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, scaleFactor } = mConfig;

    const sequence = new Sequence();

    sequence
        .effect()
        .file(closest("jb2a.static_electricity.03.orange"))
        .atLocation(token)
        .duration(3000)
        .scaleToObject(1)
        .fadeIn(250)
        .fadeOut(250)
        .zIndex(2)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .scaleToObject(2)
        .duration(500)
        .scaleIn(0.25, 500)
        .fadeIn(250)
        .fadeOut(250)
        .repeats(3, 500, 500)
        .opacity(0.2)
        .zIndex(1)

        .animation()
        .on(token)
        .opacity(0)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .loopProperty("sprite", "rotation", { from: -10, to: 10, duration: 75, pingPong: true, delay: 200 })
        .duration(2000)
        .waitUntilFinished(-200)
        .zIndex(0)

        .thenDo(function () {
            token.document.update({
                height: (token.document.height - scaleFactor) > 0 ? token.document.height - scaleFactor : 0.5,
                width: (token.document.width - scaleFactor) > 0 ? token.document.width - scaleFactor : 0.5,
                scale: 1,
            }, { animate: false });
        })

        .animation()
        .on(token)
        .teleportTo({ x: token.x, y: token.y })
        .snapToGrid()

        .wait(200)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .scaleToObject(1)
        .duration(3000)
        .scaleIn(0.25, 700, { ease: "easeOutBounce" })

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
        .waitUntilFinished(-3000)

        .animation()
        .on(token)
        .opacity(1)
    ;

    return sequence;
}

/**
 * Plays the Reduce effect for a token.
 *
 * @param {Token} token The token to reduce.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playReduce(token, config = {}) {
    const sequence = await createReduce(token, config);
    if (sequence) { return sequence.play(); }
}

export const enlargeReduce = {
    enlarge: {
        create: createEnlarge,
        play: playEnlarge,
        stop: playReduce,
    },
    reduce: {
        create: createReduce,
        play: playReduce,
        stop: playEnlarge,
    },
};

autoanimations.register("Enlarged", "effect", "eskie.effect.enlargeReduce.enlarge", DEFAULT_CONFIG);
autoanimations.register("Reduced", "effect", "eskie.effect.enlargeReduce.reduce", DEFAULT_CONFIG);
