// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'shockingGrasp',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

/**
 * Creates a Sequencer effect for a Shocking Grasp spell.
 *
 * @param {Token} token The token casting the spell.
 * @param {Token} target The token being targeted.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token: Token, targetToken?: Token, config: any = {}) {
    const trg = targetToken ?? Array.from(game.user?.targets ?? [])[0];
    if (!token || !trg) return null;

    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    const sequence = new Sequence();
    applySound(sequence, sound);

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    sequence
        .effect()
            .file(closest('jb2a.breath_weapons.lightning.line.blue'))
            .atLocation(token)
            .rotateTowards(trg)
            .spriteOffset({ x: tokenWidth * 0.4 }, { gridUnits: true })
            .scale(0.25)
            .endTime(4000)
            .playbackRate(3)
            .animateProperty('spriteContainer', 'position.x', { from: -0.3, to: 0, duration: 750, gridUnits: true, ease: 'easeInBack' })
            .waitUntilFinished(-300)

        .effect()
            .delay(250)
            .file(closest('jb2a.impact.008.blue'))
            .atLocation(token)
            .rotateTowards(trg)
            .spriteOffset({ x: tokenWidth - 1 }, { gridUnits: true })
            .scale(0.25)

        .effect()
            .file(closest('eskie.lightning.03.blue'))
            .atLocation(token)
            .rotateTowards(trg)
            .size(tokenWidth * 1.2, { gridUnits: true })
            .filter('ColorMatrix', { hue: -24, saturate: 1 })
            .spriteOffset({ x: tokenWidth * 0.35 }, { gridUnits: true })
            .zIndex(1)
            .repeats(2, 500, 500)

        .effect()
            .delay(250)
            .file(closest('eskie.lightning.03.blue'))
            .atLocation(token)
            .rotateTowards(trg)
            .size(tokenWidth * 1.2, { gridUnits: true })
            .filter('ColorMatrix', { hue: -24, saturate: 1 })
            .spriteOffset({ x: tokenWidth * 0.35 }, { gridUnits: true })
            .mirrorY()
            .zIndex(1)
            .repeats(2, 500, 500)

        .wait(250)

        .effect()
            .file(closest('jb2a.static_electricity.03.blue'))
            .attachTo(trg)
            .scaleToObject(1.25, { considerTokenScale: true })
            .opacity(1)
            .playbackRate(1)
            .fadeOut(1000)
            .randomRotation()
            .filter('ColorMatrix', { hue: -15, saturate: 1 })
            .repeats(3, 300, 300)

        .motion(trg)
            .noise({ strength: 0.05, frequency: 50, duration: 4000, gridUnits: true });

    return sequence;
}

/**
 * Plays the Shocking Grasp effect.
 *
 * @param {Token} token The token casting the spell.
 * @param {Token} [targetToken] The token being targeted.
 * @param {object} [config={}] Configuration options for the animation.
 * @returns {Promise<Sequence>} A promise that resolves when the sequence starts playing.
 */
async function play(token: Token, targetToken?: Token, config: any = {}) {
    const sequence = await create(token, targetToken, config);
    if (sequence) return sequence.play({ preload: true });
}

function stop() {
    // Transient effect
}

export const shockingGrasp = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('shockingGrasp', 'melee-target', 'eskie.effect.shockingGrasp', DEFAULT_CONFIG, '0.0.1', 'Shocking Grasp');
