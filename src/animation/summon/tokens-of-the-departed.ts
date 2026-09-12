// Original Author: .eskie
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface TokensOfTheDepartedLightConfig {
    dim?: number;
    bright?: number;
    alpha?: number;
    luminosity?: number;
    color?: string;
    animation?: {
        type?: string;
        speed?: number;
        intensity?: number;
    };
    attenuation?: number;
    contrast?: number;
    shadows?: number;
}

export interface TokensOfTheDepartedSummonOptions extends SummonOptions {
    changeLight?: boolean;
    light?: TokensOfTheDepartedLightConfig;
    tint?: string;
}

export interface TokensOfTheDepartedSoundConfig {
    launch?: SoundConfig;
    manifest?: SoundConfig;
    [key: string]: unknown;
}

export interface TokensOfTheDepartedConfig extends SummonConfig {
    id?: string;
    summonConfig?: TokensOfTheDepartedSummonOptions;
    tint?: string;
    changeLight?: boolean;
    light?: TokensOfTheDepartedLightConfig;
    sound?: TokensOfTheDepartedSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    tokenData?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: TokensOfTheDepartedConfig = {
    id: 'tokensOfTheDeparted',
    summonConfig: {},
    tint: '#58feb0',
    changeLight: true,
    light: {
        dim: 0,
        bright: 1,
        alpha: 0.25,
        luminosity: 0.55,
        color: '#58feb0',
        animation: { type: 'torch', speed: 4, intensity: 5 },
        attenuation: 0.85,
        contrast: 0,
        shadows: 0
    },
    sound: {
        launch: { ...DEFAULT_SOUND_CONFIG },
        manifest: { ...DEFAULT_SOUND_CONFIG, delay: 1000 }
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

    if (summonConfig.changeLight !== false) {
        tokenData.light = summonConfig.light ?? {
            ...DEFAULT_CONFIG.light,
            ...(summonConfig.tint ? { color: summonConfig.tint } : {})
        };
    }

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
 * Builds the Sequence animation.
 * If only a single token is provided (or summonTarget is omitted), adjusts the copySprite on that token without summoning anything.
 * If a caster token and a summoned token/actor are provided, builds the sequence from caster to summoned token.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: TokensOfTheDepartedConfig = {}
): Promise<any> {
    if (!token) return null;

    let casterToken: Token | null = null;
    let targetToken: Token;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, settingsOverride(config));

    if (adapter.isToken(summonTarget)) {
        casterToken = token;
        targetToken = summonTarget;
    } else if (adapter.isActor(summonTarget)) {
        casterToken = token;
        const summoned = await summon(summonTarget, mConfig.summonConfig);
        if (!summoned) return null;
        targetToken = summoned;
    } else {
        targetToken = token;
    }

    const { sound, tint } = mConfig;
    const sequence = new Sequence();
    applySound(sequence, sound?.launch);
    applySound(sequence, sound?.manifest, casterToken ? 1000 : 0);

    const effectTint = tint ?? '#58feb0';
    const targetRotation = adapter.getTokenRotation(targetToken);

    if (casterToken) {
        sequence
            .effect()
                .file(closest('jb2a.extras.tmfx.border.circle.outpulse.01.fast'))
                .atLocation(casterToken, { offset: { y: -0 }, gridUnits: true, bindRotation: false })
                .scaleToObject(0.25)
                .filter('ColorMatrix', { hue: -50 })
                .zIndex(1)
                .duration(1500)
                .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
                .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
                .moveTowards(targetToken, { delay: 500, ease: 'easeOutCubic', rotate: false })
                .scaleOut(0, 1000, { ease: 'easeOutSine' })
                .tint(effectTint)

            .effect()
                .file(closest('eskie.star.03.blue'))
                .atLocation(casterToken, { offset: { y: -0 }, gridUnits: true, bindRotation: false })
                .scaleToObject(0.75)
                .filter('ColorMatrix', { hue: -50 })
                .zIndex(1)
                .duration(1500)
                .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
                .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
                .animateProperty('sprite', 'rotation', { from: 0, to: 360 * 2, duration: 1500, delay: 500, ease: 'easeOutCubic' })
                .moveTowards(targetToken, { delay: 500, ease: 'easeOutCubic', rotate: false })
                .scaleOut(0, 1000, { ease: 'easeOutSine' })
                .waitUntilFinished(-500);
    }

    sequence
        .effect()
            .file(closest('eskie.poison.circle.01.teal'))
            .atLocation(targetToken)
            .scaleToObject(1.5)
            .zIndex(2)

        .effect()
            .name(`${targetToken.name} Tokens of the Departed`)
            .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
            .attachTo(targetToken, { bindAlpha: false })
            .scaleToObject(1.45, { considerTokenScale: true })
            .randomRotation()
            .belowTokens()
            .opacity(0.45)
            .tint(effectTint)
            .fadeIn(2500, { ease: 'easeInSine' })
            .persist()

        .effect()
            .name(`${targetToken.name} Tokens of the Departed`)
            .copySprite(targetToken)
            .spriteRotation(-targetRotation)
            .attachTo(targetToken, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(0.65)
            .tint(effectTint)
            .loopProperty('sprite', 'position.x', { from: 0.025, to: -0.025, duration: 5000, gridUnits: true, pingPong: true, ease: 'easeOutSine' })
            .loopProperty('sprite', 'position.y', { from: 0, to: -0.03, duration: 2500, gridUnits: true, pingPong: true })
            .filter('ColorMatrix', { saturate: -0.2, brightness: 1.2 })
            .filter('Blur', { blurX: 0, blurY: 0.8 })
            .fadeIn(2500, { ease: 'easeInSine' })
            .persist();

    return sequence;
}

/**
 * Plays the Tokens of the Departed sequence.
 * If summonTarget is a Token placeable, plays the animation directly with that token.
 * If summonTarget is an Actor document, summons a new token of that actor at a location first, then plays the animation.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: TokensOfTheDepartedConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;
    const sequence = await create(token, summonTarget, config);
    return sequence?.play();
}

/**
 * Stops persistent Tokens of the Departed visual effects on the summoned token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {TokensOfTheDepartedConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: TokensOfTheDepartedConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Tokens of the Departed`,
            object: target
        });
    }
}

export const tokensOfTheDeparted: SummonModule<TokensOfTheDepartedConfig> = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('tokensOfTheDeparted', 'token', 'eskie.summon.tokensOfTheDeparted', DEFAULT_CONFIG, '0.0.5', 'Tokens of the Departed');


