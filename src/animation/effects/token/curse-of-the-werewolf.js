/* **
   Original Author: EskieMoh#2969
   Modular Conversion: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'curse-of-the-werewolf',
    // Path or URL to the werewolf form token image.
    werewolfForm: 'https://files.d20.io/images/390116904/V1XE3gOTz6-hHEg-_jQt3g/original.png',
};

/**
 * Creates a Sequencer effect for the Curse of the Werewolf animation.
 * Plays a dark transformation burst on the target token, briefly flashing
 * the werewolf form image as a ghostly overlay.
 *
 * @param {Token} target The token receiving the curse.
 * @param {object} config Configuration options.
 * @returns {Sequence} The created Sequence object.
 */
async function create(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { werewolfForm } = mConfig;

    const sequence = new Sequence()

        // Red runic sign floats above the target's head.
        .effect()
        .file(closest('jb2a.magic_signs.rune.02.complete.04.red'))
        .attachTo(target, { offset: { x: 0, y: -0.7 * target.document.width }, gridUnits: true, followRotation: false })
        .scaleToObject(0.5, { considerTokenScale: true })
        .duration(4000)
        .fadeOut(1000)
        .playbackRate(1.5)
        .zIndex(0)

        // Small dark outflow vortex near the rune — reinforces the cursed energy.
        .effect()
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(target, { offset: { x: 0, y: -0.7 * target.document.width }, gridUnits: true })
        .scaleToObject(0.5, { considerTokenScale: true })
        .duration(4000)
        .fadeIn(1000)
        .fadeOut(1000)
        .playbackRate(1.5)
        .filter('ColorMatrix', { brightness: 0 })

        // Dark particle burst — curse energy erupting upward from the target.
        .effect()
        .delay(300)
        .file(closest('jb2a.particles.outward.white.01.03'))
        .attachTo(target, { offset: { y: -0.7 }, gridUnits: true, followRotation: false })
        .scaleToObject(0.75, { considerTokenScale: true })
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: 'easeOutCubic' })
        .animateProperty('sprite', 'width', { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: 'easeOutBack' })
        .animateProperty('sprite', 'height', { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
        .animateProperty('sprite', 'position.y', { from: 0, to: -0.6, duration: 1000, gridUnits: true })
        .filter('ColorMatrix', { brightness: 0 })
        .opacity(0.8)
        .zIndex(0.3)

        .wait(400)

        // Larger dark outflow beneath the token — the curse spreading outward.
        .effect()
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(target)
        .scaleToObject(1.4, { considerTokenScale: true })
        .duration(4000)
        .fadeIn(1000)
        .fadeOut(1000)
        .belowTokens()
        .playbackRate(1.5)
        .randomRotation()
        .filter('ColorMatrix', { brightness: 0 })

        // Red inflow spiral masked to the token — the curse seeping into the target.
        .effect()
        .file(closest('jb2a.extras.tmfx.inflow.circle.02'))
        .attachTo(target)
        .scaleToObject(1.25, { considerTokenScale: true })
        .fadeIn(250)
        .fadeOut(2500)
        .duration(4000)
        .startTime(800)
        .opacity(0.8)
        .filter('ColorMatrix', { brightness: 0.5 })
        .tint('#e82121')
        .rotate(-15)
        .mask(target)

        // Ghost of the current token — glowing red, fading in as the curse takes hold.
        .effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(250)
        .fadeOut(2500)
        .duration(4000)
        .belowTokens()
        .opacity(0.5)
        .filter('ColorMatrix', { brightness: 0.5 })
        .filter('Glow', { color: 0xe82121, distance: 5 })

        // Subtle stretch-squash ghost of the current form — the body beginning to change.
        .effect()
        .copySprite(target)
        .attachTo(target)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty('sprite', 'width', { from: target.document.width * target.document.texture.scaleX, to: (target.document.width * 1.06) * target.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeInOutBack' })
        .animateProperty('sprite', 'height', { from: target.document.width * target.document.texture.scaleX, to: (target.document.width * 1.06) * target.document.texture.scaleX, duration: 750, gridUnits: true, ease: 'easeOutBack' })
        .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
        .opacity(0.4);

    // Ghost of the werewolf form — the beast briefly surfacing through the curse.
    if (werewolfForm) {
        sequence
            .effect()
            .file(closest(werewolfForm))
            .attachTo(target)
            .fadeIn(500)
            .fadeOut(500)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('sprite', 'width', { from: target.document.width * target.document.texture.scaleX, to: (target.document.width * 1.06) * target.document.texture.scaleX, duration: 500, gridUnits: true, ease: 'easeInOutBack' })
            .animateProperty('sprite', 'height', { from: target.document.width * target.document.texture.scaleX, to: (target.document.width * 1.06) * target.document.texture.scaleX, duration: 750, gridUnits: true, ease: 'easeOutBack' })
            .loopProperty('sprite', 'position.x', { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
            .opacity(0.4);
    }

    return sequence;
}

/**
 * Plays the Curse of the Werewolf animation on the target token.
 *
 * @param {Token} target The token receiving the curse.
 * @param {object} config Configuration options.
 * @returns {Promise<void>}
 */
async function play(target, config = {}) {
    const sequence = await create(target, config);
    if (sequence) return sequence.play();
}

export const curseOfTheWerewolf = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
