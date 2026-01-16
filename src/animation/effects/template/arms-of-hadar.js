/* **
    Last Updated: 5/10/2023
    Author: EskieMoh#2969
    Updated: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'armsOfHadar',
    excludeSelf: true,
    targets: [],
};

/**
 * Creates an Arms of Hadar effect.
 *
 * @param {Token} token The token casting the spell.
 * @param {object} [config={}] Configuration for the effect.
 * @param {string} [config.id='armsOfHadar'] The id of the effect.
 * @param {number} [config.duration=0] The duration of the effect in milliseconds. A duration of 0 will make the effect persist.
 *
 * @returns {Promise<Sequence>} A promise that resolves with the Sequence object.
 */
async function create(token, config = {}) {
    const { id, targets } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    let sequence = new Sequence();
    sequence.thenDo(function() {
        targets.forEach(target => {
            new Sequence()
                .effect()
                .name(`${target.name} ${id}`)
                .copySprite(target)
                .atLocation(target)
                .scaleToObject(target.document.texture.scaleX)
                .fadeOut(100)
                .persist()
                .wait(150)

                .animation()
                .on(target)
                .opacity(0)
                .play();
        });
    });

    sequence
        .effect()
        .atLocation(token)
        .file(closest(`jb2a.ward.rune.dark_purple.01`))
        .scaleToObject(1.85)
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .belowTokens()
        .fadeOut(2000)
        .zIndex(0)

        .effect()
        .file("jb2a.arms_of_hadar.dark_purple")
        .atLocation(token)
        .randomRotation()
        .scaleIn(0, 1500, { ease: "easeOutCirc" })
        .fadeOut(500)
        .belowTokens()
        .scaleToObject(1.75)
        .zIndex(1)

        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .atLocation(token)
        .filter("ColorMatrix", { brightness: -1 })
        .randomRotation()
        .size(1.5, { gridUnits: true })
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .belowTokens()
        .zIndex(0.1)

        .effect()
        .file(closest("jb2a.particles.outward.purple.01.02"))
        .scaleIn(0, 1000, { ease: "easeOutQuint" })
        .delay(500)
        .fadeOut(1000)
        .atLocation(token)
        .duration(1000)
        .size(1.75, { gridUnits: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
        .filter("ColorMatrix", { brightness: -1 })
        .zIndex(1)

        .wait(1000)

        .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.inpulse.01.fast"))
        .atLocation(token)
        .scaleToObject(1.5)
        .filter("ColorMatrix", { brightness: -1 })
        .waitUntilFinished()

        .effect()
        .delay(150)
        .belowTokens()
        .file(closest("jb2a.impact.ground_crack.dark_red.02"))
        .atLocation(token)
        .size(3.5, { gridUnits: true })
        .filter("ColorMatrix", { hue: -100, brightness: -1 })

        .effect()
        .delay(150)
        .file(closest("jb2a.impact.004.dark_purple"))
        .atLocation(token)
        .scaleToObject(4)
        .filter("ColorMatrix", { hue: -100, brightness: -1 })
        .scaleIn(0, 500, { ease: "easeOutCirc" })

        .effect()
        .delay(150)
        .file(closest("jb2a.arms_of_hadar.dark_purple"))
        .atLocation(token)
        .randomRotation()
        .scaleIn(0, 750, { ease: "easeOutCirc" })
        .animateProperty("sprite", "width", { from: 5.5, to: 0, duration: 1500, delay: 1000, gridUnits: true, ease: "easeOutCirc" })
        .animateProperty("sprite", "height", { from: 5.5, to: 0, duration: 1500, delay: 1000, gridUnits: true, ease: "easeOutCirc" })
        .fadeOut(500)
        .size(6, { gridUnits: true })
        .belowTokens()
        .zIndex(1)
        .duration(2000)

        .thenDo(function() {
            targets.forEach(target => {
                let newX = target.center.x - (canvas.grid.size / 2.5 * Math.sign(token.center.x - target.center.x));
                let newY = target.center.y - (canvas.grid.size / 2.5 * Math.sign(token.center.y - target.center.y));

                new Sequence()
                    .effect()
                    .file(closest("animated-spell-effects-cartoon.energy.tentacles"))
                    .atLocation(target)
                    .moveTowards({ x: newX, y: newY }, { rotate: true, ease: "easeOutBack" })
                    .scaleToObject(1)
                    .filter("ColorMatrix", { hue: -100, brightness: 0 })
                    .opacity(0.75)

                    .thenDo(function() {
                        Sequencer.EffectManager.endEffects({ name: `${target.name} ${id}`, object: target });
                    })

                    .effect()
                    .copySprite(target)
                    .atLocation(target)
                    .scaleToObject(target.document.width * target.document.texture.scaleX)
                    .moveTowards({ x: newX, y: newY }, { rotate: false, ease: "easeOutBack" })
                    .duration(750)
                    .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 175, pingPong: true, gridUnits: true })
                    .opacity(0.15)
                    .zIndex(0.1)

                    .effect()
                    .copySprite(target)
                    .atLocation(target)
                    .scaleToObject(target.document.width * target.document.texture.scaleX)
                    .moveTowards({ x: newX, y: newY }, { rotate: false, ease: "easeOutBack" })
                    .duration(750)
                    .waitUntilFinished(-50)

                    .effect()
                    .copySprite(target)
                    .atLocation({ x: newX, y: newY })
                    .scaleToObject(target.document.texture.scaleX)
                    .moveTowards(target, { rotate: false, ease: "easeOutBack" })
                    .duration(1500)
                    .waitUntilFinished(-50)

                    .animation()
                    .on(target)
                    .opacity(1)
                    .play();
            });
        });

    return sequence;
}

/**
 * Plays the Arms of Hadar effect.
 *
 * @param {Token} token The token casting the spell.
 * @param {object} [config={}] Configuration for the effect.
 *
 * @returns {Promise<void>} A promise that resolves when the effect is finished.
 */
async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { await seq.play(); }
}

/**
 * Stops the Arms of Hadar effect.
 *
 * @param {Token} token The token casting the spell.
 * @param {object} [config={}] Configuration for the effect.
 * @param {string} [config.id='armsOfHadar'] The id of the effect.
 *
 * @returns {Promise<boolean>} A promise that resolves to true if effects were ended, false otherwise.
 */
async function stop(token, { id = 'armsOfHadar' } = {}) {
    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: id, object: token })
    ]);
}

export const armsOfHadar = {
    create,
    play,
    stop,
};

autoanimations.register("Arms of Hadar", "template", "eskie.effect.armsOfHadar", DEFAULT_CONFIG);