// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { file } from '../../../lib/filemanager.js';

/**
 * Creates the Grease animation sequence at a specified location.
 * @param {Token} token - The casting token.
 * @param {object} position - The {x, y} coordinates of the center of the Grease area.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token, position, config = {}) {
    const sequence = new Sequence();
    sequence
        .effect()
        .atLocation(token)
        .file(file(`jb2a.magic_signs.circle.02.conjuration.loop.yellow`))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens()
        .fadeOut(2000)
        .zIndex(0)

        .effect()
        .atLocation(token)
        .file(file(`jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow`))
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
        .atLocation(position)
        .file(file(`jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow`))
        .size(2.2, { gridUnits: true })
        .fadeIn(600)
        .opacity(1)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .belowTokens()

        .effect()
        .file(file("jb2a.particles.outward.white.01.02"))
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .delay(500)
        .fadeOut(1000)
        .atLocation(token)
        .duration(1000)
        .size(1.75, { gridUnits: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
        .zIndex(1)
        .waitUntilFinished(500)

        .effect()
        .file(file("jb2a.water_splash.circle.01.black"))
        .atLocation(position)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .scaleOut(0, 1500, { ease: "linear" })
        .fadeIn(500)
        .fadeOut(1000)
        .belowTokens()
        .zIndex(2)
        .size(1.5, { gridUnits: true })

        .effect()
        .delay(100)
        .file(file('jb2a.grease.dark_brown'))
        .atLocation(position)
        .belowTokens()
        .fadeIn(5000)
        .zIndex(1)
        .randomRotation()
        .scaleOut(0, 1500, { ease: "linear" })
        .fadeOut(1000)
        .scaleIn(0, 5000, { ease: "easeOutCubic" })
        .size(2.2, { gridUnits: true })
        .persist()
        .name('Grease');

    return sequence;
}

/**
 * Plays the Grease animation, including crosshair placement.
 * @param {Token} token - The casting token.
 * @param {object} options - Options for playing the animation, including config.
 */
async function play(token, position, config = {}) {
    if (!position) {
        const crosshairConfig = {
            size: 2,
            icon: 'modules/jb2a_patreon/Library/1st_Level/Grease/Grease_Dark_Brown_Thumb.webp',
            label: 'Grease',
            tag: 'slimy',
            t: 'circle',
            drawIcon: true,
            drawOutline: true,
            interval: 1,
            rememberControlled: true,
        };
        position = await Sequencer.Crosshair.show(crosshairConfig);
        if (position.cancelled) { return; }
    }

    const sequence = await create(token, position, config);
    if (sequence) return sequence.play();
}

/**
 * Stops the persistent Grease effects.
 * @param {Token} token - The casting token (effects are named "Grease").
 */
async function stop(token) {
    await Sequencer.EffectManager.endEffects({ name: "Grease" });
}

export const grease = {
    create,
    play,
    stop,
};