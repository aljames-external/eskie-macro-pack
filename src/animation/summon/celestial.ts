// Original Author: EskieMoh#2969
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface CelestialSummonOptions extends SummonOptions {
    tint?: string;
    changeLight?: boolean;
    light?: Record<string, unknown>;
}

export interface CelestialSummonSoundConfig {
    circle?: SoundConfig;
    appear?: SoundConfig;
    [key: string]: unknown;
}

export interface CelestialSummonConfig extends SummonConfig {
    id?: string;
    summonConfig?: CelestialSummonOptions;
    sound?: CelestialSummonSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: CelestialSummonConfig = {
    id: 'celestial',
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
 * Builds the Celestial Summon animation sequence.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {CelestialSummonConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: CelestialSummonConfig = {}
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
    const { widthUnits } = adapter.getTokenDimensions(targetToken);
    const imageSize = widthUnits;

    sequence
        .effect()
            .name(`${targetToken.name} Summon Celestial`)
            .file(closest('eskie.attack.ranged.arrow.01.physical.heavy.blue.slow'))
            .atLocation(targetToken, { offset: { y: -((imageSize - 1) / 2) }, gridUnits: true })
            .scaleToObject(1.1)
            .filter('ColorMatrix', { saturate: -1, brightness: 10 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .animateProperty('spriteContainer', 'position.y', { from: -3, to: -0.3, duration: 500, ease: 'easeOutCubic', gridUnits: true })
            .fadeOut(100)
            .rotate(-90)
            .scaleOut(0, 100, { ease: 'easeOutCubic' })
            .duration(500)
            .attachTo(targetToken, { bindAlpha: false })
            .zIndex(5)
            .waitUntilFinished(-500)

        .effect()
            .name(`${targetToken.name} Summon Celestial`)
            .file(closest('jb2a.swirling_feathers.outburst.01.orange.1'))
            .atLocation(targetToken)
            .opacity(1)
            .scaleToObject(2)
            .filter('ColorMatrix', { saturate: 0.25, hue: 20, brightness: 1.1 })
            .belowTokens()
            .zIndex(1)

        .wait(200)

        .effect()
            .name(`${targetToken.name} Summon Celestial`)
            .file(closest('jb2a.extras.tmfx.outpulse.circle.02.fast'))
            .atLocation(targetToken)
            .opacity(1)
            .scaleToObject(1.5)

        .effect()
            .delay(250)
            .name(`${targetToken.name} Summon Celestial`)
            .file(closest('jb2a.markers.light.complete.yellow'))
            .attachTo(targetToken)
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .opacity(1)
            .belowTokens()
            .randomRotation()
            .scaleToObject(2)
            .duration(10000)
            .zIndex(1.1)

        .effect()
            .name(`${targetToken.name} Summon Celestial`)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.loop.yellow'))
            .atLocation(targetToken)
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .belowTokens()
            .scaleToObject(1.25)
            .duration(1200)
            .fadeIn(200, { ease: 'easeOutCirc', delay: 200 })
            .fadeOut(300, { ease: 'linear' })
            .filter('ColorMatrix', { saturate: -1, brightness: 2 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .zIndex(0.1)

        .effect()
            .name(`${targetToken.name} Summon Celestial`)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.loop.yellow'))
            .atLocation(targetToken)
            .filter('ColorMatrix', { saturate: -0.5, brightness: 1.1 })
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .belowTokens()
            .scaleToObject(1.25)
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .duration(10000);

    if (targetTexture) {
        sequence
            .effect()
                .name(`${targetToken.name} Summon Celestial`)
                .file(targetTexture)
                .atLocation(targetToken)
                .scaleToObject(scaleX)
                .fadeOut(1000, { ease: 'easeInExpo' })
                .filter('ColorMatrix', { saturate: -1, brightness: 50 })
                .filter('Blur', { blurX: 5, blurY: 5 })
                .scaleIn(0, 500, { ease: 'easeOutCubic' })
                .duration(1200)
                .attachTo(targetToken, { bindAlpha: false })
                .waitUntilFinished(-800);
    }

    sequence
        .animation()
            .on(targetToken)
            .fadeIn(500);

    return sequence;
}

/**
 * Plays the Celestial Summon sequence.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {CelestialSummonConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: CelestialSummonConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;
    const sequence = await create(token, summonTarget, config);
    return sequence?.play();
}

/**
 * Stops persistent visual effects on the target token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {CelestialSummonConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: CelestialSummonConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Summon Celestial`,
            object: target
        });
    }
}

export const celestial: SummonModule<CelestialSummonConfig> = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('summonCelestial', 'token', 'eskie.summon.celestial', DEFAULT_CONFIG, '0.0.2', 'Summon Celestial');
