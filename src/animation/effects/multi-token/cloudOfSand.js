// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    persist: false,
    color: "yellow",
};

/**
 * Helper function to create a single cloud effect.
 * @param {object} position - The position to attach the effect to.
 * @param {string} file - The image file path for the cloud effect.
 * @param {object} config - Configuration for the cloud effect.
 * @param {number} config.size - Size of the effect.
 * @param {number} config.opacity - Opacity of the effect.
 * @param {number} config.rotate - Initial rotation of the effect.
 * @param {number} config.zIndex - Z-index of the effect.
 * @param {number} config.rotationDuration - Duration for the loop property rotation.
 * @param {boolean} persist - Whether the effect should persist.
 * @returns {Effect} A configured Sequencer Effect.
 */
function _createCloudEffect(position, file, { size, opacity, rotate, zIndex, rotationDuration }, persist) {
    return new Sequence()
        .effect()
        .name("Cloud of Sand")
        .file(closest(file))
        .atLocation(position)
        .size(size, {gridUnits:true})
        .scaleIn(0, 1000, {ease: "easeInCubic"})
        .rotateIn(-900, 1000, {ease: "easeOutCubic"})
        .fadeIn(500)
        .filter("ColorMatrix", { hue: -25 })
        .belowTokens()
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: rotationDuration})
        .persist(persist)
        .opacity(opacity)
        .rotate(rotate)
        .zIndex(zIndex)
        .rotateOut(360, 500, {ease: "easeOutCubic", delay: 250})
        .scaleOut(1, 500, {ease: "easeOutCubic", delay: 250})
        .fadeOut(750)
}

/**
 * Creates the animation sequence for Cloud of Sand.
 * @param {object} token - The casting token.
 * @param {object[]} targets - The array of target tokens.
 * @param {object} config - Configuration options.
 * @param {boolean} config.persist - Whether the effect should persist.
 * @returns {Sequence} The animation sequence.
 */
async function create(position, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { persist, color } = mConfig;

    if (!position) {
        let configWarpgate = {
            size:9,
            icon: 'icons/magic/air/air-wave-gust-smoke-yellow.webp',
            label: 'Cloud of Sand',
            tag: 'entangle',
            t: 'circle',
            drawIcon: true,
            drawOutline: true,
            interval: 2,
            rememberControlled: true,
        }
        //This will make the "Crosshair" appear.
        position = await Sequencer.Crosshair.show(configWarpgate);
    }

    let sequence = new Sequence()
        .effect()
            .name("Cloud of Sand")
            .file(closest("jb2a.extras.tmfx.outflow.circle.04"))
            //.attachTo(token)
            //.scaleToObject(1.75)
            .atLocation(position)
            .size(10, {gridUnits:true})
            .fadeIn(1000, {ease: "easeInCubic"})
            .fadeOut(1500)
            .filter("ColorMatrix", { saturate:-0.25, brightness: 1.15, hue: -30 })
            .tint("#faff1e")
            .belowTokens()
            .opacity(0.45)
            .duration(7500)

        .effect()
            .name("Cloud of Sand")
            .file(closest(`jb2a.sleep.cloud.01.${color}`))
            //.attachTo(token)
            //.scaleToObject(1.75)
            .atLocation(position)
            .size(10, {gridUnits:true})
            .fadeIn(1000, {ease: "easeInCubic"})
            .filter("ColorMatrix", { hue: -25 })
            .belowTokens()
            .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 1500})
            .fadeOut(1500)
            .duration(7500)

        .wait(500)

        .effect()
            .delay(750)
            .file(closest("animated-spell-effects-cartoon.air.portal"))
            .atLocation(position,{offset: {y:-0.25}, gridUnits:true})
            .size(10, {gridUnits:true})
            .scaleIn(0, 250, {ease: "easeInCirc"})
            //.rotateIn(-360, 1000, {ease: "easeOutCubic"})
            .fadeOut(500)
            .filter("ColorMatrix", { saturate:-0.5, brightness: 1.35, hue: -40 })
            .opacity(0.45)
            .duration(1000)
            .mirrorX()
            .tint("#faff1e")
            .belowTokens()

        .effect()
            .name("Cloud of Sand")
            .file(closest("jb2a.extras.tmfx.outflow.circle.04"))
            .atLocation(position)
            .size(12, {gridUnits:true})
            .fadeIn(1000, {ease: "easeInCubic"})
            .fadeIn(500)
            .filter("ColorMatrix", { saturate:-0.25, brightness: 1.15, hue: -30 })
            .tint("#faff1e")
            .belowTokens()
            .opacity(0.45)
            .persist(config.persist)

    // Simplified cloud effects
    sequence.addSequence(_createCloudEffect(position, `jb2a.sleep.cloud.01.${color}`, { size: 12, opacity: 1, rotate: 0, zIndex: 1, rotationDuration: 1500 }, config.persist));
    sequence.addSequence(_createCloudEffect(position, `jb2a.sleep.cloud.01.${color}`, { size: 10, opacity: 0.65, rotate: 90, zIndex: 2, rotationDuration: 1400 }, config.persist));
    sequence.addSequence(_createCloudEffect(position, `jb2a.sleep.cloud.01.${color}`, { size: 6, opacity: 0.4, rotate: 180, zIndex: 3, rotationDuration: 1300 }, config.persist));
    sequence.addSequence(_createCloudEffect(position, `jb2a.sleep.cloud.02.${color}`, { size: 2, opacity: 0.25, rotate: 180, zIndex: 4, rotationDuration: 1200 }, config.persist));
    sequence.addSequence(_createCloudEffect(position, `jb2a.sleep.cloud.02.${color}`, { size: 1, opacity: 0.15, rotate: 180, zIndex: 5, rotationDuration: 1100 }, config.persist));

    return sequence;
}

/**
 * Plays the Cloud of Sand animation.
 * @param {object} token - The casting token.
 * @param {object[]} targets - The array of target tokens.
 * @param {object} config - Configuration options.
 * @param {boolean} config.persist - Whether the effect should persist.
 */
async function play(position, config = {}) {
    const sequence = await create(position, config);
    if (sequence) return sequence.play();
}

/**
 * Stops the Cloud of Sand animation and cleans up effects.
 * @param {string} effectName - The name of the effect to stop (e.g., "Cloud of Sand").
 */
function stop(effectName = 'Cloud of Sand') {
    Sequencer.EffectManager.endEffects({ name: effectName });
}

export const cloudOfSand = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};