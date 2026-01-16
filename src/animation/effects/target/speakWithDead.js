// Original Author: EskieMoh#2969
// Updater: @bakanabaka
import { file } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";

const DEFAULT_CONFIG = { 
    id: "speakWithDead",
    sound: {
        enabled: false,
        file: "psfx.magic-signs.circle.v1.necromancy.complete",
        volume: 0.5,
    }
};

/**
 * Creates the animation sequence for Speak With Dead.
 * @param {object} target - The target token.
 * @param {object} config - Configuration options.
 * @param {string} config.id - A unique ID for the effect to manage persistence.
 * @returns {Sequence} The animation sequence.
 */
async function create(target, config) {
    if (!target) return new Sequence();

    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, sound } = mConfig;
    const uniqueId = `${id} ${target.id}`;

    let sequence = new Sequence();
    // Initiate sound at start
    if (config.sound.enabled) sequence.sound().name(uniqueId).volume(sound.volume).file(file(sound.file));

    // Animation effects
    sequence.addSequence(_addMagicCircleEffects(target, uniqueId));
    sequence.wait(500);
    // Simplified corner flame effects
    sequence.addSequence(_addCornerFlameEffects(target, uniqueId, 0.5, 0.5, 2)); // Bottom Right Flame
    sequence.addSequence(_addCornerFlameEffects(target, uniqueId, -0.5, 0.5, 2)); // Bottom Left Flame
    sequence.addSequence(_addCornerFlameEffects(target, uniqueId, -0.5, -0.5, 1)); // Top Left Flame
    sequence.addSequence(_addCornerFlameEffects(target, uniqueId, 0.5, -0.5, 1)); // Top Right Flame
    sequence.addSequence(_addTokenVisualEffects(target, uniqueId));

    return sequence;
}

/**
 * Helper function to add the magic circle effects to the sequence.
 * @param {Sequence} sequence - The main animation sequence.
 * @param {object} target - The target token.
 * @param {string} id - The unique ID for the effect to manage persistence.
 */
function _addMagicCircleEffects(target, id) {
    let sequence = new Sequence();
    sequence
        .effect()
        .name(id)
        .atLocation(target)
        .file(file(`jb2a.magic_signs.circle.02.necromancy.loop.blue`))
        .scaleToObject(1.25)
        .scaleIn(0, 600, {ease: "easeOutCubic"})
        .filter("ColorMatrix", {hue:-65})
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 60000})
        .belowTokens()
        .fadeOut(2000)
        .zIndex(0)
        .persist()

        .effect()
        .name(id)
        .atLocation(target)
        .file(file(`jb2a.magic_signs.circle.02.necromancy.loop.green`))
        .scaleToObject(1.25)
        .scaleIn(0, 600, {ease: "easeOutCubic"})
        .belowTokens(true)
        .filter("ColorMatrix", {saturate:-1, brightness:2})
        .filter("Blur", { blurX: 5, blurY: 5 })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 60000})
        .zIndex(1)
        .duration(1200)
        .fadeIn(200, {ease: "easeOutCirc", delay: 500})
        .fadeOut(300, {ease: "linear"});
    return sequence;
}

/**
 * Helper function to add various token-related visual effects to the sequence.
 * @param {Sequence} sequence - The main animation sequence.
 * @param {object} target - The target token.
 * @param {string} id - The unique ID for the effect to manage persistence.
 */
function _addTokenVisualEffects(target, id) {
    let sequence = new Sequence();
    sequence
        // Token effect
        .effect()
        .name(id)
        .delay(1000)
        .file(file("animated-spell-effects-cartoon.magic.mind sliver"))
        .atLocation(target, {offset:{y:-0.75*target.document.width}, gridUnits:true})
        .scaleToObject(2)
        .rotate(-90)
        .filter("ColorMatrix", {hue:-65})
        .fadeIn(250)
        .filter("Blur", { blurX: 1, blurY: 50 })
        .zIndex(2)

        .effect()
        .name(id)
        .delay(100)
        .file(file("jb2a.particles.outward.blue.01.03"))
        .atLocation(target)
        .scaleToObject(1.1)
        .filter("ColorMatrix", {saturate:-1, brightness:2})
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.75, duration: 500, ease: "easeOutCubic", gridUnits:true})
        .animateProperty("sprite", "width", { from: 1, to: 0.5, duration: 100,  ease: "easeOutCubic", gridUnits: true})
        .animateProperty("sprite", "height", { from: 1, to: 1.5, duration: 500,  ease: "easeOutCubic", gridUnits: true})
        .fadeOut(500)
        .duration(500)
        .zIndex(2)

        .effect()
        .name(id)
        .delay(100)
        .file(file("jb2a.detect_magic.circle.blue"))
        .atLocation(target)
        .scaleToObject(1.25)
        .filter("ColorMatrix", {hue:-65})
        .fadeOut(3500)
        .zIndex(1.5)

        .animation()
        .delay(200)
        .on(target)
        .opacity(0)

        .effect()
        .name(id)
        .file(file("jb2a.token_border.circle.static.blue.012"))
        .attachTo(target, {bindAlpha: false, bindRotation: false})
        .scaleToObject(1.85, {considerTokenScale: true})
        .fadeIn(4000)
        .opacity(0.5)
        .filter("ColorMatrix", {hue:-65})
        .zIndex(1.1)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.2, duration: 2000, delay:2000, gridUnits: true, ease: "easeInSine"})
        .loopProperty("spriteContainer", "position.y", { from: 0, to: 0.05, duration: 2500, delay:4000, gridUnits: true, ease: "easeInOutQuad", pingPong: true})
        .persist()

        .effect()
        .name(id)
        .delay(100)
        .copySprite(target)
        .attachTo(target, {bindAlpha: false, bindRotation: false})
        .scaleToObject(0.95,{considerTokenScale:true})
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(1.1)
        .persist()

        .effect()
        .name(id)
        .delay(2000)
        .file(file("jb2a.spirit_guardians.blue.spirits"))
        .attachTo(target, {offset: {y:0}, gridUnits:true, bindAlpha: false, bindRotation: false})
        .scaleToObject(1.35,{considerTokenScale:true})
        .persist()
        .filter("ColorMatrix", {hue:-65})
        .opacity(0.65)
        .fadeIn(1000)
        .zIndex(0.1)

        .effect()
        .name(id)
        .delay(3000)
        .file(file("jb2a.magic_signs.rune.necromancy.complete.blue"))
        .attachTo(target, {offset: {y:-0.77*target.document.width}, gridUnits:true, bindAlpha: false, bindRotation: false})
        .scaleToObject(0.4,{considerTokenScale:true})
        .persist()
        .filter("ColorMatrix", {hue:-65})
        .opacity(1)
        .loopProperty("spriteContainer", "position.y", { from: 0, to: 0.05, duration: 2500, delay:1000, gridUnits: true, ease: "easeInOutQuad", pingPong: true})
        .zIndex(2)

        .effect()
        .name(id)
        .delay(3000)
        .file(file("jb2a.magic_signs.rune.necromancy.complete.blue"))
        .attachTo(target, {offset: {y:-0.55*target.document.width}, gridUnits:true, bindAlpha: false, bindRotation: false})
        .scaleToObject(0.4,{considerTokenScale:true})
        .persist()
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(2)

        .effect()
        .name(id)
        .delay(100)
        .copySprite(target)
        .attachTo(target, {bindAlpha: false, bindRotation: false})
        .scaleToObject(1,{considerTokenScale:true})
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.2, duration: 2000, delay:2000, gridUnits: true, ease: "easeInSine"})
        .animateProperty("sprite", "rotation", { from: 0, to: 15, duration: 1000, delay:2500, ease: "easeInOutBack"})
        .animateProperty("sprite", "rotation", { from: 0, to: -15, duration: 1000, delay:3000, ease: "easeInOutBack"})
        .loopProperty("spriteContainer", "position.y", { from: 0, to: 0.05, duration: 2500, delay:4000, gridUnits: true, ease: "easeInOutQuad", pingPong: true})
        .persist()
        .zIndex(0.2)
        .waitUntilFinished(-500); // Small wait to ensure persistence starts before play returns
        return sequence;
}

/**
 * Helper function to add a single corner flame effect to the sequence.
 * @param {Sequence} sequence - The main animation sequence.
 * @param {object} target - The target token.
 * @param {string} id - The unique ID for the effect to manage persistence.
 * @param {number} xOffset - The x-offset for the flame position.
 * @param {number} yOffset - The y-offset for the flame position.
 * @param {number} smokeZIndex - The zIndex for the smoke effect.
 */
function _addCornerFlameEffects(target, id, xOffset, yOffset, smokeZIndex) {
    let sequence = new Sequence();
    sequence
        .effect()
        .name(id)
        .atLocation(target, {offset: {x:xOffset, y:yOffset}, gridUnits:true})
        .file(file("jb2a.impact.008.blue"))
        .filter("ColorMatrix", {hue:-65})
        .scaleToObject(1)
        .zIndex(1)

        .effect()
        .name(id)
        .atLocation(target, {offset: {x:xOffset, y:yOffset}, gridUnits:true})
        .file(file("jb2a.flames.01.blue"))
        .belowTokens()
        .filter("ColorMatrix", {hue:-65})
        .scaleToObject(0.5)
        .scaleIn(0, 500, {ease: "easeOutCubic"})
        .randomizeMirrorX()
        .persist()

        .effect()
        .name(id)
        .delay(250)
        .atLocation(target, {offset: {x:xOffset, y:yOffset-0.35}, gridUnits:true})
        .file(file("animated-spell-effects-cartoon.smoke.97"))
        .scaleToObject(0.8)
        .opacity(0.4)
        .tint("#6ff087")
        .fadeIn(500)
        .zIndex(smokeZIndex)
        .scaleIn(0, 500, {ease: "easeOutCubic"})
        .randomizeMirrorX()
        .persist();
    return sequence;
}

/**
 * Plays the Speak With Dead animation.
 * @param {object} target - The target token.
 * @param {object} config - Configuration options.
 * @param {string} config.id - A unique ID for the effect to manage persistence.
 */
async function play(target, config) {
    config = settingsOverride(config);
    const sequence = await create(target, config);
    await preload(config);
    return sequence.play();
}

async function preload(config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { sound } = mConfig;

    let files = [
        img("jb2a.magic_signs.circle.02.necromancy.loop.blue"),
        img("jb2a.magic_signs.circle.02.necromancy.loop.green"),
        img("jb2a.particles.outward.blue.01.03"),
        img("jb2a.detect_magic.circle.blue"),
        img("animated-spell-effects-cartoon.magic.mind sliver"),
        img("jb2a.token_border.circle.static.blue.012"),
        img("jb2a.spirit_guardians.blue.spirits"),
        img("jb2a.magic_signs.rune.necromancy.complete.blue"),
        img("jb2a.impact.008.blue"),
        img("jb2a.flames.01.blue"),
        img("animated-spell-effects-cartoon.smoke.97")
    ]
    if (sound.enabled) files.push(snd(sound.file));

    return Sequencer.Preloader.preloadForClients(files, false);
}

/**
 * Stops the Speak With Dead animation and cleans up effects.
 * @param {object} target - The target token.
 * @param {object} config - Configuration options.
 * @param {string} config.id - A unique ID for the effect to manage persistence.
 */
async function stop(target, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let opacity = new Sequence().animation().on(target).opacity(1);
    return Promise.all([
        opacity.play(),
        Sequencer.EffectManager.endEffects({ name: `${mConfig.id} ${target.id}`, object: target }),
        Sequencer.EffectManager.endEffects({ name: `${mConfig.id} ${target.id}` })
    ]);
}

export const speakWithDead = {
    create,
    play,
    stop
};