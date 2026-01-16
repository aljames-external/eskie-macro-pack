/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'stunningStrike',
};

/**
 * Creates a Sequencer effect for a Stunning Strike.
 *
 * @param {Token} token The token performing the strike.
 * @param {Token} target The token being stunned.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createStunningStrike(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    const sequence = new Sequence();

    const middle = {
        x: (target.center.x - token.center.x) * 0.25,
        y: (target.center.y - token.center.y) * 0.25,
    };

    sequence
        .effect()
        .file(closest("jb2a.sacred_flame.target.blue"))
        .atLocation(token, { offset: { y: 0 }, gridUnits: true })
        .scaleToObject(0.5)
        .playbackRate(2)
        .fadeOut(100)
        .zIndex(2)

        .effect()
        .file(closest("jb2a.token_border.circle.static.blue.012"))
        .attachTo(token)
        .opacity(0.75)
        .scaleToObject(2)
        .filter("ColorMatrix", { saturate: 0 })
        .fadeIn(500)
        .duration(1500)
        .belowTokens()
        .fadeOut(250)

        .effect()
        .file(closest("jb2a.particles.inward.blue.01.01"))
        .attachTo(token)
        .opacity(0.35)
        .scaleToObject(1.5)
        .filter("ColorMatrix", { saturate: 1 })
        .fadeIn(500)
        .duration(1500)
        .mask(token)
        .fadeOut(250)

        .effect()
        .file(closest("animated-spell-effects-cartoon.cantrips.mending.yellow"))
        .atLocation(token)
        .scaleToObject(3)
        .opacity(0.75)
        .filter("ColorMatrix", { saturate: -1, brightness: 2, hue: -185 })
        .zIndex(1)
        .waitUntilFinished(-1000)

        .wait(750)

        .canvasPan()
        .delay(250)
        .shake({ duration: 250, strength: 2, rotation: false })

        .effect()
        .file(closest("jb2a.swirling_leaves.outburst.01.pink"))
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: 1, hue: -105 })
        .scaleToObject(0.75)
        .fadeOut(2000)
        .atLocation(token)
        .zIndex(1)

        .animation()
        .on(token)
        .opacity(0)

        .effect()
        .copySprite(token)
        .atLocation(token)
        .mirrorX(token.document.mirrorX)
        .animateProperty("spriteContainer", "position.x", { from: 0, to: middle.x, duration: 100, ease: "easeOutExpo" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: middle.y, duration: 100, ease: "easeOutExpo" })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: -middle.x, duration: 350, ease: "easeInOutQuad", fromEnd: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -middle.y, duration: 350, ease: "easeInOutQuad", fromEnd: true })
        .scaleToObject(1, { considerTokenScale: true })
        .duration(600)

        .animation()
        .on(token)
        .opacity(1)
        .delay(600)

        .effect()
        .file(closest("jb2a.impact.010.blue"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(2.5)
        .atLocation(target)
        .randomRotation()

        .effect()
        .file(closest("jb2a.impact.ground_crack.blue.02"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(2.5)
        .atLocation(target)
        .randomRotation()
        .belowTokens()

        .effect()
        .delay(200)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(1.75)
        .opacity(0.5)
        .atLocation(target)
        .belowTokens()

        .effect()
        .delay(200)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(2.5)
        .opacity(0.5)
        .atLocation(target)
        .belowTokens()

        .effect()
        .copySprite(target)
        .atLocation(target)
        .fadeIn(200)
        .fadeOut(500)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .scaleToObject(target.document.texture.scaleX)
        .duration(1500)
        .opacity(0.25)

        .effect()
        .name(`StunningStrike - DizzyStars - ${id} - ${target.uuid}`) // Unique name for stopping
        .delay(1000)
        .file(closest("jb2a.dizzy_stars.200px.yellow"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(1)
        .opacity(1)
        .attachTo(target, { offset: { y: -0.5 * target.document.width }, gridUnits: true })
        .persist()
    ;

    return sequence;
}

/**
 * Plays the Stunning Strike effect.
 *
 * @param {Token} token The token performing the strike.
 * @param {Token} target The token being stunned.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playStunningStrike(token, target, config = {}) {
    const sequence = await createStunningStrike(token, target, config);
    if (sequence) { return sequence.play(); }
}

/**
 * Stops the persistent "dizzy stars" effect from Stunning Strike.
 *
 * @param {Token} target The token affected by the persistent effect.
 * @param {object} config Configuration options.
 */
function stopStunningStrike(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `StunningStrike - DizzyStars - ${id} - ${target.uuid}` });
}

export const stunningStrike = {
    create: createStunningStrike,
    play: playStunningStrike,
    stop: stopStunningStrike,
};
