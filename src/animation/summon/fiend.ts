// Original Author: EskieMoh#2969
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface FiendSummonOptions extends SummonOptions {
    tint?: string;
    changeLight?: boolean;
    light?: Record<string, unknown>;
}

export interface FiendSummonSoundConfig {
    circle?: SoundConfig;
    appear?: SoundConfig;
    [key: string]: unknown;
}

export interface FiendSummonConfig extends SummonConfig {
    id?: string;
    summonConfig?: FiendSummonOptions;
    sound?: FiendSummonSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: FiendSummonConfig = {
    id: 'fiend',
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

        const tokenDoc = await actor.getTokenDocument({
            x: location.x,
            y: location.y,
            ...tokenData
        });
        const [createdDoc] = await (canvas.scene as any).createEmbeddedDocuments('Token', [tokenDoc.toObject()]);
        return createdDoc.object as Token;
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
 * Builds the Fiend Summon animation sequence.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {FiendSummonConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: FiendSummonConfig = {}
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
    const imageSize = widthUnits * scaleX;

    sequence
        .effect()
            .name(`${targetToken.name} Summon Fiend`)
            .file(closest('eskie.attack.ranged.arrow.01.physical.heavy.blue.slow'))
            .atLocation(targetToken, { offset: { y: -((imageSize - 1) / 2) }, gridUnits: true })
            .scaleToObject(1.1)
            .filter('ColorMatrix', { saturate: -1, brightness: 0 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .animateProperty('spriteContainer', 'position.y', { from: -3, to: -0.3, duration: 500, ease: 'easeOutCubic', gridUnits: true })
            .fadeOut(100)
            .rotate(-90)
            .scaleOut(0, 100, { ease: 'easeOutCubic' })
            .duration(500)
            .attachTo(targetToken, { bindAlpha: false })
            .zIndex(5)
            .waitUntilFinished(-300)

        .effect()
            .name(`${targetToken.name} Summon Fiend`)
            .file(closest('jb2a.impact.ground_crack.02.dark_red'))
            .atLocation(targetToken)
            .opacity(1)
            .randomRotation()
            .belowTokens()
            .scaleToObject(2)
            .zIndex(0.2)

        .wait(100)

        .effect()
            .name(`${targetToken.name} Summon Fiend`)
            .file(closest('jb2a.extras.tmfx.outpulse.circle.01.fast'))
            .atLocation(targetToken)
            .opacity(1)
            .scaleToObject(1.5)

        .effect()
            .name(`${targetToken.name} Summon Fiend`)
            .file(closest('jb2a.particles.outward.red.01.03'))
            .atLocation(targetToken)
            .fadeIn(250, { ease: 'easeOutQuint' })
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .opacity(1)
            .filter('ColorMatrix', { saturate: 1, brightness: 0.5 })
            .randomRotation()
            .scaleToObject(2)
            .duration(10000)

        .effect()
            .name(`${targetToken.name} Summon Fiend`)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.loop.red'))
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
            .name(`${targetToken.name} Summon Fiend`)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.loop.red'))
            .atLocation(targetToken)
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .belowTokens()
            .scaleToObject(1.25)
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .duration(10000);

    if (targetTexture) {
        sequence
            .effect()
                .name(`${targetToken.name} Summon Fiend`)
                .file(targetTexture)
                .atLocation(targetToken)
                .scaleToObject(scaleX)
                .fadeOut(1000, { ease: 'easeInExpo' })
                .filter('ColorMatrix', { saturate: -1, brightness: 0 })
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
 * Plays the Fiend Summon sequence.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {FiendSummonConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: FiendSummonConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;
    const sequence = await create(token, summonTarget, config);
    return sequence?.play();
}

/**
 * Stops persistent visual effects on the target token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {FiendSummonConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: FiendSummonConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Summon Fiend`,
            object: target
        });
    }
}

export const fiend: SummonModule<FiendSummonConfig> = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('summonFiend', 'token', 'eskie.summon.fiend', DEFAULT_CONFIG, '0.0.2', 'Summon Fiend');
