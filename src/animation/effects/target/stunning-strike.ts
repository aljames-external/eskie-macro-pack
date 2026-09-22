/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

export interface StunningStrikeConfig {
    id?: string;
    sound?: SoundConfig;
    [key: string]: unknown;
}

const DEFAULT_CONFIG: StunningStrikeConfig = {
    id: 'stunningStrike',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

/**
 * Creates a Sequencer effect for a Stunning Strike.
 *
 * @param {Token} token The token performing the strike.
 * @param {Token} target The token being stunned.
 * @param {StunningStrikeConfig} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createStunningStrike(token: Token, target: Token, config: StunningStrikeConfig = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;

    if (!token || !target) return null;

    const sequence = new Sequence();
    applySound(sequence, sound);

    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const middle = {
        x: (targetCenter.x - tokenCenter.x) * 0.25,
        y: (targetCenter.y - tokenCenter.y) * 0.25,
    };
    const { widthUnits: targetWidth } = adapter.getTokenDimensions(target);

    sequence
        .effect()
        .file(closest("jb2a.sacred_flame.target.blue"))
        .atLocation(token, { offset: { y: 0 }, gridUnits: true })
        .scaleToObject(0.5)
        .playbackRate(2)
        .fadeOut(100)
        .zIndex(2)

        .effect()
        .file(closest("jb2a.token_border.circle.static.blue.012"))
        .attachTo(token)
        .opacity(0.75)
        .scaleToObject(2)
        .filter("ColorMatrix", { saturate: 0 })
        .fadeIn(500)
        .duration(1500)
        .belowTokens()
        .fadeOut(250)

        .effect()
        .file(closest("jb2a.particles.inward.blue.01.01"))
        .attachTo(token)
        .opacity(0.35)
        .scaleToObject(1.5)
        .filter("ColorMatrix", { saturate: 1 })
        .fadeIn(500)
        .duration(1500)
        .mask(token)
        .fadeOut(250)

        .wait(950)

        .canvasPan()
        .delay(250)
        .shake({ duration: 250, strength: 2, rotation: false })

        .effect()
        .file(closest("jb2a.swirling_leaves.outburst.01.pink"))
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: 1, hue: -105 })
        .scaleToObject(0.75)
        .fadeOut(2000)
        .atLocation(token)
        .zIndex(1)

        .motion(token)
        .moveBy(middle, { duration: 100, ease: "easeOutExpo" })
        .moveBy({ x: -middle.x, y: -middle.y }, { duration: 350, ease: "easeInOutQuad" })

        .effect()
        .file(closest("jb2a.impact.010.blue"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(2.5)
        .atLocation(target)
        .randomRotation()

        .effect()
        .file(closest("jb2a.impact.ground_crack.blue.02"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(2.5)
        .atLocation(target)
        .randomRotation()
        .belowTokens()

        .effect()
        .delay(200)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(1.75)
        .opacity(0.5)
        .atLocation(target)
        .belowTokens()

        .effect()
        .delay(200)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(2.5)
        .opacity(0.5)
        .atLocation(target)
        .belowTokens()

        .motion(target)
        .oscillate()

        .effect()
        .name(`StunningStrike - DizzyStars - ${id} - ${target.document.uuid}`) // Unique name for stopping
        .delay(1000)
        .file(closest("jb2a.dizzy_stars.200px.yellow"))
        .scaleIn(0, 100, { ease: "easeOutCubic" })
        .scaleToObject(1)
        .opacity(1)
        .attachTo(target, { offset: { y: -0.5 * targetWidth }, gridUnits: true })
        .persist()
        ;

    return sequence;
}

/**
 * Plays the Stunning Strike effect.
 *
 * @param {Token} token The token performing the strike.
 * @param {Token} target The token being stunned.
 * @param {StunningStrikeConfig} config Configuration options for the animation.
 * @returns {Promise<Sequence | null>} A promise that resolves when the sequence starts playing.
 */
async function playStunningStrike(token: Token, target: Token, config: StunningStrikeConfig = {}) {
    if (!token || !target) return null;
    const sequence = await createStunningStrike(token, target, config);
    if (sequence) { return sequence.play(); }
    return null;
}

/**
 * Stops the persistent "dizzy stars" effect from Stunning Strike.
 *
 * @param {Token} target The token affected by the persistent effect.
 * @param {StunningStrikeConfig} config Configuration options.
 */
function stopStunningStrike(target: Token, config: StunningStrikeConfig = {}) {
    if (!target?.document?.uuid) return;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `StunningStrike - DizzyStars - ${id} - ${target.document.uuid}` });
}

export const stunningStrike = {
    create: createStunningStrike,
    play: playStunningStrike,
    stop: stopStunningStrike,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('stunningStrike', 'melee-target', 'eskie.effect.stunningStrike', DEFAULT_CONFIG, '0.0.1', 'Stunning Strike');

