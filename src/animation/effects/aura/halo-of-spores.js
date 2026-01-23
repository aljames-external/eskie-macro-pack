// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations, CONCENTRATING } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'HaloOfSpores',
    opacity: 0.45,
};

function createAura(token, config = {}, options = {}) {
    const { id, opacity } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} - ${token.id}`;

    const sequence = new Sequence();

    sequence
        .effect()
            .name(label)
            .file(closest("jb2a.spirit_guardians.green.particles"))
            .attachTo(token)
            .filter("ColorMatrix", { hue: 60 })
            .size(3.5 + token.document.width, { gridUnits: true })
            .belowTokens()
            .scaleIn(0, 500, { ease: "easeOutCubic" })
            .opacity(opacity)
            .fadeIn(500)
            .fadeOut(500)
            .persist()

        .effect()
            .name(label)
            .file(closest("jb2a.sleep.cloud.01.green"))
            .attachTo(token)
            .size(5.5 + token.document.width, { gridUnits: true })
            .belowTokens()
            .scaleIn(0, 500, { ease: "easeOutCubic" })
            .filter("ColorMatrix", { hue: 60 })
            .opacity(opacity)
            .fadeIn(500)
            .fadeOut(500)
            .persist();

    return sequence;
}

async function playAura(token, config = {}, options = {}) {
    if (options?.type == "aefx") return;
    const sequence = createAura(token, config, options);
    if (sequence) return sequence.play();
}

function createDamageEffect(token, target, config = {}) {
    const sequence = new Sequence();
    sequence
        .effect()
        .file(closest("jb2a.fireflies.many.02.red"))
        .atLocation(target, { randomOffset: 0 })
        .scaleToObject(1.5)
        .fadeIn(500)
        .randomRotation()
        .scaleOut(0, 1000, { ease: "easeInBack" })
        .duration(1500)
        .opacity(0.8)
        .repeats(2, 100, 100)
        .filter("ColorMatrix", { hue: 60 })

        .effect()
        .delay(250)
        .file(closest("jb2a.cast_generic.ice.01.blue"))
        .atLocation(target)
        .scaleToObject(1)
        .playbackRate(2)
        .filter("ColorMatrix", { hue: -60 })
        .waitUntilFinished(0)

        .effect()
        .file(closest("animated-spell-effects-cartoon.energy.pulse.green"))
        .atLocation(target)
        .scaleToObject(1.25)
        .playbackRate(1)
        .filter("ColorMatrix", { hue: 60 })

        .effect()
        .file(closest("jb2a.impact.004.green"))
        .atLocation(target)
        .scaleToObject(2)
        .playbackRate(1)
        .belowTokens()
        .filter("ColorMatrix", { hue: 60 })

        .effect()
        .copySprite(target)
        .attachTo(target)
        .fadeIn(200)
        .fadeOut(500)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .scaleToObject(1, { considerTokenScale: true })
        .duration(1500)
        .opacity(0.25)

        .effect()
        .file(closest("jb2a.particles.outward.greenyellow.01.03"))
        .scaleToObject(2)
        .scaleIn(0.15, 750, { ease: "easeOutQuint" })
        .fadeOut(1500)
        .atLocation(target)
        .duration(1500)
        .randomRotation()
        .filter("ColorMatrix", { saturate: 1, hue: 60 })
        .zIndex(5);

    return sequence;
}

/**
 * Creates the Halo of Spores animation sequence.
 * @param {Token} token - The casting token.
 * @param {Token} target - The target token.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
function create(token, target, config = {}) {
    const sequence = new Sequence();
    sequence.addSequence(createAura(token, config));
    sequence.addSequence(createDamageEffect(token, target, config))
    return sequence;
}

/**
 * Plays the Halo of Spores animation.
 * @param {Token} token - The casting token.
 * @param {Token} target - The target token.
 * @param {object} options - Options for playing the animation, including config.
 */
async function play(token, target, config = {}) {
    const sequence = create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} - ${token.id}`;
    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const haloOfSpores = {
    create,
    play,
    aura: {
        create: createAura,
        play: playAura,
        stop,
    }
};

autoanimations.register("Halo of Spores", "aura", "eskie.effect.haloOfSpores.aura", DEFAULT_CONFIG);
autoanimations.register(CONCENTRATING("Halo of Spores"), "effect", "eskie.effect.haloOfSpores.aura", DEFAULT_CONFIG);