// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { utils } from '../../utils/_utils.js';

const DEFAULT_CONFIG = {
    missed: false,
    timingAdjust: -50,
    effect: {
        hook: 'eskie.objects.meat_hook.ranged.01.physical.normal.iron',
        latch: 'eskie.objects.meat_hook.ranged.01.physical.latch.iron'
    }
};

/**
 * Creates the Hook and Pull sequence effects.
 * @param {Token} token - The casting token.
 * @param {Token} target - The target token.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { missed, timingAdjust, effect } = mConfig;

    // Determine pull location (best adjacent square to the token along the line to the target)
    const location = utils.grid.getBestAdjacentLocation(token, target);

    // Determine travel distance
    const offsetX = (location.x - target.center.x) / canvas.grid.size;
    const offsetY = (location.y - target.center.y) / canvas.grid.size;

    const sequence = new Sequence();

    // Effect if missed
    sequence.effect()
        .file(closest(effect.hook))
        .attachTo(token)
        .stretchTo(target)
        .zIndex(1)
        .waitUntilFinished(-750)
        .playIf(missed);

    // Effect if hit
    sequence.effect()
        .file(closest(effect.latch))
        .attachTo(token)
        .stretchTo(target)
        .zIndex(1)
        .waitUntilFinished(-750)
        .playIf(!missed);

    // Turn token invisible  
    sequence.animation()
        .delay(100)
        .on(target)
        .opacity(0)
        .playIf(!missed);

    // Create effect copy of target and pull it toward location  
    sequence.effect()
        .copySprite(target)
        .zIndex(0)
        .animateProperty('sprite', 'position.x', { from: 0, to: offsetX, duration: 500, delay: 101 + timingAdjust, gridUnits: true, ease: 'easeInCubic' })
        .animateProperty('sprite', 'position.y', { from: 0, to: offsetY, duration: 500, delay: 101 + timingAdjust, gridUnits: true, ease: 'easeInCubic' })
        .duration(700 + timingAdjust)
        .waitUntilFinished(-100)
        .playIf(!missed);

    // Teleport target to pull location and make it visible again
    sequence.animation()
        .on(target)
        .teleportTo(location, { relativeToCenter: true })
        .opacity(1)
        .playIf(!missed);

    return sequence;
}

/**
 * Plays the Hook and Pull animation.
 * @param {Token} token - The casting token.
 * @param {Token} target - The target token.
 * @param {object} config - Configuration options for the animation.
 */
async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    sequence.play();
}

/**
 * Stops the Hook and Pull animation (transient effect).
 */
function stop(token, config = {}) {
    // No persistent effects to stop
}

export const hookAndPull = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
