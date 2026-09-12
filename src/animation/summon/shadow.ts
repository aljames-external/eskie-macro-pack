// Original Author: EskieMoh#2969
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface ShadowSummonOptions extends SummonOptions {
    tint?: string;
    changeLight?: boolean;
    light?: Record<string, unknown>;
}

export interface ShadowSummonSoundConfig {
    circle?: SoundConfig;
    appear?: SoundConfig;
    [key: string]: unknown;
}

export interface ShadowSummonConfig extends SummonConfig {
    id?: string;
    summonConfig?: ShadowSummonOptions;
    sound?: ShadowSummonSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: ShadowSummonConfig = {
    id: 'shadow',
    summonConfig: {},
    sound: {
        circle: { ...DEFAULT_SOUND_CONFIG },
        appear: { ...DEFAULT_SOUND_CONFIG, delay: 1200 }
    },
    crosshairParameters: {
        t: 'circle',
        distance: 2.5,
        gridHighlight: false,
        borderAlpha: 0
    }
};

/**
 * Summons a token onto the canvas for an actor.
 * @param {Actor} actor Actor document
 * @param {SummonOptions} [summonConfig={}] Summoning placement options (crosshairs, location, tokenData)
 * @returns {Promise<Token | null>} The summoned Token placeable or null
 */
async function summon(
    actor: Actor,
    summonConfig: SummonOptions = {}
): Promise<Token | null> {
    if (!actor?.uuid) return null;

    const tokenData: Record<string, unknown> = {
        alpha: 0,
        ...summonConfig.tokenData
    };

    const spawnOptions: Record<string, unknown> = {
        crosshairParameters: summonConfig.crosshairParameters ?? DEFAULT_CONFIG.crosshairParameters,
        ...summonConfig,
        actor,
        tokenData,
        uuid: actor.uuid,
        drawPing: summonConfig.drawPing ?? false
    };

    return adapter.summons.spawn(spawnOptions);
}

/**
 * Builds the Shadow Summon animation sequence.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {ShadowSummonConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: ShadowSummonConfig = {}
): Promise<any> {
    if (!token) return null;

    let targetToken: Token;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, settingsOverride(config));

    if (adapter.isToken(summonTarget)) {
        targetToken = summonTarget;
    } else if (adapter.isActor(summonTarget)) {
        const summoned = await summon(summonTarget, mConfig.summonConfig);
        if (!summoned) return null;
        targetToken = summoned;
    } else {
        targetToken = token;
    }

    const { sound } = mConfig;
    const sequence = new Sequence();
    applySound(sequence, sound?.circle);
    applySound(sequence, sound?.appear, 1200);

    const targetTexture = targetToken.document?.texture?.src ?? '';
    const scaleX = targetToken.document?.texture?.scaleX ?? 1;

    sequence
        .effect()
            .name(`${targetToken.name} Summon Shadow`)
            .file(closest('jb2a.smoke.puff.centered.dark_black'))
            .atLocation(targetToken)
            .scaleToObject(1.8 * scaleX)
            .randomRotation()
            .belowTokens()
            .scaleIn(0, 2000, { ease: 'easeOutCubic' })
            .repeats(5, 500, 500);

    if (targetTexture) {
        sequence
            .effect()
                .name(`${targetToken.name} Summon Shadow`)
                .file(targetTexture)
                .atLocation(targetToken)
                .scaleToObject(scaleX)
                .fadeIn(500, { ease: 'easeInExpo' })
                .fadeOut(1500, { ease: 'easeInExpo' })
                .filter('ColorMatrix', { saturate: -1, brightness: 0 })
                .filter('Blur', { blurX: 5, blurY: 5 })
                .scaleIn(0, 2000, { ease: 'easeOutSine' })
                .duration(3500)
                .attachTo(targetToken, { bindAlpha: false })
                .waitUntilFinished(-1000);
    }

    sequence
        .effect()
            .name(`${targetToken.name} Summon Shadow`)
            .file(closest('jb2a.smoke.puff.centered.dark_black'))
            .atLocation(targetToken)
            .scaleToObject(1.8 * scaleX)
            .randomRotation()
            .fadeOut(2400)
            .scaleOut(0.25, 2400, { ease: 'easeOutSine' })

        .animation()
            .on(targetToken)
            .fadeIn(500);

    return sequence;
}

/**
 * Plays the Shadow Summon sequence.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {ShadowSummonConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: ShadowSummonConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;
    const sequence = await create(token, summonTarget, config);
    return sequence?.play();
}

/**
 * Stops persistent visual effects on the target token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {ShadowSummonConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: ShadowSummonConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Summon Shadow`,
            object: target
        });
    }
}

export const shadow: SummonModule<ShadowSummonConfig> = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('summonShadow', 'token', 'eskie.summon.shadow', DEFAULT_CONFIG, '0.0.2', 'Summon Shadow');
