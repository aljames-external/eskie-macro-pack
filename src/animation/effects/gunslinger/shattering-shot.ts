import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { settingsOverride } from '../../../lib/settings.js';

// Author: bakanabaka
// Gunslinger: Shattering Shot (Sequencer 4.3.0+ .motion() Animation)

const DEFAULT_CONFIG: AnimationEffectConfig = {
    id: 'shatteringShot',
    label: 'Shattering Shot',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, targetToken?: Token, config: AnimationEffectConfig = {}) {
    config = settingsOverride(config);
    const { template, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    let targetPos = targetToken ? adapter.getCenter(targetToken) : null;
    if (!targetPos) {
        const crosshairCfg = {
            radius: 1,
            icon: 'icons/magic/defensive/shield-barrier-glowing-triangle-orange.webp',
            label: 'Shattering Shot'
        };
        const [pos] = await templatelib.getPosition(template, crosshairCfg);
        if (!pos || pos.cancelled) return null;
        targetPos = pos;
    }

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Heavy shooter recoil motion via Sequencer 4.3.0+ .motion()
    sequence.animation()
        .on(token)
        .motion({
            recoil: 0.4,
            duration: 400
        });

    // High velocity armor piercing projectile beam
    sequence.effect()
        .file(closest('jb2a.disintegrate.orange'))
        .atLocation(token)
        .stretchTo(targetPos)
        .playbackRate(1.5)
        .opacity(0.95);

    // Armor shattering blast and fragments on target
    sequence.effect()
        .delay(200)
        .file(closest('jb2a.shatter.orange'))
        .atLocation(targetPos)
        .scaleToObject(2.0, { considerTokenScale: true });

    return sequence;
}

async function play(token: Token, targetToken?: Token, config: AnimationEffectConfig = {}) {
    const seq = await create(token, targetToken, config);
    if (seq) return seq.play();
    return null;
}

export const shatteringShot = {
    create,
    play,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('shatteringShot', 'template', 'eskie.effect.shatteringShot', DEFAULT_CONFIG, '0.0.1', 'Shattering Shot');
