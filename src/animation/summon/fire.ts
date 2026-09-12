// Original Author: EskieMoh#2969
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface FireSummonOptions extends SummonOptions {
    tint?: string;
    changeLight?: boolean;
    light?: Record<string, unknown>;
}

export interface FireSummonSoundConfig {
    circle?: SoundConfig;
    appear?: SoundConfig;
    [key: string]: unknown;
}

export interface FireSummonConfig extends SummonConfig {
    id?: string;
    summonConfig?: FireSummonOptions;
    sound?: FireSummonSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: FireSummonConfig = {
    id: 'fire',
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

    const location = summonConfig.location;
    if (location) {
        if (!canvas.scene) return null;

        const tokenDocData = await actor.getTokenDocument({
            x: location.x,
            y: location.y,
            ...tokenData
        });
        const tokenDataObj = 'toObject' in tokenDocData && typeof tokenDocData.toObject === 'function'
            ? tokenDocData.toObject()
            : tokenDocData;
        const created = await (canvas.scene as any).createEmbeddedDocuments('Token', [tokenDataObj]);
        const firstCreated = Array.isArray(created) ? created[0] : created;
        return (firstCreated?.object ?? adapter.getPlaceable(firstCreated?.id)) as Token;
    }

    const pickOptions: Record<string, unknown> = {
        crosshairParameters: summonConfig.crosshairParameters ?? DEFAULT_CONFIG.crosshairParameters,
        ...summonConfig,
        tokenData,
        uuid: actor.uuid,
        drawPing: summonConfig.drawPing ?? false
    };

    return adapter.summons.pick(pickOptions);
}

/**
 * Builds the Fire Summon animation sequence.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {FireSummonConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: FireSummonConfig = {}
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
            .name(`${targetToken.name} Summon Fire`)
            .file(closest('jb2a.impact.fire.01.orange'))
            .atLocation(targetToken, { offset: { y: -0 }, gridUnits: true })
            .scaleToObject(2.5)
            .fadeOut(1000, { ease: 'easeInExpo' })
            .attachTo(targetToken, { bindAlpha: false })
            .zIndex(5)

        .wait(100)

        .effect()
            .name(`${targetToken.name} Summon Fire`)
            .file(closest('jb2a.ground_cracks.orange.02'))
            .atLocation(targetToken)
            .fadeIn(500, { ease: 'easeOutCirc' })
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .duration(10000)
            .opacity(1)
            .randomRotation()
            .belowTokens()
            .scaleToObject(1.5)
            .zIndex(0.2)

        .effect()
            .name(`${targetToken.name} Summon Fire`)
            .file(closest('jb2a.particles.outward.orange.01.03'))
            .atLocation(targetToken)
            .fadeIn(250, { ease: 'easeOutQuint' })
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .opacity(1)
            .filter('ColorMatrix', { saturate: 0, brightness: 1 })
            .randomRotation()
            .scaleToObject(2)
            .duration(10000)

        .effect()
            .name(`${targetToken.name} Summon Fire`)
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
            .name(`${targetToken.name} Summon Fire`)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.loop.yellow'))
            .atLocation(targetToken)
            .filter('ColorMatrix', { saturate: 0, brightness: 1.1 })
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .belowTokens()
            .scaleToObject(1.25)
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .duration(10000);

    if (targetTexture) {
        sequence
            .effect()
                .name(`${targetToken.name} Summon Fire`)
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
            .fadeIn(250);

    return sequence;
}

/**
 * Plays the Fire Summon sequence.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {FireSummonConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: FireSummonConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;
    const sequence = await create(token, summonTarget, config);
    return sequence?.play();
}

/**
 * Stops persistent visual effects on the target token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {FireSummonConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: FireSummonConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Summon Fire`,
            object: target
        });
    }
}

export const fire: SummonModule<FireSummonConfig> = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('summonFire', 'token', 'eskie.summon.fire', DEFAULT_CONFIG, '0.0.2', 'Summon Fire');
