/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';
import { dialog } from '../../../lib/dialog.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'shapechange',
    // Path to the token's base (human) form image.
    baseForm: '',
    // Path to the hybrid form token image.
    hybridForm: 'https://files.d20.io/images/390116904/V1XE3gOTz6-hHEg-_jQt3g/original.png',
    // Path to the wolf form token image.
    wolfForm: 'https://files.d20.io/images/390116931/NRBle2scKhQmU-q0EHskPw/original.png',
};

/**
 * Prompts the user to choose a form (Hybrid or Wolf) and plays the
 * transformation-into animation, then swaps the token image.
 *
 * @param {Token} token The token that is changing shape.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence|null} The created Sequence, or null if the dialog was cancelled.
 */
async function createShapechange(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    let { baseForm, hybridForm, wolfForm } = mConfig;
    let shapechangeData = token.document.getFlag('eskie-macros', 'shapechange');
    if (!shapechangeData) {
        shapechangeData = { baseForm: baseForm ?? token.document.texture.src };
        await token.document.setFlag('eskie-macros', 'shapechange', shapechangeData);
    } else {
        baseForm = shapechangeData.baseForm;
    }

    // Ask the player which form to shift into.
    const choice = await dialog.buttonDialog({
        title: 'Change Shape',
        buttons: [
            { label: 'Hybrid Form', value: 'hybrid' },
            { label: 'Wolf Form', value: 'wolf' },
        ],
    });

    if (choice === false) return null;

    const targetForm = choice === 'hybrid' ? hybridForm : wolfForm;

    const sequence = new Sequence();

    // Dark outflow vortex beneath the token — builds atmosphere.
    sequence
        .effect()
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(token)
        .duration(5000)
        .fadeIn(500)
        .scaleIn(0, 750, { ease: 'easeOutSine' })
        .fadeOut(500)
        .scaleToObject(1.5, { considerTokenScale: true })
        .randomRotation()
        .filter('ColorMatrix', { saturate: -0, brightness: 0 })
        .animateProperty('sprite', 'scale.x', { from: 0, to: 0.25 * token.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeOutCubic', delay: 2600 })
        .animateProperty('sprite', 'scale.y', { from: 0, to: 0.25 * token.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeOutCubic', delay: 2600 })
        .belowTokens()

        // Swirling dark vortex ring.
        .effect()
        .delay(400)
        .file(closest('jb2a.template_circle.vortex.loop.dark_black'))
        .attachTo(token)
        .duration(4000)
        .fadeIn(500)
        .scaleIn(0, 2400, { ease: 'easeOutSine' })
        .fadeOut(500)
        .scaleToObject(1.55, { considerTokenScale: true })
        .randomRotation()
        .filter('ColorMatrix', { saturate: -0, brightness: 0 })
        .belowTokens()

        // Ghost of the current token image — stretches and squashes as it warps.
        .effect()
        .copySprite(token)
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('sprite', 'scale.x', { from: (token.document.width * 1.1) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeInOutBack' })
        .animateProperty('sprite', 'scale.y', { from: (token.document.width) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 750, gridUnits: true, ease: 'easeOutBack' })
        .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
        .opacity(0.65)
        .repeats(3, 800, 800)

        // First ghost of the target form — very faint, brightened.
        .effect()
        .file(closest(targetForm))
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('sprite', 'scale.x', { from: (token.document.width * 1.1) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeInOutBack' })
        .animateProperty('sprite', 'scale.y', { from: (token.document.width) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 750, gridUnits: true, ease: 'easeOutBack' })
        .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
        .opacity(0.25)
        .filter('ColorMatrix', { brightness: 0.75 })

        // Second ghost — slightly more opaque.
        .effect()
        .file(closest(targetForm))
        .delay(800)
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('sprite', 'scale.x', { from: (token.document.width * 1.1) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeInOutBack' })
        .animateProperty('sprite', 'scale.y', { from: (token.document.width) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 750, gridUnits: true, ease: 'easeOutBack' })
        .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
        .opacity(0.5)
        .filter('ColorMatrix', { brightness: 0.5 })

        // Third ghost — nearly solid.
        .effect()
        .file(closest(targetForm))
        .delay(1600)
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('sprite', 'scale.x', { from: (token.document.width * 1.1) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeInOutBack' })
        .animateProperty('sprite', 'scale.y', { from: (token.document.width) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 750, gridUnits: true, ease: 'easeOutBack' })
        .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
        .opacity(0.75)
        .filter('ColorMatrix', { brightness: 0.25 })

        // Glowing red eyes flash at the peak of the transformation.
        .effect()
        .delay(3000)
        .file(closest('jb2a.eyes.01.dark_red.single'))
        .duration(1250)
        .attachTo(token)
        .scaleToObject(1.15, { considerTokenScale: true })
        .fadeOut(500)
        .zIndex(1)

        // Final blurred ghost of the target form before the swap.
        .effect()
        .file(closest(targetForm))
        .delay(2400)
        .attachTo(token)
        .duration(2000)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('sprite', 'scale.x', { from: (token.document.width * 1.1) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeInOutBack' })
        .animateProperty('sprite', 'scale.y', { from: (token.document.width) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 750, gridUnits: true, ease: 'easeOutBack' })
        .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
        .opacity(0.75)
        .filter('ColorMatrix', { brightness: 0.2 })

        // Copy of the current token sprite — blurred and darkened during the climax.
        .effect()
        .copySprite(token)
        .delay(2400)
        .attachTo(token)
        .duration(2000)
        .fadeIn(750)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('sprite', 'scale.x', { from: (token.document.width * 1.1) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeInOutBack' })
        .animateProperty('sprite', 'scale.y', { from: (token.document.width) * token.document.texture.scaleX, to: (token.document.width * 1.25) * token.document.texture.scaleX, duration: 750, gridUnits: true, ease: 'easeOutBack' })
        .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
        .opacity(1)
        .filter('ColorMatrix', { brightness: 0 })
        .filter('Blur', { blurX: 5, blurY: 5 })
        .zIndex(0)
        .waitUntilFinished(-500)

        // Swap the token image to the chosen form.
        .thenDo(function () {
            token.document.update({ 'texture.src': targetForm });
        })

        // Claw slash impact — below the token for atmosphere.
        .effect()
        .file(closest('jb2a.claws.200px.dark_red'))
        .atLocation(token)
        .scaleToObject(2.15, { considerTokenScale: true })
        .fadeOut(500)
        .playbackRate(1.5)
        .belowTokens()
        .zIndex(1)

        // Dark impact burst beneath the token.
        .effect()
        .file(closest('jb2a.impact.004.dark_red'))
        .atLocation(token)
        .scaleToObject(2.75, { considerTokenScale: true })
        .belowTokens()
        .fadeOut(500)
        .filter('ColorMatrix', { brightness: 0 })
        .opacity(0.85)
        ;

    return sequence;
}

/**
 * Creates a Sequencer effect for reverting the token back to its base form.
 *
 * @param {Token} token The token reverting to its base form.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createRevert(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { baseForm } = token.document.getFlag('eskie-macros', 'shapechange');

    const currentForm = token.document.texture.src;

    const sequence = new Sequence();

    // Wide outflow vortex — larger than the forward transform to signal unwinding.
    sequence
        .effect()
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(token)
        .duration(6000)
        .fadeIn(500)
        .scaleIn(0, 750, { ease: 'easeOutSine' })
        .scaleOut(0, 4000, { ease: 'easeOutSine' })
        .fadeOut(500)
        .scaleToObject(1.75, { considerTokenScale: true })
        .randomRotation()
        .filter('ColorMatrix', { saturate: -0, brightness: 0 })
        .belowTokens()

        // The current (animal) form image fades away slowly.
        .effect()
        .file(closest(currentForm))
        .attachTo(token)
        .duration(5000)
        .fadeOut(4000, { ease: 'easeInSine' })
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 500, pingPong: true, gridUnits: true, delay: 1000 })

        .wait(500)

        // Burst of white energy particles expanding outward — the form breaking apart.
        .effect()
        .delay(500)
        .file(closest('jb2a.particles.outward.white.01.03'))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, followRotation: false })
        .scaleToObject()
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: 'easeOutCubic' })
        .animateProperty('sprite', 'width', { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: 'easeOutBack' })
        .animateProperty('sprite', 'height', { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
        .animateProperty('sprite', 'position.y', { from: -0, to: -0.6, duration: 1000, gridUnits: true })
        .filter('ColorMatrix', { saturate: -0, brightness: 0 })
        .belowTokens()
        .randomizeMirrorX()
        .opacity(1)
        .repeats(14, 250, 250)
        .zIndex(0.3)

        // Swap the token image back to the base form.
        .thenDo(function () {
            token.document.update({ 'texture.src': baseForm });
        })
        ;

    return sequence;
}

/**
 * Plays the shapechange (forward) animation for a token.
 *
 * @param {Token} token The token to transform.
 * @param {object} config Configuration options.
 * @returns {Promise<void>}
 */
async function playShapechange(token, config = {}) {
    const sequence = await createShapechange(token, config);
    if (sequence) return sequence.play();
}

/**
 * Plays the revert (return to base form) animation for a token.
 *
 * @param {Token} token The token to revert.
 * @param {object} config Configuration options.
 * @returns {Promise<void>}
 */
async function playRevert(token, config = {}) {
    const sequence = await createRevert(token, config);
    if (sequence) return sequence.play();
}

export const shapechange = {
    shapechange: {
        create: createShapechange,
        play: playShapechange,
        stop: playRevert,
        default_config: DEFAULT_CONFIG,
    },
    revert: {
        create: createRevert,
        play: playRevert,
        default_config: DEFAULT_CONFIG,
    },
    play: playShapechange,
    stop: playRevert,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register('Shapechange', 'effect', 'eskie.effect.shapechange', DEFAULT_CONFIG, '0.1.0');
