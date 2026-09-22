import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { settingsOverride } from '../../../lib/settings.js';

// Author: bakanabaka
// Gunslinger: Black Powder Boost (Sequencer 4.3.0+ .motion() Animation)

const DEFAULT_CONFIG: AnimationEffectConfig = {
    id: 'blackPowderBoost',
    label: 'Black Powder Boost',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, config: AnimationEffectConfig = {}, options: Record<string, any> = {}) {
    if (options?.type === 'aefx') return null;
    config = settingsOverride(config);
    const { template, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const crosshairCfg = {
        radius: 1,
        icon: 'icons/skills/movement/feet-boost-jumped-yellow.webp',
        label: 'Black Powder Boost'
    };
    const [position] = await templatelib.getPosition(template, crosshairCfg);
    if (!position || position.cancelled) return null;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Launch blast at origin
    sequence.effect()
        .file(closest('eskie.smoke.06.white'))
        .atLocation(token)
        .scaleToObject(1.4)
        .belowTokens()
        .playbackRate(1.5)
        .opacity(0.7);

    const tokenPlaceable = (adapter.getPlaceable(token as any) ?? (token as any)?.object ?? token) as Token;
    if (!tokenPlaceable) return null;

    // Gunslinger token propulsion using Sequencer 4.3.0+ .motion()
    sequence.motion(tokenPlaceable)
        .moveTo(position, { duration: 500, ease: 'easeOutExpo' });

    // Landing smoke impact puff
    sequence.effect()
        .delay(400)
        .file(closest('eskie.smoke.01.white'))
        .atLocation(position)
        .scaleToObject(1.5)
        .belowTokens()
        .opacity(0.6);

    return sequence;
}

async function play(token: Token, config: AnimationEffectConfig = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
    return null;
}

export const blackPowderBoost = {
    create,
    play,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('blackPowderBoost', 'template', 'eskie.effect.blackPowderBoost', DEFAULT_CONFIG, '0.0.1', 'Black Powder Boost');
