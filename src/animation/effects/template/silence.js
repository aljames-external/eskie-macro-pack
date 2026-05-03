/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { templates } from '../../../lib/templates.js';
import { autoanimations, CONCENTRATING } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'silence',
    size: 9,
};

/**
 * Creates a Sequencer effect for a Silence spell at a specific location.
 *
 * @param {Token} token The token casting the spell (used for effect naming).
 * @param {object} position The target position (x, y coordinates) for the effect.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createSilence(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, size, template } = mConfig;

    const cfg = { 
        radius: 20,
        max: 120,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: 'Silence'
    };
    let [position, _] = await templates.getPosition(template, cfg);
    if (!position) { return; }

    const sequence = new Sequence();
    sequence
        .effect()
        .file(closest("jb2a.moonbeam.01.outro.yellow"))
        .atLocation(position)
        .size(0.75, { gridUnits: true })
        .startTime(500)
        .playbackRate(2)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: -1 })

        .effect()
        .delay(750)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.normal"))
        .atLocation(position)
        .size(5, { gridUnits: true })
        .opacity(0.5)
        .filter("ColorMatrix", { brightness: 0 })
        .belowTokens()

        .effect()
        .delay(750)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.normal"))
        .atLocation(position)
        .size(size, { gridUnits: true })
        .opacity(0.75)
        .filter("ColorMatrix", { brightness: 0 })
        .belowTokens()

        .effect()
        .file(closest("jb2a.cast_generic.earth.01.browngreen.1"))
        .atLocation(position)
        .size(2, { gridUnits: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: -1 })
        .belowTokens()
        .waitUntilFinished(-1000)

        .effect()
        .name(`Silence ${token.document.name} ${id}`) // Unique name for stopping
        .file(closest("jb2a.markers.bubble.complete.blue"))
        .atLocation(position)
        .size(size, { gridUnits: true })
        .opacity(0.2)
        .fadeIn(500)
        .fadeOut(2000)
        .scaleIn(0.1, 1000, { ease: "easeOutBack" })
        .zIndex(2)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .belowTokens()
        .persist()

        .effect()
        .name(`Silence ${token.document.name} ${id}`) // Unique name for stopping
        .file(closest("jb2a.wall_of_force.sphere.grey"))
        .atLocation(position)
        .size(size, { gridUnits: true })
        .opacity(0.2)
        .fadeIn(500)
        .fadeOut(2000, { delay: 5000 })
        .scaleIn(0.1, 1000, { ease: "easeOutBack" })
        .zIndex(2)
        .playbackRate(0.8)
        .filter("Glow", { color: 0x000000, distance: 2.5, innerStrength: 3, outerStrength: 0 })
        .filter("ColorMatrix", { saturate: -1 })
        .persist()

        .effect()
        .name(`Silence ${token.document.name} ${id}`) // Unique name for stopping
        .file(closest("jb2a.extras.tmfx.runes.circle.simple.illusion"))
        .atLocation(position)
        .size(2, { gridUnits: true })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .fadeOut(2000)
        .playbackRate(0.8)
        .opacity(0.35)
        .belowTokens()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .persist()
    ;

    return sequence;
}

/**
 * Plays the Silence effect at a chosen location.
 * This function handles the crosshairs user interaction.
 *
 * @param {Token} token The token casting the spell.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function playSilence(token, config = {}, options = {}) {
    if (options?.type == "aefx") return;
    const sequence = await createSilence(token, config);
    if (sequence) { return sequence.play(); }
}

/**
 * Stops the persistent Silence effect.
 *
 * @param {Token} token The token that cast the spell (used to identify the effect).
 * @param {object} options Options for stopping effects.
 */
function stopSilence(token, { id = DEFAULT_CONFIG.id } = {}) {
    Sequencer.EffectManager.endEffects({ name: `Silence ${token.document.name} ${id}` });
}

export const silence = {
    create: createSilence,
    play: playSilence,
    stop: stopSilence,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Silence", "template", "eskie.effect.silence", DEFAULT_CONFIG);
autoanimations.register(CONCENTRATING("Silence"), "effect", "eskie.effect.silence", DEFAULT_CONFIG);
