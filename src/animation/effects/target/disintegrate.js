/* **
    Last Updated: 4/20/2023
    Author: EskieMoh#2969
    Updated: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';
import { beam as beamEffect } from './beam/beam.js';

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
    }
};

/**
 * Helper function to apply a series of dissolving mask effects to a sequence.
 * @param {Sequence} sequence The sequence to add the effects to.
 * @param {object} options The options for the dissolve effect.
 * @param {string} options.id The unique ID for the effect.
 * @param {Token} options.target The target token.
 * @param {number} options.centerX The center X coordinate.
 * @param {number} options.centerY The center Y coordinate.
 * @param {object} options.offset The offset for the mask.
 * @param {Array<object>} options.steps The steps of the animation, containing radius, duration, and fill.
 */
function _dissolve({ id, target, offset, steps, shape }) {
    let seq = new Sequence()
        // Make the original target token invisible
        .animation()
        .on(target)
        .opacity(0);

    for (const step of steps) {
        const stepShape = { ...shape };
        stepShape.radius = step.radius;
        stepShape.offset = offset;
        if (step.fill) {
            stepShape.fillColor = shape.fillColor;
        }

        seq = seq.effect()
            .name(id)
            .atLocation({ x: target.center.x, y: target.center.y })
            .copySprite(target)
            .scaleToObject(1, { considerTokenScale: true })
            .shape("circle", stepShape)
            .duration(step.duration)
            .fadeOut(1000);
    }

    return seq;
}

function _reform({ id, target, allSteps, shape }) {
    const formingSequence = new Sequence();

    for (const step of allSteps) {
        const stepShape = { ...shape };
        stepShape.radius = step.radius;
        stepShape.offset = step.offset;
        if (step.fill) {
            stepShape.fillColor = shape.fillColor;
        }

        formingSequence.effect()
            .name(id)
            .atLocation({ x: target.center.x, y: target.center.y })
            .copySprite(target)
            .scaleToObject(1, { considerTokenScale: true })
            .shape("circle", stepShape)
            .fadeIn(300)
            .delay(step.duration - 200 > 0 ? step.duration - 200 : step.duration)
            .persist();
    }
    return formingSequence;
}

function getDissolveShape() {
    return {
        lineSize: 25,
        lineColor: "#FF0000",
        gridUnits: true,
        name: "test",
        isMask: true,
        fillColor: "#FF0000",
    };
}

function getDissolveConfig() {
    return [
        {
            offset: { x: canvas.grid.size * 0.1, y: -canvas.grid.size * 0.4 },
            steps: [
                { radius: 0.15, duration: 1500, fill: true }, { radius: 0.2, duration: 1800 },
                { radius: 0.25, duration: 2000 }, { radius: 0.3, duration: 2200 },
                { radius: 0.35, duration: 2400 }, { radius: 0.4, duration: 2600 },
                { radius: 0.45, duration: 2800 },
            ]
        },
        {
            offset: { x: -canvas.grid.size * 0.4, y: canvas.grid.size * 0.3 },
            steps: [
                { radius: 0.15, duration: 500, fill: true }, { radius: 0.2, duration: 700 },
                { radius: 0.25, duration: 900 }, { radius: 0.3, duration: 1100 },
                { radius: 0.35, duration: 1300 }, { radius: 0.4, duration: 1500 },
                { radius: 0.45, duration: 1700 }, { radius: 0.5, duration: 1900 },
                { radius: 0.55, duration: 2100 },
            ]
        },
        {
            offset: { x: canvas.grid.size * 0.5, y: canvas.grid.size * 0.4 },
            steps: [
                { radius: 0.15, duration: 1500, fill: true }, { radius: 0.25, duration: 1900 },
                { radius: 0.3, duration: 2100 }, { radius: 0.35, duration: 2300 },
                { radius: 0.4, duration: 2500 }, { radius: 0.45, duration: 2700 },
            ]
        }
    ];
}

function dissolveCreate(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    let seq = new Sequence();
    const dissolveSections = getDissolveConfig();
    const shape = getDissolveShape();
    for (const section of dissolveSections) {
        seq = seq.addSequence(_dissolve({ id, target, offset: section.offset, steps: section.steps, shape }));
    }
    return seq;
}

async function dissolvePlay(target, config = {}) {
    let dissolve = dissolveCreate(target, config);
    let hide = new Sequence().animation().on(target).show(false);
    if (dissolve && hide) {
        await dissolve.play();
        return hide.play();
    }
}

/**
 * This function creates the core disintegration animation for a target token.
 * It works by first making the token invisible, then layering several visual effects.
 * The "dissolving" effect is achieved by creating multiple copies of the token's image
 * and applying a series of expanding circular masks to them, which makes it look like
 * the token is being eaten away from different angles.
 *
 * @param {Token} target The token to apply the death effect to.
 * @param {object} config Configuration object for the effect.
 * @param {string} config.id The unique ID for the effects sequence.
 * @returns {Sequence} A Sequencer sequence object representing the death animation.
 */
function death(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
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

        // Dissolve and wait
        .addSequence(dissolveCreate(target, config))
        .wait(1500);

    return seq;
}

function beam(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
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
async function create(token, target, config = {}) {
    // Merge user config with default config
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    let disintegrateEffect = beam(token, target, mConfig);
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
async function play(token, target, config = {}) {
    let seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

/**
 * Stops the disintegrate effect on a given token.
 * @param {Token} token The token on which to stop the effect.
 * @param {object} [config={}] Configuration for stopping the effect.
 * @param {string} [config.id='disintegrate'] The id of the effect to stop.
 * @returns {Promise<void>}
 */
async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

/**
 * Creates a "reform" effect, which is the reverse of the disintegrate effect.
 * @param {Token} target The token to apply the effect to.
 * @param {object} config Configuration for the effect.
 * @returns {Sequence} A Sequencer sequence object.
 */
function reformCreate(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, duration } = mConfig;
    const reformSequence = new Sequence();
    const dissolveSections = getDissolveConfig();
    const shape = getDissolveShape();

    // Set target to be invisible at the start
    reformSequence.animation().on(target).opacity(0);

    const allSteps = [];
    dissolveSections.forEach(section => {
        section.steps.forEach(step => {
            allSteps.push({ ...step, offset: section.offset });
        });
    });

    allSteps.sort((a, b) => a.duration - b.duration);
    const maxDuration = allSteps.length > 0 ? Math.max(...allSteps.map(s => s.duration)) : 0;

    const formingSequence = _reform({ id: id, target, allSteps, shape: shape });

    reformSequence
        .addSequence(formingSequence)
        .wait(maxDuration + duration)
        .animation()
        .on(target)
        .opacity(1.0)
        .wait(100)
        .thenDo(() => {
            Sequencer.EffectManager.endEffects({ name: id, fadeOut: duration });
        });

    return reformSequence;
}

async function reformPlay(target, config = {}) {
    let reform = new Sequence();
    reform = reform
        .animation().on(target).show(true)
        .addSequence(reformCreate(target, config));
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
