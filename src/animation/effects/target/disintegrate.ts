/* **
    Last Updated: 4/20/2023
    Author: EskieMoh#2969
    Updated: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';
import { beam as beamEffect } from './beam/beam.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'disintegrate',
    targetDeath: true,
    duration: 500, // For reformCreate
    effect: { // For death and beam
        smoke: { // For death
            img: "eskie.smoke.05.tan",
            delay: 1000,
            duration: 10000,
            scale: 0.5,
        },
        spirit: { // For death
            img: "jb2a.spirit_guardians.green.particles",
            duration: 7500,
            scale: 0.35,
        },
        beam: [ // For beam
            { img: `jb2a.magic_signs.circle.02.transmutation.loop.dark_green` },
            { img: `jb2a.particles.outward.white.01.02` },
            { img: `jb2a.extras.tmfx.border.circle.inpulse.01.fast` },
            { img: `jb2a.disintegrate.green` },
        ],
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function dissolveCreate(target: Token, config: any = {}) {
    return new Sequence()
        .motion(target)
        .scaleTo(0)
        .fadeTo(0);
}

async function dissolvePlay(target: Token, config: any = {}) {
    let dissolve = dissolveCreate(target, config);
    if (dissolve) {
        return dissolve.play();
    }
}

/**
 * This function creates the core disintegration animation for a target token.
 * It works by shrinking and fading out the target token using native motion, while layering visual ash and spirit effects.
 *
 * @param {Token} target The token to apply the death effect to.
 * @param {object} config Configuration object for the effect.
 * @param {string} config.id The unique ID for the effects sequence.
 * @returns {Sequence} A Sequencer sequence object representing the death animation.
 */
function death(target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, effect: { smoke: smokeEffect, spirit: spiritEffect } } = mConfig;

    let seq = new Sequence()
        // Add a smoke puff effect
        .effect()
        .name(id)
        .file(closest(smokeEffect.img))
        .atLocation(target, { offset: { y: -0.25 }, gridUnits: true })
        .fadeIn(1000)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .delay(smokeEffect.delay)
        .duration(smokeEffect.duration)
        .fadeOut(500)
        .scaleToObject(smokeEffect.scale)
        .filter("ColorMatrix", { brightness: 0 })
        .zIndex(0.1)
        .belowTokens()

        // Add swirling spirit particle effects
        .effect()
        .name(id)
        .file(closest(spiritEffect.img))
        .atLocation(target)
        .duration(spiritEffect.duration)
        .fadeOut(3000)
        .scaleToObject(spiritEffect.scale)
        .filter("ColorMatrix", { hue: -25 })
        .belowTokens()

        // Dissolve target via motion shrink and fade
        .addSequence(dissolveCreate(target, config))
        .wait(1500);

    return seq;
}

function beam(token: Token, target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, effect: { beam: beamEffects } } = mConfig;
    return beamEffect.create(token, target, { id, effects: beamEffects });
}

/**
 * Creates a disintegrate effect sequence, combining a beam and a death animation.
 *
 * @param {Token} token The token initiating the effect.
 * @param {Token} target The token to be disintegrated.
 * @param {object} [config={}] Configuration for the effect.
 * @param {string} [config.id='disintegrate'] The id of the effect.
 * @param {boolean} [config.targetDeath=true] Whether the target should be marked for deletion in the animation.
 * 
 * @returns {Promise<Sequence>} A promise that resolves with the complete effect sequence.
 */
async function create(token: Token, target: Token, config: any = {}) {
    // Merge user config with default config
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);

    let disintegrateEffect = beam(token, target, mConfig);
    applySound(disintegrateEffect, mConfig.sound);
    if (mConfig.targetDeath) // Chain the death animation if the target is dead
        disintegrateEffect = disintegrateEffect.addSequence(death(target, mConfig));

    return disintegrateEffect;
}

/**
 * Creates and plays the full disintegrate effect.
 * @param {Token} token The token initiating the effect.
 * @param {Token} target The token to be disintegrated.
 * @param {object} [config={}] Configuration for the effect.
 * @returns {Promise<void>} A promise that resolves when the effect is finished.
 */
async function play(token: Token, target: Token, config: any = {}) {
    let seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

/**
 * Stops the disintegrate effect on a given token and restores target motion scale and fade.
 * @param {Token} token The token on which to stop the effect.
 * @param {object} [config={}] Configuration for stopping the effect.
 * @param {string} [config.id='disintegrate'] The id of the effect to stop.
 * @returns {Promise<void>}
 */
async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    return new Sequence().motion(token).scaleTo(1).fadeTo(1).play();
}

/**
 * Creates a "reform" effect, which is the reverse of the disintegrate effect.
 * @param {Token} target The token to apply the effect to.
 * @param {object} config Configuration for the effect.
 * @returns {Sequence} A Sequencer sequence object.
 */
function reformCreate(target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, duration } = mConfig;

    const reformSequence = new Sequence()
        .motion(target)
        .scaleTo(1)
        .fadeTo(1)
        .wait(duration)
        .thenDo(() => {
            Sequencer.EffectManager.endEffects({ name: id, fadeOut: duration });
        });

    return reformSequence;
}

async function reformPlay(target: Token, config: any = {}) {
    let reform = reformCreate(target, config);
    if (reform) { return reform.play(); }
}

export const disintegrate = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
    // Subfunctions
    beam,
    death,
    dissolve: {
        create: dissolveCreate,
        play: dissolvePlay,
        default_config: DEFAULT_CONFIG,
    },
    reform: {
        create: reformCreate,
        play: reformPlay,
        default_config: DEFAULT_CONFIG,
    },
};
