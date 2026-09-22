/**
 * Original Author: Akane
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';


import { adapter } from "../../../adapters/index.js";
const DEFAULT_CONFIG = {
    id: 'stormingDashStrikes',
    maxStrikes: 12,
    positions: undefined,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function _crosshairImage(crosshairs: any, token: Token) {
    new Sequence()
        .effect()
        .name('StormDash Crosshair')
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .attachTo(crosshairs)
        .persist()
        .opacity(0.65)
        .locally()
        .loopProperty('alphaFilter', 'alpha', { from: 1, to: 0.75, duration: 1500, pingPong: true })
        .scaleToObject(1, { considerTokenScale: true })
        .play();

    while (crosshairs.inFlight) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}

async function create(source: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound, positions: dashPositions = [] } = mConfig;

    const sequence = new Sequence();
    applySound(sequence, sound);
    if (!dashPositions || !dashPositions.length) return sequence;

    for (let e = 0; e < dashPositions.length; e++) {
        const stepSeq = new Sequence();
        const startPos = e === 0 ? source : dashPositions[e - 1];
        const endPos = dashPositions[e];

        // Line Behind 1
        stepSeq.effect()
            .file(closest('eskie.attack.ranged.arrow.01.twilight.heavy.blue.slow'))
            .scale(4)
            .atLocation(startPos)
            .stretchTo(endPos)
            .belowTokens()
            .opacity(0.75)
            .spriteOffset({ x: 0 }, { gridUnits: true })
            .filter('ColorMatrix', { brightness: 1.2 })
            .filter('ColorMatrix', { hue: 330 })
            .randomizeMirrorY()
            .fadeOut(200)
            .zIndex(0.2);

        // Line Behind 2
        stepSeq.effect()
            .file(closest('jb2a.template_line_piercing.generic.01.blue'))
            .filter('ColorMatrix', { hue: 180 })
            .playbackRate(0.9)
            .atLocation(startPos)
            .stretchTo(endPos)
            .belowTokens()
            .opacity(0.75)
            .spriteOffset({ x: 0 }, { gridUnits: true })
            .filter('ColorMatrix', { brightness: 1.2 })
            .randomizeMirrorY()
            .fadeOut(200)
            .zIndex(0.2);

        // Dash 1
        stepSeq.effect()
            .file(closest('eskie.smoke.01.white'))
            .atLocation(startPos)
            .rotateTowards(endPos)
            .scaleToObject(0.5, { considerTokenScale: true })
            .belowTokens()
            .opacity(0.85)
            .scaleIn(0, 300, { ease: 'easeOutExpo' })
            .spriteOffset({ x: -3, y: -0.1 }, { gridUnits: true })
            .waitUntilFinished(-1900);

        // Slash impact visual effect
        stepSeq.effect()
            .delay(e === 0 ? 100 : 0)
            .file(closest('eskie.sound.roar.02'))
            .scale(0.2)
            .filter('Glow', { color: 0x29c9ff })
            .spriteOffset({ x: 0.5, y: 0.5 }, { gridUnits: true })
            .randomRotation()
            .atLocation(e === 0 ? endPos : startPos);

        // Dash strike token motion via Sequencer 4.3.0+ .motion() API
        stepSeq.motion(source)
            .moveTo(endPos, { rotate: false, ease: 'easeOutCirc' })
            .moveSpeed(1500)
            .duration(400)
            .waitUntilFinished(-500);

        sequence.addSequence(stepSeq);
    }

    return sequence;
}

async function play(source: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);

    let positions = mConfig.positions;
    if (!positions || !positions.length) {
        positions = [];
        const maxStrikes = mConfig.maxStrikes ?? 12;
        for (let i = 0; i < maxStrikes; i++) {
            const pos = await Sequencer.Crosshair.show(
                {
                    interval: source.document.width % 2 === 0 ? 1 : -1,
                    size: source.document.width,
                    lockSize: false,
                    drawIcon: false,
                    drawOutline: true,
                    label: `Storm Dash Strikes (${i + 1}/${maxStrikes})`,
                    rememberControlled: true,
                },
                {
                    show: (crosshair: any) => _crosshairImage(crosshair, source),
                }
            );

            if (pos && !pos.cancelled) {
                positions.push(pos);
                new Sequence()
                    .effect()
                    .name(`StormDash Crosshair ${i}`)
                    .copySprite(source)
                    .spriteRotation(-source.document.rotation)
                    .atLocation(pos)
                    .fadeIn(100)
                    .persist()
                    .opacity(0.65)
                    .locally()
                    .loopProperty('alphaFilter', 'alpha', { from: 1, to: 0.75, duration: 1500, pingPong: true })
                    .scaleToObject(1, { considerTokenScale: true })
                    .fadeIn(250)
                    .fadeOut(500)
                    .play();
            } else {
                break;
            }
        }
    }

    Sequencer.EffectManager.endEffects({ name: 'StormDash Crosshair*' });

    if (!positions.length) return;

    const sequence = await create(source, { ...config, positions });
    if (sequence) return sequence.play();
}

async function stop(source: Token, config: any = {}) {
    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: 'StormDash Crosshair*', object: source }),
        Sequencer.EffectManager.endEffects({ name: 'Storm Dash Strikes', object: source }),
    ]);
}

export const stormingDashStrikes = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
