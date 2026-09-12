// Original Author: EskieMoh#2969
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface NatureSummonOptions extends SummonOptions {
    tint?: string;
    changeLight?: boolean;
    light?: Record<string, unknown>;
}

export interface NatureSummonSoundConfig {
    circle?: SoundConfig;
    appear?: SoundConfig;
    [key: string]: unknown;
}

export interface NatureSummonConfig extends SummonConfig {
    id?: string;
    summonConfig?: NatureSummonOptions;
    sound?: NatureSummonSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: NatureSummonConfig = {
    id: 'nature',
    summonConfig: {},
    sound: {
        circle: { ...DEFAULT_SOUND_CONFIG },
        appear: { ...DEFAULT_SOUND_CONFIG, delay: 1400 }
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
 * Builds the Nature Summon animation sequence.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {NatureSummonConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: NatureSummonConfig = {}
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
    applySound(sequence, sound?.appear, 1400);

    sequence
        .effect()
            .name(`${targetToken.name} Summon Nature`)
            .file(closest('jb2a.swirling_leaves.complete.01.green.0'))
            .atLocation(targetToken)
            .scaleToObject(2.25)
            .scaleIn(0, 4000, { ease: 'easeOutBack' })
            .endTime(4500)
            .fadeOut(750, { ease: 'easeOutQuint' })
            .zIndex(6)

        .wait(1000)

        .effect()
            .name(`${targetToken.name} Summon Nature`)
            .file(closest('jb2a.sacred_flame.target.green'))
            .atLocation(targetToken)
            .scaleToObject(2)
            .scaleIn(0, 4000, { ease: 'easeOutBack' })
            .endTime(2500)
            .fadeOut(500)
            .zIndex(5)
            .waitUntilFinished(-1000)

        .effect()
            .name(`${targetToken.name} Summon Nature`)
            .file(closest('jb2a.plant_growth.04.ring.4x4.complete.greenwhite'))
            .atLocation(targetToken)
            .opacity(1)
            .belowTokens()
            .randomRotation()
            .scaleToObject(1.5)
            .zIndex(1.1)

        .wait(200)

        .effect()
            .name(`${targetToken.name} Summon Nature`)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.loop.green'))
            .atLocation(targetToken)
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .belowTokens()
            .scaleToObject(1.25)
            .duration(1200)
            .fadeIn(200, { ease: 'easeOutCirc', delay: 200 })
            .fadeOut(300, { ease: 'linear' })
            .filter('ColorMatrix', { saturate: -1, brightness: 2 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .zIndex(0.1)

        .effect()
            .name(`${targetToken.name} Summon Nature`)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.loop.green'))
            .atLocation(targetToken)
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .belowTokens()
            .scaleToObject(1.25)
            .fadeOut(5000, { ease: 'easeOutQuint' })
            .duration(10000)

        .effect()
            .name(`${targetToken.name} Summon Nature`)
            .file(closest('jb2a.swirling_leaves.outburst.01.greenorange'))
            .atLocation(targetToken)
            .opacity(1)
            .scaleToObject(2)
            .zIndex(1)

        .animation()
            .delay(300)
            .on(targetToken)
            .fadeIn(500);

    return sequence;
}

/**
 * Plays the Nature Summon sequence.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {NatureSummonConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: NatureSummonConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;
    const sequence = await create(token, summonTarget, config);
    return sequence?.play();
}

/**
 * Stops persistent visual effects on the target token.
 * @param {Token} token Caster token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {NatureSummonConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(token: Token, summonTarget?: Token | Actor, config: NatureSummonConfig = {}): Promise<void> {
    const target = summonTarget ?? token;
    if (target) {
        Sequencer.EffectManager.endEffects({
            name: `${target.name} Summon Nature`,
            object: target
        });
    }
}

export const nature: SummonModule<NatureSummonConfig> = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('summonNature', 'token', 'eskie.summon.nature', DEFAULT_CONFIG, '0.0.2', 'Summon Nature');
