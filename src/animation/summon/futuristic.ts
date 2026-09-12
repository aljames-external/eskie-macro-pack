// Original Author: EskieMoh#2969
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface FuturisticSummonOptions extends SummonOptions {
    tint?: string;
    changeLight?: boolean;
    light?: Record<string, unknown>;
}

export interface FuturisticSummonSoundConfig {
    circle?: SoundConfig;
    appear?: SoundConfig;
    [key: string]: unknown;
}

export interface FuturisticSummonConfig extends SummonConfig {
    id?: string;
    summonConfig?: FuturisticSummonOptions;
    sound?: SoundConfig | FuturisticSummonSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: FuturisticSummonConfig = {
    id: 'futuristic',
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
 * Builds the Futuristic Summon animation sequence.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {FuturisticSummonConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: FuturisticSummonConfig = {}
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
    const soundObj = sound as FuturisticSummonSoundConfig;
    const isFlatSound = sound?.enable !== undefined || typeof (sound as any)?.file === 'string';
    applySound(sequence, isFlatSound ? sound : soundObj?.circle);
    if (!isFlatSound) {
        applySound(sequence, soundObj?.appear, 1200);
    }

    const targetTexture = targetToken.document?.texture?.src ?? '';
    const scaleX = targetToken.document?.texture?.scaleX ?? 1;
    const { widthUnits } = adapter.getTokenDimensions(targetToken);
    const imageSize = widthUnits * scaleX;

    sequence
        .effect()
            .name(`${targetToken.name} Summon Futuristic`)
            .file(closest('jb2a.token_stage.round.blue.02.02'))
            .atLocation(targetToken, { offset: { y: 0 }, gridUnits: true })
            .scaleToObject(1.25)
            .filter('ColorMatrix', { saturate: 1 })
            .belowTokens()
            .fadeOut(1000)
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .duration(10000)
            .zIndex(0.1)

        .effect()
            .delay(500)
            .name(`${targetToken.name} Summon Futuristic`)
            .file(closest('jb2a.token_stage.round.blue.02.02'))
            .atLocation(targetToken, { offset: { y: 0 }, gridUnits: true })
            .scaleToObject(1)
            .filter('ColorMatrix', { saturate: 1 })
            .belowTokens()
            .fadeOut(1000)
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .duration(10000)
            .zIndex(0.1)

        .wait(1000)

        .effect()
            .name(`${targetToken.name} Summon Futuristic`)
            .atLocation(targetToken, { offset: { x: -0.25 * imageSize, y: -0.25 * imageSize }, randomOffset: 0.5, gridUnits: true })
            .shape('rectangle', {
                lineSize: 4,
                lineColor: '#FFFFFF',
                fillColor: '#FFFFFF',
                fillAlpha: 1,
                width: 0.25 * imageSize,
                height: 0.25 * imageSize,
                gridUnits: true,
                name: 'test'
            })
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .fadeOut(500)
            .duration(500)
            .animateProperty('sprite', 'position.y', { from: 0, to: -0.5, duration: 500, gridUnits: true })
            .repeats(16, 100, 100)

        .effect()
            .name(`${targetToken.name} Summon Futuristic`)
            .atLocation(targetToken, { randomOffset: 0.5 })
            .shape('rectangle', {
                lineSize: 4,
                lineColor: '#FFFFFF',
                fillColor: '#FFFFFF',
                fillAlpha: 1,
                width: 0.25 * imageSize,
                height: 0.25 * imageSize,
                gridUnits: true,
                name: 'test'
            })
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .fadeOut(500)
            .duration(500)
            .animateProperty('sprite', 'position.y', { from: 0, to: -0.5, duration: 500, gridUnits: true })
            .repeats(16, 100, 100)

        .wait(100);

    if (targetTexture) {
        sequence
            .effect()
                .name(`${targetToken.name} Summon Futuristic`)
                .file(targetTexture)
                .atLocation(targetToken)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeOut(1000, { ease: 'easeInExpo' })
                .filter('ColorMatrix', { saturate: -1, brightness: 50 })
                .filter('Blur', { blurX: 5, blurY: 5 })
                .scaleIn(0, 1500, { ease: 'easeOutCubic' })
                .duration(2200)
                .attachTo(targetToken, { bindAlpha: false })
                .waitUntilFinished(-800);
    }

    sequence
        .effect()
            .delay(400)
            .name(`${targetToken.name} Summon Futuristic`)
            .file(closest('jb2a.particles.outward.white.01.03'))
            .attachTo(targetToken, { offset: { y: 0.2 }, gridUnits: true, followRotation: false })
            .scaleToObject()
            .duration(1000)
            .fadeOut(800)
            .scaleIn(0, 1000, { ease: 'easeOutCubic' })
            .animateProperty('sprite', 'width', { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: 'easeOutBack' })
            .animateProperty('sprite', 'height', { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
            .animateProperty('sprite', 'position.y', { from: 0, to: -0.6, duration: 1000, gridUnits: true })
            .opacity(1)
            .zIndex(0.3)

        .animation()
            .on(targetToken)
            .fadeIn(500);

    return sequence;
}

/**
 * Plays the Futuristic Summon sequence.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {FuturisticSummonConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: FuturisticSummonConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;
    const sequence = await create(token, summonTarget, config);
    return sequence?.play();
}

/**
 * Stops persistent visual effects on the target token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {FuturisticSummonConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: FuturisticSummonConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Summon Futuristic`,
            object: target
        });
    }
}

export const futuristic: SummonModule<FuturisticSummonConfig> = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('summonFuturistic', 'token', 'eskie.summon.futuristic', DEFAULT_CONFIG, '0.0.2', 'Summon Futuristic');
