import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { settingsOverride } from '../../../lib/settings.js';

// Author: EskieMoh#2969
// Modular Conversion & .motion() Update: bakanabaka
// Gunslinger: Git the Dirt! (Sequencer 4.3.0+ .motion() Animation)

const DEFAULT_CONFIG: AnimationEffectConfig = {
    id: 'gitTheDirt',
    label: 'Git the Dirt!',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, config: AnimationEffectConfig = {}, options: Record<string, any> = {}) {
    if (options?.type === 'aefx') return null;
    config = settingsOverride(config);
    const { template, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const crosshairCfg = {
        radius: 1,
        icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
        label: 'Git The Dirt!'
    };
    const [position] = await templatelib.getPosition(template, crosshairCfg);
    if (!position || position.cancelled) return null;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Launch dust puff
    sequence.effect()
        .delay(50)
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
        .moveTowards(position, { delay: 50, rotate: false, ease: 'easeOutQuint' })
        .duration(1200)
        .belowTokens()
        .filter('ColorMatrix', { saturate: -1, brightness: 0 })
        .filter('Blur', { blurX: 5, blurY: 10 })
        .opacity(0.5);

    // Gunslinger dive jump trajectory and prone rotation tilt using Sequencer 4.3.0+ sequence.motion(token).rotateTo(90).moveBy()
    sequence.motion(token)
        .rotateTo(90)
        .moveBy(position, { delay: 50, ease: 'easeOutQuint' });

    // Target landing dirt impact puff
    sequence.effect()
        .delay(800)
        .file(closest('eskie.smoke.01.white'))
        .atLocation(position)
        .rotateTowards(token)
        .scaleToObject(1.5)
        .belowTokens()
        .spriteOffset({ x: -1.25 }, { gridUnits: true })
        .opacity(0.5);

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
        .rotateTo(tokenRotation - 90);
}

async function stop(token: Token) {
    const seq = destroy(token);
    if (seq) return seq.play();
    return null;
}

export const gitTheDirt = {
    create,
    play,
    destroy,
    stop,
    default_config: DEFAULT_CONFIG
};

export const hitTheDirt = gitTheDirt;

adapter.autorec.register('gitTheDirt', 'template', 'eskie.effect.gitTheDirt', DEFAULT_CONFIG, '0.0.2', 'Git the Dirt!');
adapter.autorec.register('hitTheDirt', 'template', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG, '0.0.2', 'Hit the Dirt');
