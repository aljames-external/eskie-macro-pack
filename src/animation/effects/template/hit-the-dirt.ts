import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { settingsOverride } from '../../../lib/settings.js';

// Last Updated: 4/30/2024
// Author: EskieMoh#2969
// Modular Conversion & .motion() Update: bakanabaka

const DEFAULT_CONFIG: AnimationEffectConfig = {
    id: 'hitTheDirt',
    label: 'Hit the Dirt',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, config: AnimationEffectConfig = {}, options: Record<string, any> = {}) {
    if (options?.type === 'aefx') return null;
    config = settingsOverride(config);
    const { template, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const cfg = {
        radius: 1,
        icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
        label: 'Hit The Dirt!'
    };
    const [position] = await templatelib.getPosition(template, cfg);
    if (!position || position.cancelled) return null;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Launch dust puff
    sequence.effect()
        .delay(100)
        .file(closest('eskie.smoke.06.white'))
        .atLocation(token)
        .scaleToObject(1.1)
        .belowTokens()
        .playbackRate(1.5)
        .opacity(0.5);

    // Dynamic motion shadow under diving token
    sequence.effect()
        .copySprite(token)
        .atLocation(token)
        .scaleToObject(0.85, { considerTokenScale: true })
        .moveTowards(position, { delay: 100, rotate: false, ease: 'easeOutQuint' })
        .duration(1600)
        .belowTokens()
        .filter('ColorMatrix', { saturate: -1, brightness: 0 })
        .filter('Blur', { blurX: 5, blurY: 10 })
        .opacity(0.5);

    // Target landing dirt impact puff
    sequence.effect()
        .delay(900)
        .file(closest('eskie.smoke.01.white'))
        .atLocation(position)
        .rotateTowards(token)
        .scaleToObject(1.5)
        .belowTokens()
        .spriteOffset({ x: -1.25 }, { gridUnits: true })
        .spriteRotation(-180)
        .opacity(0.5);

    // Dive prone tilt and movement using Sequencer 4.3.0+ sequence.motion(token).rotateTo(90, { duration: 300 }).moveBy()
    sequence.motion(token)
        .rotateTo(90, { duration: 300 })
        .moveBy(position, { duration: 800, delay: 100, ease: 'easeOutQuint' });

    return sequence;
}

async function play(token: Token, config: AnimationEffectConfig = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
    return null;
}

function destroy(token: Token) {
    const tokenRotation = adapter.getTokenRotation(token);
    return new Sequence()
        .motion(token)
        .rotateTo(tokenRotation - 90, { duration: 300 });
}

async function stop(token: Token) {
    const seq = destroy(token);
    if (seq) return seq.play();
    return null;
}

export const hitTheDirt = {
    create,
    play,
    destroy,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('hitTheDirt', 'template', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG, '0.0.2', 'Hit the Dirt');
adapter.autorec.register('hitTheDirt', 'effect', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG, '0.0.2', 'Hit the Dirt');