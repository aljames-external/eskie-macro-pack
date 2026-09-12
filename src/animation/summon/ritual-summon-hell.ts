// Original Author: EskieMoh#2969
// Integration & Modular Conversion: bakanabaka

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { adapter } from '../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../utils/sound.js';

export interface RitualSummonHellSummonOptions extends SummonOptions {
    interactive?: boolean;
}

export interface RitualSummonHellSoundConfig {
    circle?: SoundConfig;
    candles?: SoundConfig;
    charge?: SoundConfig;
    climax?: SoundConfig;
    [key: string]: unknown;
}

export interface RitualSummonHellConfig extends SummonConfig {
    label?: string;
    summonConfig?: RitualSummonHellSummonOptions;
    interactive?: boolean;
    sound?: SoundConfig | RitualSummonHellSoundConfig;
    crosshairParameters?: Record<string, unknown>;
    [key: string]: unknown;
}

export const DEFAULT_CONFIG: RitualSummonHellConfig = {
    summonConfig: {},
    interactive: false,
    sound: {
        circle: { ...DEFAULT_SOUND_CONFIG },
        candles: { ...DEFAULT_SOUND_CONFIG, delay: 2500 },
        charge: { ...DEFAULT_SOUND_CONFIG, delay: 3750 },
        climax: { ...DEFAULT_SOUND_CONFIG }
    },
    crosshairParameters: {
        t: 'circle',
        distance: 2.5,
        gridHighlight: false,
        borderAlpha: 0
    }
};

const PENTAGRAM_OFFSETS = [
    { x: 0, y: 0 },
    { x: 1.6, y: 2.2 },
    { x: -1.6, y: 2.2 },
    { x: -2.6, y: -0.8 },
    { x: 2.6, y: -0.8 },
    { x: 0, y: -2.7 }
];

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
 * Appends the climax sequence to a Sequence or creates a new climax Sequence.
 * @param {Token} targetToken Summoned token
 * @param {any[]} sumPos Calculated 6 pentagram positions
 * @param {number} tokenWidth Token width in grid units
 * @param {Sequence} [sequence] Optional Sequence to append to
 * @returns {Sequence}
 */
function buildClimax(
    targetToken: Token,
    sumPos: { x: number; y: number }[],
    tokenWidth: number,
    sequence?: any,
    soundConfig?: any,
    label: string = 'No Caster'
): any {
    const seq = sequence ?? new Sequence();
    const soundObj = soundConfig as RitualSummonHellSoundConfig;
    applySound(seq, soundObj?.climax ?? (soundConfig?.enable !== undefined ? soundConfig : null));

    seq
        .thenDo(function() {
            Sequencer.EffectManager.endEffects({ name: `Summoning Core - ${label}` });
            Sequencer.EffectManager.endEffects({ name: `Summoning Flames - ${label}` });
            if (game.modules.get('tagger')?.active) {
                Tagger.removeTags(targetToken, 'Pre Summon');
            }
        })
        .canvasPan()
        .shake({ duration: 2500, fadeOutDuration: 1000, strength: 5, rotation: false })

        .effect()
            .name(`Summoning Core - ${label}`)
            .atLocation(sumPos[0])
            .file(closest('jb2a.impact.ground_crack.dark_red.01'))
            .belowTokens()
            .size(3.5 + tokenWidth, { gridUnits: true })
            .zIndex(0.1)

        .effect()
            .delay(500)
            .name(`Summoning Circle - ${label}`)
            .atLocation(sumPos[0])
            .file(closest('jb2a.ground_cracks.dark_red.01'))
            .belowTokens()
            .fadeIn(1000)
            .size(3.5 + tokenWidth, { gridUnits: true })
            .persist()
            .zIndex(0.2)

        .effect()
            .name(`Summoning Circle - ${label}`)
            .file(closest('jb2a.fire_ring.500px.red'))
            .atLocation(targetToken)
            .filter('ColorMatrix', { brightness: 0 })
            .size(6, { gridUnits: true })
            .duration(2000)
            .belowTokens()
            .opacity(0.15)
            .fadeOut(900)
            .repeats(4, 450, 450)

        .effect()
            .name(`Summoning Core - ${label}`)
            .atLocation(sumPos[0])
            .file(closest('jb2a.sphere_of_annihilation.600px.dark_red'))
            .belowTokens()
            .size(1.5, { gridUnits: true })
            .animateProperty('sprite', 'width', { from: 1.5, to: 1.5 + tokenWidth, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
            .animateProperty('sprite', 'height', { from: 1.5, to: 1.5 + tokenWidth, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
            .fadeOut(1000)
            .duration(10000)
            .zIndex(0.3);

    for (let u = 1; u < 6; u++) {
        seq
            .effect()
                .name(`Summoning Circle - ${label}`)
                .atLocation(sumPos[u], { offset: { y: -1.15 }, gridUnits: true })
                .file(closest('jb2a.flames.02.orange'))
                .size(1.75, { gridUnits: true })
                .duration(1000)
                .fadeIn(200)
                .fadeOut(800)
                .animateProperty('sprite', 'height', { from: 1.75, to: 4, duration: 500, gridUnits: true, ease: 'easeOutBack' })
                .zIndex(1)

            .effect()
                .name(`Summoning Circle - ${label}`)
                .file(closest('jb2a.particles.outward.orange.01.03'))
                .atLocation(sumPos[u], { offset: { y: -0.75 }, gridUnits: true })
                .scale(0.2)
                .duration(1000)
                .fadeOut(800)
                .scaleIn(0, 1000, { ease: 'easeOutCubic' })
                .animateProperty('sprite', 'width', { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: 'easeOutBack' })
                .animateProperty('sprite', 'height', { from: 0, to: 3, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
                .animateProperty('sprite', 'position.y', { from: 0, to: -0.6, duration: 1000, gridUnits: true })
                .filter('ColorMatrix', { saturate: 1 })
                .zIndex(1.1);
    }

    const targetRotation = adapter.getTokenRotation(targetToken);

    seq
        .effect()
            .name(`Summoning Core - ${label}`)
            .copySprite(targetToken)
            .spriteRotation(-targetRotation)
            .atLocation(targetToken)
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .filter('ColorMatrix', { brightness: 0 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .duration(1000)
            .fadeOut(500)
            .zIndex(2.1)

        .effect()
            .name(`Summoning Core - ${label}`)
            .file(closest('jb2a.impact.fire'))
            .atLocation(targetToken, { offset: { y: -0.5 * tokenWidth }, gridUnits: true })
            .filter('ColorMatrix', { brightness: 0 })
            .scaleToObject(2.5)
            .zIndex(2)

        .animation()
            .delay(500)
            .on(targetToken)
            .show()
            .opacity(1);

    return seq;
}

/**
 * Builds the Ritual Summon Hell animation sequence.
 *
 * @param {Token} token Target token to adjust, or caster token if summonTarget is also provided
 * @param {Token | Actor} [summonTarget] Summoned token or actor to summon
 * @param {RitualSummonHellConfig} [config={}] Configuration options
 * @returns {Promise<Sequence | null>}
 */
async function create(
    token: Token,
    summonTarget?: Token | Actor,
    config: RitualSummonHellConfig = {}
): Promise<any> {
    if (!token) return null;

    let targetToken: Token;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, settingsOverride(config));
    const label = mConfig.label ?? token?.name ?? 'No Caster';

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
    const soundObj = sound as RitualSummonHellSoundConfig;
    const isFlatSound = sound?.enable !== undefined || typeof (sound as any)?.file === 'string';
    applySound(sequence, isFlatSound ? sound : soundObj?.circle);
    if (!isFlatSound) {
        applySound(sequence, soundObj?.candles, 2500);
        applySound(sequence, soundObj?.charge, 3750);
    }

    const center = adapter.getCenter(targetToken);
    const gridSize = adapter.getGridSize();
    const sumPos = PENTAGRAM_OFFSETS.map(offset => ({
        x: center.x + offset.x * gridSize,
        y: center.y + offset.y * gridSize
    }));
    const { widthUnits } = adapter.getTokenDimensions(targetToken);
    const tokenWidth = widthUnits;

    const centerLightData = {
        x: sumPos[0].x,
        y: sumPos[0].y,
        config: {
            dim: 15,
            bright: 15,
            luminosity: 0.5,
            color: '#fd250d',
            animation: { type: 'torch', speed: 4, intensity: 2 },
            attenuation: 0.75,
            saturation: 0.2,
            contrast: 0.25,
            shadows: 0.3
        },
        flags: {
            'eskie-macro-pack': { ritualSummonHell: true, label },
            tagger: { tags: ['Summon Light'] }
        }
    };

    sequence
        .thenDo(async function() {
            if (canvas.scene) {
                await (canvas.scene as any).createEmbeddedDocuments('AmbientLight', [centerLightData]);
            }
            if (game.modules.get('tagger')?.active) {
                await Tagger.addTags(targetToken, 'Pre Summon');
            }
        })
        .animation()
            .on(targetToken)
            .opacity(1)
            .hide()

        .effect()
            .name(`Summoning Circle - ${label}`)
            .atLocation(sumPos[0])
            .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_red'))
            .size(6, { gridUnits: true })
            .fadeIn(600)
            .opacity(1)
            .rotateIn(180, 600, { ease: 'easeOutCubic' })
            .scaleIn(0, 600, { ease: 'easeOutCubic' })
            .belowTokens()
            .persist()

        .wait(2500);

    for (let e = 1; e < 6; e++) {
        sequence
            .effect()
                .name(`Summoning Circle - ${label}`)
                .atLocation(sumPos[e])
                .file(closest('jb2a.impact.010.orange'))
                .size(2, { gridUnits: true })
                .zIndex(1)

            .effect()
                .name(`Summoning Flames - ${label}`)
                .atLocation(sumPos[e])
                .file(closest('jb2a.flames.01.orange'))
                .size(1.75, { gridUnits: true })
                .fadeIn(600)
                .opacity(1)
                .scaleIn(0, 600, { ease: 'easeOutCubic' })
                .filter('ColorMatrix', { hue: 0 })
                .fadeOut(500)
                .persist()

            .effect()
                .name(`Summoning Circle - ${label}`)
                .delay(1100, 1750)
                .atLocation(sumPos[e], { offset: { x: 0, y: -0.7 }, gridUnits: true })
                .file(closest('eskie.smoke.05.white'))
                .size(1.75, { gridUnits: true })
                .fadeIn(1000)
                .opacity(0.35)
                .playbackRate(0.5)
                .filter('ColorMatrix', { brightness: 0 })
                .fadeOut(500)
                .randomizeMirrorX()
                .persist()
                .zIndex(0.1);
    }

    sequence
        .thenDo(async function() {
            if (canvas.scene) {
                const peripheralLights = [];
                for (let i = 1; i < 6; i++) {
                    peripheralLights.push({
                        x: sumPos[i].x,
                        y: sumPos[i].y,
                        config: {
                            alpha: 0.35,
                            dim: 10,
                            bright: 5,
                            luminosity: 0.5,
                            color: '#fd250d',
                            animation: { type: 'torch', speed: 4, intensity: 1 },
                            attenuation: 0.9,
                            saturation: 0.2,
                            contrast: 0.25,
                            shadows: 0.3
                        },
                        flags: {
                            'eskie-macro-pack': { ritualSummonHell: true, label },
                            tagger: { tags: ['Summon Light'] }
                        }
                    });
                }
                await (canvas.scene as any).createEmbeddedDocuments('AmbientLight', peripheralLights);
            }
        })

        .effect()
            .delay(250)
            .name(`Summoning Core - ${label}`)
            .atLocation(sumPos[0])
            .file(closest('jb2a.sphere_of_annihilation.600px.dark_red'))
            .belowTokens()
            .size(1.5, { gridUnits: true })
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .fadeIn(500)
            .persist()

        .wait(1000)

        .effect()
            .name(`Summoning Core - ${label}`)
            .atLocation(targetToken)
            .file(closest('jb2a.markers.light_orb.complete.yellow'))
            .filter('ColorMatrix', { hue: -10, saturate: 1 })
            .size(2, { gridUnits: true })
            .belowTokens()
            .zIndex(0.1)
            .persist()

        .effect()
            .name(`Summoning Core - ${label}`)
            .delay(1000)
            .atLocation(targetToken)
            .file(closest('jb2a.shield_themed.above.fire.03.orange'))
            .size(1, { gridUnits: true })
            .fadeIn(500)
            .belowTokens()
            .zIndex(0.2)
            .persist();

    // If not in interactive mode, chain the climax directly after a dramatic wait
    if (!mConfig.interactive) {
        sequence.wait(2000);
        buildClimax(targetToken, sumPos, tokenWidth, sequence, sound, label);
    }

    return sequence;
}

/**
 * Plays the Ritual Summon Hell sequence.
 * In interactive mode (interactive: true), plays the summoning circle preparation,
 * shows a button dialog ("SUMMON!"), and on confirmation executes the climax sequence.
 * In non-interactive mode (default), plays the full ritual from start to finish.
 *
 * @param {Token} token Caster token
 * @param {Token | Actor} summonTarget Summoned token or actor to summon
 * @param {RitualSummonHellConfig} [config={}] Configuration options
 * @returns {Promise<any>}
 */
async function play(
    token: Token,
    summonTarget: Token | Actor,
    config: RitualSummonHellConfig = {}
): Promise<any> {
    if (!token || !summonTarget) return null;

    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, settingsOverride(config));
    const label = mConfig.label ?? token?.name ?? 'No Caster';

    if (mConfig.interactive) {
        let targetToken: Token;
        if (adapter.isToken(summonTarget)) {
            targetToken = summonTarget;
        } else if (adapter.isActor(summonTarget)) {
            const summoned = await summon(summonTarget, mConfig.summonConfig);
            if (!summoned) return null;
            targetToken = summoned;
        } else {
            return null;
        }

        const startSequence = await create(token, targetToken, { ...mConfig, interactive: true });
        await startSequence?.play();

        const result = await adapter.buttonDialog({
            title: 'Ritual Summon Hell',
            buttons: [{ label: 'SUMMON!', value: '1' }]
        });

        if (result === '1') {
            const center = adapter.getCenter(targetToken);
            const gridSize = adapter.getGridSize();
            const sumPos = PENTAGRAM_OFFSETS.map(offset => ({
                x: center.x + offset.x * gridSize,
                y: center.y + offset.y * gridSize
            }));
            const { widthUnits } = adapter.getTokenDimensions(targetToken);
            const climaxSeq = buildClimax(targetToken, sumPos, widthUnits, undefined, mConfig.sound, label);
            return climaxSeq.play();
        } else {
            await stop(token, targetToken, mConfig);
            return null;
        }
    }

    const sequence = await create(token, summonTarget, mConfig);
    return sequence?.play();
}

/**
 * Stops persistent visual effects, ambient lights, and tags associated with the ritual.
 * If a token or config.label is provided, stops effects specifically for that label.
 * If neither is provided, delegates to clean() to remove all ritual animations.
 *
 * @param {Token} [token] Caster or target token
 * @param {Token | Actor} [summonTarget] Summoned token or actor
 * @param {RitualSummonHellConfig} [config={}] Configuration options
 * @returns {Promise<void>}
 */
async function stop(
    token?: Token,
    summonTarget?: Token | Actor,
    config: RitualSummonHellConfig = {}
): Promise<void> {
    if (!token && !summonTarget && !config.label) {
        return clean();
    }

    const target = summonTarget ?? token;
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, settingsOverride(config));
    const label = mConfig.label ?? token?.name ?? 'No Caster';

    Sequencer.EffectManager.endEffects({ name: `Summoning Core - ${label}` });
    Sequencer.EffectManager.endEffects({ name: `Summoning Circle - ${label}` });
    Sequencer.EffectManager.endEffects({ name: `Summoning Flames - ${label}` });

    if (canvas.scene) {
        const ambientLights = (canvas.scene as any).lights ?? [];
        const deleteIds: string[] = [];
        for (const light of ambientLights) {
            const empFlag = light.flags?.['eskie-macro-pack']?.ritualSummonHell;
            const lightLabel = light.flags?.['eskie-macro-pack']?.label;
            const hasEmpFlag = Boolean(empFlag) && (!lightLabel || lightLabel === label);
            const hasTag = game.modules.get('tagger')?.active && Tagger.hasTags(light, 'Summon Light') && (!lightLabel || lightLabel === label);
            if (hasEmpFlag || hasTag) {
                deleteIds.push(light.id);
            }
        }
        if (deleteIds.length > 0) {
            await (canvas.scene as any).deleteEmbeddedDocuments('AmbientLight', deleteIds);
        }
    }

    if (target && game.modules.get('tagger')?.active && Tagger.removeTags) {
        await Tagger.removeTags(target, 'Pre Summon');
    }
}

/**
 * Removes all Ritual Summon Hell animations across all labels, ambient lights, and pre-summon tags.
 * @returns {Promise<void>}
 */
async function clean(): Promise<void> {
    Sequencer.EffectManager.endEffects({ name: 'Summoning Core*' });
    Sequencer.EffectManager.endEffects({ name: 'Summoning Circle*' });
    Sequencer.EffectManager.endEffects({ name: 'Summoning Flames*' });

    if (canvas.scene) {
        const ambientLights = (canvas.scene as any).lights ?? [];
        const deleteIds: string[] = [];
        for (const light of ambientLights) {
            const hasEmpFlag = Boolean(light.flags?.['eskie-macro-pack']?.ritualSummonHell);
            const hasTag = game.modules.get('tagger')?.active && Tagger.hasTags(light, 'Summon Light');
            if (hasEmpFlag || hasTag) {
                deleteIds.push(light.id);
            }
        }
        if (deleteIds.length > 0) {
            await (canvas.scene as any).deleteEmbeddedDocuments('AmbientLight', deleteIds);
        }
    }

    if (game.modules.get('tagger')?.active && Tagger.removeTags) {
        const taggedTokens = typeof Tagger.getByTag === 'function' ? Tagger.getByTag('Pre Summon') : [];
        for (const tok of taggedTokens) {
            await Tagger.removeTags(tok, 'Pre Summon');
        }
    }
}

export const ritualSummonHell: SummonModule<RitualSummonHellConfig> = {
    create,
    play,
    stop,
    clean,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('ritualSummonHell', 'token', 'eskie.summon.ritualSummonHell', DEFAULT_CONFIG, '0.0.2', 'Ritual Summon Hell');
