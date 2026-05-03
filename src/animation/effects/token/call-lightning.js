// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';

const AVAILABLE_SIZES = [10, 20, 30, 60];
const DEFAULT_CONFIG = {
    radius: 7.5,
};

/**
 * Creates the Call Lightning sequence effects.
 * @param {object} position - The {x, y} coordinates where the lightning strike will occur.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(position, config = {}) {
    config = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const pickEffectSize = (r) => AVAILABLE_SIZES.reduce(
        (acc, size) => (size <= r ? size : acc),
        AVAILABLE_SIZES[0]
    );
    const effectSize = pickEffectSize(config.radius);

    const sequence = new Sequence();

    sequence.effect()
        .file(closest("jb2a.lightning_strike.blue"))
        .atLocation(position)
        .scale(2.25)
        .opacity(1)
        .aboveLighting()
        .filter("ColorMatrix", { hue: -5 })
        .zIndex(100);

    sequence.canvasPan()
        .delay(250)
        .shake({ duration: 1000, strength: 2, rotation: false, fadeOut: 500 });

    sequence.effect()
        .delay(250)
        .file(closest("jb2a.impact.ground_crack.blue.01")) // Use closest() for paths
        .atLocation(position)
        .belowTokens()
        .randomRotation()
        .size(4, { gridUnits: true })
        .filter("ColorMatrix", { hue: 40 });

    return sequence;
}

/**
 * Plays the Call Lightning animation, including crosshair placement.
 * @param {Token} token - The casting token.
 * @param {object} options - Options for playing the animation, including config.
 */
async function play(token, position, config = {}) {
    if (!position) {
        const crosshairConfig = {
            size: token.document.width / canvas.grid.size,
            icon: 'icons/magic/air/wind-stream-blue-gray.webp',
            label: 'Dash',
            tag: 'dashing',
            drawIcon: true,
            drawOutline: true,
            interval: token.document.width % 2 === 0 ? 1 : -1,
        };
        position = await Sequencer.Crosshair.show(crosshairConfig);
        if (position.cancelled) { return; }
    }

    const sequence = await create(position, config);
    if (sequence) sequence.play();
}

export const callLightning = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
    // No stop function needed as this is not a persistent effect
};