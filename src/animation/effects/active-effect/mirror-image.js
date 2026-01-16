/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'mirrorImage',
    imageNumber: 3, // Default number of mirror images
};

/**
 * Creates a Sequencer effect for Mirror Image.
 *
 * @param {Token} token The token creating mirror images.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createMirrorImage(token, config = {}) {
    const { id, imageNumber } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id} - ${token.id}`;

    const sequence = new Sequence()
        .effect()
            .file(closest("jb2a.shimmer.01.purple"))
            .opacity(0.5)
            .rotate(-90)
            .scaleToObject(1.25)
            .atLocation(token)

        .animation()
            .on(token)
            .opacity(0)

        .effect()
            .file(closest("jb2a.particles.outward.orange.02.03"))
            .scaleToObject(2.5)
            .atLocation(token)
            .fadeIn(1000)
            .duration(10000)
            .fadeOut(2000)
            .randomRotation()

        .effect()
            .copySprite(token)
            .atLocation(token)
            .belowTokens()
            .animateProperty("spriteContainer", "position.x", { from: -80, to: 80, duration: 1500, pingPong: true })
            .duration(1500)
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .effect()
            .copySprite(token)
            .atLocation(token)
            .belowTokens()
            .animateProperty("spriteContainer", "position.x", { from: 80, to: -80, duration: 1500, pingPong: true })
            .duration(1500)
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .wait(500)

        // Image 1
        .effect()
            .name(`${label} (1)`) // Unique name for stopping
            .copySprite(token)
            .atLocation(token)
            .scale(1)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty("spriteContainer", "rotation", { from: 180, to: -10, duration: 500 })
            .loopProperty("sprite", "position.x", { from: -5, to: 5, duration: 2500, pingPong: true })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .zIndex(4)

        // Image 2
        .effect()
            .name(`${label} (2)`) // Unique name for stopping
            .copySprite(token)
            .playIf(imageNumber >= 2)
            .atLocation(token)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty("spriteContainer", "rotation", { from: 0, to: 190, duration: 500 })
            .loopProperty("sprite", "position.x", { from: -5, to: 5, duration: 2500, pingPong: true, delay: 250 })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .zIndex(4)

        // Image 3
        .effect()
            .name(`${label} (3)`) // Unique name for stopping
            .copySprite(token)
            .playIf(imageNumber === 3)
            .atLocation(token)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty("spriteContainer", "rotation", { from: 0, to: 90, duration: 250 })
            .loopProperty("sprite", "position.x", { from: -5, to: 5, duration: 2500, pingPong: true })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint("#d0c2ff")
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .delay(100)
            .zIndex(4)

        .wait(200)

        .effect()
            .file(closest("jb2a.shimmer.01.purple"))
            .opacity(0.5)
            .rotate(90)
            .scaleToObject(1.25)
            .atLocation(token)
    ;

    return sequence;
}

/**
 * Plays the Mirror Image effect on a token.
 *
 * @param {Token} token The token creating mirror images.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the sequence starts playing.
 */
async function playMirrorImage(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, imageNumber } = mConfig;

    // First check if a Mirror Image effect is already active for this token
    // If it is, stop it (acting as a toggle)
    const label = `${id} - ${token.id}`;
    const activeEffect = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;

    if (activeEffect) {
        await stopMirrorImage(token, mConfig);
        return;
    }

    // If not active, then play it
    const sequence = await createMirrorImage(token, mConfig);
    if (sequence) {
        // Initial token opacity setup
        await new Sequence()
            .animation()
                .on(token)
                .opacity(0)
                .play();

        await sequence.play();

        // Final token opacity fade-in
        await new Sequence()
            .animation()
                .on(token)
                .fadeIn(1000)
                .opacity(1)
                .play();
    }
}

/**
 * Stops the persistent Mirror Image effects on a token.
 *
 * @param {Token} token The token to remove mirror images from.
 * @param {object} config Configuration options.
 */
async function stopMirrorImage(token, config = {}) {
    const { id, imageNumber } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id} - ${token.id}*`;

    Sequencer.EffectManager.endEffects({ name: label });

    // Ensure the original token fades back in if it was hidden
    await new Sequence()
        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1)
            .play();
}

export const mirrorImage = {
    create: createMirrorImage,
    play: playMirrorImage,
    stop: stopMirrorImage,
};

autoanimations.register("Mirror Image", "effect", "eskie.effect.mirrorImage", DEFAULT_CONFIG);