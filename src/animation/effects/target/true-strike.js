/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'trueStrike',
};

/**
 * Creates a Sequencer effect for the casting of True Strike.
 * This effect is persistent.
 *
 * @param {Token} token The token casting the spell.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createTrueStrikeCast(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    const sequence = new Sequence();

    sequence
        .effect()
        .file(closest("jb2a.ward.star.yellow.02"))
        .atLocation(token)
        .scale(0.25)
        .duration(3000)
        .fadeIn(1000)
        .fadeOut(500)

        .effect()
        .file(closest("jb2a.ward.star.yellow.02"))
        .atLocation(token)
        .scale(0.25)
        .fadeIn(500)
        .fadeOut(500)
        .filter("ColorMatrix", { saturate: -1, brightness: 1.5 })
        .duration(1000)

        .effect()
        .file(closest("jb2a.particles.outward.orange.01.03"))
        .scaleIn(0.25, 500, { ease: "easeOutQuint" })
        .size(2, { gridUnits: true })
        .fadeIn(500)
        .atLocation(token)
        .duration(3500)
        .fadeOut(2500)

        .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .size(1.5, { gridUnits: true })

        .effect()
        .name(`TrueStrike - Glint - ${id} - ${token.uuid}`) // Persistent glint effect
        .file(closest("jb2a.glint.blue.few.0"))
        .atLocation(token)
        .scaleToObject(1.75)
        .attachTo(token)
        .persist()

        .effect()
        .file(closest("jb2a.token_border.circle.spinning.blue.001"))
        .atLocation(token)
        .attachTo(token)
        .fadeIn(200)
        .fadeOut(500)
        .duration(750)
        .filter("ColorMatrix", { saturate: -1, brightness: 1.5 })
        .zIndex(1)
        .scaleToObject(2)

        .effect()
        .name(`TrueStrike - Border - ${id} - ${token.uuid}`) // Persistent border effect
        .file(closest("jb2a.token_border.circle.spinning.orange.001"))
        .atLocation(token)
        .attachTo(token)
        .fadeIn(700)
        .scaleToObject(2)
        .playbackRate(5)
        .filter("ColorMatrix", { hue: 30, saturate: 1, contrast: 0, brightness: 1 })
        .scaleOut(0, 250)
        .opacity(0.9)
        .persist()
    ;

    return sequence;
}

/**
 * Plays the True Strike Cast effect.
 *
 * @param {Token} token The token casting the spell.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the sequence starts playing.
 */
async function playTrueStrikeCast(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Check if TrueStrike tag already exists, if so, remove it (toggle behavior)
    if (Tagger.hasTags(token, "TrueStrike")) {
        await stopTrueStrike(token, mConfig);
        return;
    }

    Tagger.addTags(token, "TrueStrike");
    const sequence = await createTrueStrikeCast(token, mConfig);
    if (sequence) { return sequence.play(); }
}

/**
 * Creates a Sequencer effect for the True Strike Attack.
 *
 * @param {Token} token The attacking token.
 * @param {Token} target The targeted token.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createTrueStrikeAttack(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    // const { id } = mConfig; // Not directly used in this animation for naming persistent effects

    const sequence = new Sequence();

    sequence
        .effect()
        .file(closest("jb2a.impact.002.yellow"))
        .atLocation(token)
        .scaleToObject(2)
        .delay(1250)

        .wait(1000)

        .effect()
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token)
        .rotateTowards(target)
        .rotate(-180)
        .anchor({ x: 0.5 })
        .size(1, { gridUnits: true })
        .opacity(1)
        .duration(1500)
        .loopProperty("sprite", "position.x", { from: -5, to: 5, duration: 50, pingPong: true })
        .fadeOut(3000)
        .zIndex(1)

        .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .anchor({ x: 0.25 })
        .rotateTowards(target)
        .animateProperty("sprite", "scale.y", { from: 0.5, to: 1, duration: 50, pingPong: false })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -500, duration: 5000 })
        .scaleToObject()

        .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .rotateTowards(target)
        .anchor({ x: -0.25 })
        .scaleToObject(0.75)
        .animateProperty("sprite", "scale.y", { from: 0.25, to: 0.75, duration: 50, pingPong: false })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -500, duration: 5000 })
        .delay(25)

        .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .anchor({ x: -1.25 })
        .rotateTowards(target)
        .animateProperty("sprite", "scale.y", { from: 0.25, to: 0.5, duration: 50, pingPong: false })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -500, duration: 5000 })
        .scaleToObject(0.5)
        .delay(40)

        .effect()
        .file(closest("modules/animated-spell-effects-cartoon/spell-effects/cartoon/magic/mind_sliver_LINE.webm"))
        .atLocation(target)
        .anchor({ x: 0.75 })
        .scale(0.075)
        .rotateTowards(token)
        .delay(10)
        .rotate(180)
        .zIndex(2)

        .effect()
        .file(closest("jb2a.impact.ground_crack.orange.02"))
        .atLocation(target)
        .filter("ColorMatrix", { hue: 20, saturate: 1 })
        .scaleToObject(0.7)
        .fadeOut(5000)
        .delay(10)
        .zIndex(1)

        .effect()
        .file(closest("jb2a.impact.yellow.2"))
        .atLocation(target)
        .scaleToObject(3)
        .delay(0)
        .zIndex(2)
        .waitUntilFinished(-2000)

        .effect()
        .file(closest("jb2a.ground_cracks.orange.02"))
        .atLocation(target)
        .filter("ColorMatrix", { hue: 20, saturate: 1 })
        .scaleToObject(0.7)
        .delay(10)
        .fadeOut(1000)
        .duration(4000)
        .zIndex(0)

        .effect()
        .file(closest("jb2a.particles.outward.orange.01.03"))
        .scaleIn(0.25, 500, { ease: "easeOutQuint" })
        .fadeIn(250)
        .rotateTowards(token)
        .fadeOut(500)
        .scaleToObject(1.5)
        .atLocation(target)
        .animateProperty("spriteContainer", "position.x", { from: -250, to: -1000, duration: 5000 })
        .duration(2000)
        .delay(0)

        .effect()
        .file(closest("jb2a.glint.blue.many.0"))
        .atLocation(target)
        .randomRotation()
        .scaleToObject(0.75)
        .attachTo(target)
        .fadeIn(1000)
        .fadeOut(1000)
    ;

    return sequence;
}

/**
 * Plays the True Strike Attack effect.
 *
 * @param {Token} token The attacking token.
 * @param {Token} target The targeted token.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the sequence finishes playing.
 */
async function playTrueStrikeAttack(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (!target) {
        console.warn("True Strike Attack: No target provided.");
        return;
    }

    if (!Tagger.hasTags(token, "TrueStrike")) {
        console.warn("True Strike Attack: Attacking token does not have 'TrueStrike' tag.");
        return;
    }

    await stopTrueStrike(token, mConfig); // End persistent cast effects and remove tag

    const sequence = await createTrueStrikeAttack(token, target, mConfig);
    if (sequence) { return sequence.play(); }
}

/**
 * Stops the persistent True Strike effects and removes the "TrueStrike" tag.
 *
 * @param {Token} token The token to remove effects from.
 * @param {object} config Configuration options.
 */
async function stopTrueStrike(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (Tagger.hasTags(token, "TrueStrike")) {
        await Tagger.removeTags(token, "TrueStrike");
    }
    Sequencer.EffectManager.endEffects({ name: `TrueStrike - Glint - ${id} - ${token.uuid}` });
    Sequencer.EffectManager.endEffects({ name: `TrueStrike - Border - ${id} - ${token.uuid}` });
}

export const trueStrike = {
    cast: {
        create: createTrueStrikeCast,
        play: playTrueStrikeCast,
        stop: stopTrueStrike,
    },
    attack: {
        create: createTrueStrikeAttack,
        play: playTrueStrikeAttack,
    },
};
