/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { file } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'viciousMockery',
    word: "Haha!", // Default word if no user input
};

/**
 * Creates a Sequencer effect for the casting animation of Vicious Mockery.
 *
 * @param {Token} token The token casting the spell.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object for the casting.
 */
async function createViciousMockeryCast(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    // const { id } = mConfig; // Not directly used in this animation for naming persistent effects

    const sequence = new Sequence();

    sequence
        .effect()
        .name("Casting") // Note: Original script used this name, but it's not made persistent so no stop needed.
        .atLocation(token)
        .file(file(`jb2a.magic_signs.circle.02.enchantment.loop.purple`))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens()
        .fadeOut(2000)
        .zIndex(0)

        .effect()
        .atLocation(token)
        .file(file(`jb2a.magic_signs.circle.02.enchantment.loop.purple`))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens(true)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(1)
        .duration(1200)
        .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
        .fadeOut(300, { ease: "linear" })

        .effect()
        .file(file("jb2a.music_notations.{{music}}.purple"))
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .delay(500)
        .atLocation(token, { offset: { y: -0.2 }, gridUnits: true, randomOffset: 1.5 })
        .scaleToObject(0.5)
        .zIndex(1)
        .playbackRate(1.5)
        .setMustache({
            "music": () => {
                const musics = [`bass_clef`, `beamed_quavers`, `crotchet`, `flat`, `quaver`, `treble_clef`];
                return musics[Math.floor(Math.random() * musics.length)];
            }
        })
        .repeats(5, 200, 200)
        .fadeOut(500)
    ;

    return sequence;
}

/**
 * Creates a Sequencer effect for the impact animation of Vicious Mockery.
 *
 * @param {Token} target The token being targeted.
 * @param {string} word The mockery word to display.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object for the impact.
 */
async function createViciousMockeryImpact(target, word, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    // const { id } = mConfig; // Not directly used in this animation for naming persistent effects

    const sequence = new Sequence();

    const style = {
        "fill": "#ffffff",
        "fontFamily": "Helvetica",
        "fontSize": 48 * target.document.width,
        "strokeThickness": 0,
        fontWeight: "bold",
    };

    sequence
        .effect()
        .atLocation(target, { offset: { x: -0.25 * target.document.width, y: -0.3 * target.document.width }, randomOffset: 0.1, gridUnits: true })
        .file(file(`animated-spell-effects-cartoon.level 01.healing word.purple`))
        .fadeOut(250)
        .zIndex(1)
        .scale(0.25 * target.document.width)
        .scaleIn(0, 500, { ease: "easeOutBack" })
        .zIndex(0)
        .animateProperty("spriteContainer", "position.x", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("spriteContainer", "position.y", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 10, ease: "easeOutElastic" })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .filter("ColorMatrix", { hue: 50 })

        .effect()
        .file(file("jb2a.particles.outward.orange.02.02"))
        .atLocation(target, { offset: { x: -0.25 * target.document.width, y: -0.3 * target.document.width }, randomOffset: 0.1, gridUnits: true })
        .scale(0.25 * target.document.width)
        .duration(800)
        .fadeOut(200)
        .zIndex(1)
        .animateProperty("spriteContainer", "position.x", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("spriteContainer", "position.y", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 10, ease: "easeOutElastic" })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .zIndex(2)

        .effect()
        .atLocation(target, { offset: { x: -0.25 * target.document.width, y: -0.3 * target.document.width }, randomOffset: 0.1, gridUnits: true })
        .text(`${word}`, style)
        .duration(2000)
        .fadeOut(1000)
        .animateProperty("spriteContainer", "position.x", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("spriteContainer", "position.y", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 10, ease: "easeOutElastic" })
        .animateProperty("sprite", "rotation", { from: -2.5, to: 2.5, duration: 500, ease: "easeOutElastic", delay: 650 })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .filter("Glow", { color: 0x6820ee })
        .zIndex(2)
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -2, y: -2 }, { x: 1.175, y: -1 }, { x: -1, y: 1.175 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })

        .effect()
        .delay(600)
        .file(file("jb2a.impact.010.purple"))
        .atLocation(target, { offset: { x: -0.25 * target.document.width, y: -0.3 * target.document.width }, gridUnits: true })
        .scaleToObject(1.25)
        .zIndex(1)

        .effect()
        .delay(600)
        .copySprite(target)
        .attachTo(target)
        .fadeIn(200)
        .fadeOut(500)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .scaleToObject(target.document.texture.scaleX)
        .duration(1800)
        .opacity(0.2)
        .tint(0x6820ee)

        .effect()
        .delay(800)
        .file(file("animated-spell-effects-cartoon.misc.demon"))
        .atLocation(target, { offset: { x: -0, y: -0.5 * target.document.width }, gridUnits: true })
        .scaleToObject(0.75)
        .playbackRate(1.5)
        .rotate(-20)
        .filter("ColorMatrix", { hue: -100 })

        .effect()
        .delay(1100)
        .file(file("animated-spell-effects-cartoon.misc.demon"))
        .atLocation(target, { offset: { x: -0.5 * target.document.width, y: -0 }, gridUnits: true })
        .scaleToObject(0.75)
        .playbackRate(1.5)
        .rotate(15)
        .filter("ColorMatrix", { hue: -100 })
    ;

    return sequence;
}

/**
 * Plays the Vicious Mockery effect, including user input for the word.
 *
 * @param {Token} token The token casting the spell.
 * @param {Token} target The token being targeted.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the effect sequences finish playing.
 */
async function playViciousMockery(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { word } = mConfig;

    // Play casting animation
    const castSequence = await createViciousMockeryCast(token, mConfig);
    if (castSequence) { await castSequence.play(); }

    // Play impact animation
    const impactSequence = await createViciousMockeryImpact(target, word, mConfig);
    if (impactSequence) { await impactSequence.play(); }
}

/**
 * Placeholder for a stop function. Vicious Mockery is a transient effect.
 * @param {Token} token The token.
 * @param {object} options Options for stopping effects.
 */
function stopViciousMockery(token, { id = DEFAULT_CONFIG.id } = {}) {
    // No persistent effects to stop for Vicious Mockery.
}

export const viciousMockery = {
    cast: {
        create: createViciousMockeryCast,
        play: playViciousMockery, // The main play function for the spell
        stop: stopViciousMockery,
    },
    impact: {
        create: createViciousMockeryImpact,
        // play is integrated into playViciousMockery
    },
};
