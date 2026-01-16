/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { templates } from '../../../lib/templates.js';
import { autoanimations, CONCENTRATING } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'spikeGrowth',
    size: 8, // Default size for crosshairs and initial effect
    tint: "#033b0cff", // Default tint for spikes
};

/**
 * Creates the initial Sequencer effect for Spike Growth spell.
 * This handles the casting animation at the central position.
 *
 * @param {object} position The central position (x, y coordinates) for the effect.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object for the initial cast.
 */
async function createInitialSpikeGrowth(position, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { size } = mConfig;

    const sequence = new Sequence();

    sequence
        .effect()
        .file(closest("jb2a.cast_generic.earth.01.browngreen.1"))
        .atLocation(position)
        .size(3, { gridUnits: true })
        .filter("ColorMatrix", { hue: -30, saturate: 0.25, brightness: 0.8 })

        .effect()
        .file(closest("jb2a.plant_growth.02.ring.4x4.pulse.greenred"))
        .atLocation(position)
        .size(size, { gridUnits: true })
        .belowTokens()
        .filter("ColorMatrix", { brightness: 0 })
        .playbackRate(1.5)
        .opacity(0.65)

        .effect()
        .file(closest("jb2a.plant_growth.02.ring.4x4.pulse.greenred"))
        .atLocation(position)
        .size(4, { gridUnits: true })
        .belowTokens()
        .filter("ColorMatrix", { brightness: 0 })
        .playbackRate(1.5)
        .opacity(0.65)
    ;

    return sequence;
}

/**
 * Creates an array of Sequencer effects for the persistent Spike Growth spikes.
 *
 * @param {Token} token The token casting the spell (used for effect naming).
 * @param {object} centralPosition The central position (x, y coordinates) where the spell is cast.
 * @param {object} config Configuration options for the animation.
 * @returns {Array<Sequence>} An array of Sequence objects for the persistent spikes.
 */
async function createPersistentSpikes(token, centralPosition, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, tint } = mConfig;

    const gridSize = canvas.grid.size;
    const locations = [
        //{ x: centralPosition.x, y: centralPosition.y },
        { x: centralPosition.x, y: centralPosition.y - gridSize * 2 },
        //{ x: centralPosition.x + gridSize * 2, y: centralPosition.y - gridSize * 2 },
        { x: centralPosition.x + gridSize * 2, y: centralPosition.y },
        //{ x: centralPosition.x + gridSize * 2, y: centralPosition.y + gridSize * 2 },
        { x: centralPosition.x, y: centralPosition.y + gridSize * 2 },
        //{ x: centralPosition.x - gridSize * 2, y: centralPosition.y + gridSize * 2 },
        { x: centralPosition.x - gridSize * 2, y: centralPosition.y },
        //{ x: centralPosition.x - gridSize * 2, y: centralPosition.y - gridSize * 2 },
    ];

    const persistentSpikeSequences = [];

    for (let i = 0; i < locations.length; i++) {
        const sequence = new Sequence();
        sequence
            .effect()
            .name(`Spike Growth ${token.document.name} ${id}`) // Unique name for stopping
            .delay(550)
            .file(closest("jb2a.plant_growth.02.round.4x4.loop.greenred"))
            .atLocation(locations[i])
            .belowTokens()
            .size(3.8, { gridUnits: true })
            .fadeIn(500)
            .persist()
            .fadeOut(500)
            .randomRotation()
            .opacity(0.85)
            .private()
            .zIndex(1)

            .effect()
            .name(`Spike Growth ${token.document.name} ${id}`) // Unique name for stopping
            .delay(30)
            .file(closest("jb2a.ice_spikes.radial.burst.grey"))
            .size(7.5, { gridUnits: true })
            .playbackRate(4)
            .atLocation(locations[i], { randomOffset: 0.25 })
            .filter("ColorMatrix", { brightness: 0 })
            .fadeIn(500, { delay: 600 })
            .scaleIn(0, 500, { ease: "easeOutBack", delay: 600 })
            .persist()
            .endTime(800)
            .belowTokens()
            .filter("Glow", { color: tint, distance: 1 })
            .loopOptions({ loops: 1 })
        ;
        persistentSpikeSequences.push(sequence);
    }
    return persistentSpikeSequences;
}


/**
 * Plays the Spike Growth effect.
 * This function handles the crosshairs user interaction and manages active effects.
 *
 * @param {Token} token The token casting the spell.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the effect is played or stopped.
 */
async function createSpikeGrowth(token, config = {}, options = {}) {
    if (options.type == "aefx") return;
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, size, template } = mConfig;

    const cfg = { 
        radius: 20,
        max: 150,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: 'Spike Growth'
    };
    let position = await templates.getPosition(template, cfg);
    if (!position) { return; }

    const initialSequence = await createInitialSpikeGrowth(position, config);
    const persistentSpikeSequences = await createPersistentSpikes(token, position, config);
    let seq = new Sequence().addSequence(initialSequence);
    for (const spike of persistentSpikeSequences) {
        if (spike) { seq.addSequence(spike); }
    }
    return seq;
}

async function playSpikeGrowth(token, config = {}, options = {}) {
    /*       Don't parse for active effects        *
     * We only care about removing when it expires */
    if (options.type == "aefx") return;
    let seq = await createSpikeGrowth(token, config);
    if (seq) { return seq.play(); }
}

/**
 * Stops the persistent Spike Growth effects.
 *
 * @param {Token} token The token that cast the spell (used to identify the effect).
 * @param {object} options Options for stopping effects.
 */
function stopSpikeGrowth(token, { id = DEFAULT_CONFIG.id } = {}) {
    Sequencer.EffectManager.endEffects({ name: `Spike Growth ${token.document.name} ${id}` });
}

export const spikeGrowth = {
    createInitial: createInitialSpikeGrowth, // Exposed for more granular control if needed
    createPersistent: createPersistentSpikes, // Exposed for more granular control if needed
    play: playSpikeGrowth,
    create: createSpikeGrowth,
    stop: stopSpikeGrowth,
};

autoanimations.register("Spike Growth", "template", "eskie.effect.spikeGrowth", DEFAULT_CONFIG);
autoanimations.register(CONCENTRATING("Spike Growth"), "effect", "eskie.effect.spikeGrowth", DEFAULT_CONFIG);