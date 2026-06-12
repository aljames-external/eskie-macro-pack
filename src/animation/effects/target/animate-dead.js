/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'animateDead',
    choice: 'Skeleton' // Default to Skeleton if not specified
};

/**
 * Creates a Sequencer effect for animating a spawned undead.
 * This function assumes the undead token has already been spawned.
 *
 * @param {Token} undeadToken The newly spawned undead token.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createAnimateDead(undeadToken, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, choice } = mConfig;

    const sequence = new Sequence();

    sequence
        .thenDo(function () {
            // Note: target.document.update({overlayEffect:" "}) and target.document.delete()
            // should be handled by the calling macro/function *before* this animation starts
            // if the original token is meant to disappear. This function only animates the spawned undead.
        })
        // Magic Circle
        .wait(50)
        .effect()
        .atLocation(undeadToken)
        .file(closest(`jb2a.magic_signs.circle.02.necromancy.complete.green`))
        .size(1.25, { gridUnits: true })
        .belowTokens()
        .fadeOut(2000)
        .zIndex(0)

        .effect()
        .delay(2250)
        .atLocation(undeadToken)
        .file(closest(`jb2a.magic_signs.circle.02.necromancy.loop.green`))
        .size(1.25, { gridUnits: true })
        .belowTokens(true)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .filter("Blur", { blurX: 5, blurY: 5 })
        .zIndex(1)
        .duration(500)
        .playbackRate(2)
        .fadeIn(200, { ease: "easeOutCirc" })
        .fadeOut(300, { ease: "linear" })

        .effect()
        .file(closest("eskie.damage.electricity.01.purple"))
        .delay(2250)
        .fadeOut(1500)
        .atLocation(undeadToken)
        .duration(1500)
        .fadeOut(1000)
        .size(1.75, { gridUnits: true })
        .randomRotation()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .zIndex(1)

        //Build Up
        .effect()
        .delay(2250)
        .file(closest("jb2a.cast_generic.ice.01.blue.0"))
        .atLocation(undeadToken)
        .size(1.5, { gridUnits: true })
        .opacity(0.8)
        .filter("ColorMatrix", { brightness: 0, hue: -45 })
        .playbackRate(2)
        .zIndex(2)
        .waitUntilFinished(-200)

        //Explosion
        .effect()
        .delay(200)
        .file(closest("eskie.lightning.lightning_bolt.blue"))
        .rotate(-90)
        .atLocation(undeadToken, { offset: { y: -0.4 }, gridUnits: true })
        .size(1.5, { gridUnits: true })
        .playbackRate(1.5)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .mirrorY()
        .waitUntilFinished(-200)

        .effect()
        .file(closest("animated-spell-effects-cartoon.electricity.discharge.06"))
        .atLocation(undeadToken)
        .size(2.25, { gridUnits: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .playbackRate(0.8)
        .fadeOut(500)
        .zIndex(2)

        .effect()
        .file(closest("jb2a.impact.dark.01.red.0"))
        .atLocation(undeadToken)
        .size(2.5, { gridUnits: true })
        .filter("ColorMatrix", { hue: 90 })
        .randomizeMirrorX()
        .randomizeMirrorY()

        .effect()
        .file(closest("jb2a.liquid.splash.red"))
        .atLocation(undeadToken)
        .size(1.65, { gridUnits: true })
        .belowTokens()
        .zIndex(0.1)

        .effect()
        .delay(250)
        .file(closest("animated-spell-effects-cartoon.water.117"))
        .attachTo(undeadToken)
        .size(1.3, { gridUnits: true })
        .belowTokens()
        .fadeOut(1000)
        .duration(8000)
        .randomRotation()
        .loopOptions({ loops: 1 })
        .filter("ColorMatrix", { hue: -5, saturate: 1, brightness: 0.6 })
        .zIndex(0.2)

        .animation()
        .on(undeadToken)
        .fadeIn(500)

        .effect()
        .file(closest("jb2a.fireflies.many.02.green"))
        .atLocation(undeadToken)
        .size(1.25, { gridUnits: true })
        .duration(3000)
        .fadeIn(500)
        .fadeOut(1000)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .randomRotation()
        .zIndex(3)

        .effect()
        .delay(250)
        .file(closest("jb2a.static_electricity.03.blue"))
        .atLocation(undeadToken)
        .size(1.25, { gridUnits: true })
        .belowTokens()
        .fadeOut(3000)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .opacity(0.75)
        .playbackRate(4)
        .fadeOut(1000)
        .randomRotation()
        .repeats(5, 1000, 1500)
        .zIndex(0.3);

    return sequence;
}

/**
 * Plays the Animate Dead effect for a spawned undead token.
 * This function assumes the undead token has already been spawned.
 *
 * @param {Token} undeadToken The newly spawned undead token.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playAnimateDead(undeadToken, config = {}) {
    const sequence = await createAnimateDead(undeadToken, config);
    if (sequence) { return sequence.play(); }
}

/**
 * Placeholder for a stop function if there were persistent effects.
 * For Animate Dead, the effects are mostly transient.
 * @param {Token} token The token to stop effects on.
 * @param {object} options Options for stopping effects.
 */
function stopAnimateDead(token, { id = DEFAULT_CONFIG.id } = {}) {
    // No persistent effects to stop for Animate Dead based on the original script.
    // If there were persistent effects, this is where they would be stopped.
}

export const animateDead = {
    create: createAnimateDead,
    play: playAnimateDead,
    stop: stopAnimateDead,
    default_config: DEFAULT_CONFIG,
};
