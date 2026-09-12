// Original Author: EskieMoh#2969
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface EarthSummonOptions extends SummonOptions {
    tint?: string;
    changeLight?: boolean;
    light?: Record<string, unknown>;
}

export interface EarthSummonSoundConfig {
    circle?: SoundConfig;
    appear?: SoundConfig;
    [key: string]: unknown;
}

export interface EarthSummonConfig extends SummonConfig {
    id?: string;
    summonConfig?: EarthSummonOptions;
    sound?: SoundConfig | EarthSummonSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: EarthSummonConfig = {
    id: 'earth',
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
 * Builds the Earth Summon animation sequence.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {EarthSummonConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: EarthSummonConfig = {}
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
    const soundObj = sound as EarthSummonSoundConfig;
    const isFlatSound = sound?.enable !== undefined || typeof (sound as any)?.file === 'string';
    applySound(sequence, isFlatSound ? sound : soundObj?.circle);
    if (!isFlatSound) {
        applySound(sequence, soundObj?.appear, 1200);
    }

    const targetTexture = targetToken.document?.texture?.src ?? '';
    const scaleX = targetToken.document?.texture?.scaleX ?? 1;

    sequence
        .effect()
            .name(`${targetToken.name} Summon Earth`)
            .file(closest('jb2a.impact.earth.01.browngreen'))
            .atLocation(targetToken, { offset: { y: -0 }, gridUnits: true })
            .scaleToObject(2.5)
            .fadeOut(1000, { ease: 'easeInExpo' })
            .attachTo(targetToken, { bindAlpha: false })
            .zIndex(5)

        .wait(100)

        .effect()
            .delay(100)
            .name(`${targetToken.name} Summon Earth`)
            .file(closest('eskie.smoke.01.tan'))
            .atLocation(targetToken)
            .playbackRate(0.65)
            .fadeIn(250)
            .fadeOut(1500)
            .scaleToObject(2)
            .randomRotation()
            .opacity(0.5)
            .filter('ColorMatrix', { brightness: 0.8 })
            .zIndex(4)

        .effect()
            .name(`${targetToken.name} Summon Earth`)
            .file(closest('jb2a.particles.outward.orange.01.03'))
            .atLocation(targetToken)
            .fadeIn(250, { ease: 'easeOutQuint' })
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .opacity(1)
            .filter('ColorMatrix', { saturate: 0.75, brightness: 0.85 })
            .randomRotation()
            .scaleToObject(2)
            .duration(10000)

        .effect()
            .name(`${targetToken.name} Summon Earth`)
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
            .name(`${targetToken.name} Summon Earth`)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.loop.yellow'))
            .atLocation(targetToken)
            .filter('ColorMatrix', { saturate: 0.8, brightness: 0.85 })
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .belowTokens()
            .scaleToObject(1.25)
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .duration(10000);

    if (targetTexture) {
        sequence
            .effect()
                .name(`${targetToken.name} Summon Earth`)
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
 * Plays the Earth Summon sequence.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {EarthSummonConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: EarthSummonConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;
    const sequence = await create(token, summonTarget, config);
    return sequence?.play();
}

/**
 * Stops persistent visual effects on the target token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {EarthSummonConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: EarthSummonConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Summon Earth`,
            object: target
        });
    }
}

export const earth: SummonModule<EarthSummonConfig> = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('summonEarth', 'token', 'eskie.summon.earth', DEFAULT_CONFIG, '0.0.2', 'Summon Earth');
