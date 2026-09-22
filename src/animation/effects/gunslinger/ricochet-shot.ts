import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { settingsOverride } from '../../../lib/settings.js';

// Author: bakanabaka
// Gunslinger: Ricochet Shot (Sequencer 4.3.0+ .motion() Animation)

const DEFAULT_CONFIG: AnimationEffectConfig = {
    id: 'ricochetShot',
    label: 'Ricochet Shot',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, targetToken?: Token, config: AnimationEffectConfig = {}) {
    config = settingsOverride(config);
    const { template, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    let finalPos = targetToken ? adapter.getCenter(targetToken) : null;
    if (!finalPos) {
        const crosshairCfg = {
            radius: 1,
            icon: 'icons/weapons/guns/rifle-scope-red.webp',
            label: 'Ricochet Shot'
        };
        const [pos] = await templatelib.getPosition(template, crosshairCfg);
        if (!pos || pos.cancelled) return null;
        finalPos = pos;
    }

    const casterCenter = adapter.getCenter(token);
    // Midpoint bounce location for ricochet trajectory
    const bouncePos = {
        x: (casterCenter.x + finalPos.x) / 2 + 100,
        y: (casterCenter.y + finalPos.y) / 2 - 100
    };

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Caster recoil via Sequencer 4.3.0+ .motion()
    sequence.animation()
        .on(token)
        .motion({
            recoil: 0.15,
            duration: 250
        });

    // Primary shot streak to ricochet point
    sequence.effect()
        .file(closest('jb2a.bullet.01.orange'))
        .atLocation(token)
        .stretchTo(bouncePos)
        .playbackRate(2);

    // Ricochet spark burst at bounce point
    sequence.effect()
        .delay(150)
        .file(closest('jb2a.sparks.orange'))
        .atLocation(bouncePos)
        .scaleToObject(1.2);

    // Secondary ricochet streak to target
    sequence.effect()
        .delay(200)
        .file(closest('jb2a.bullet.01.orange'))
        .atLocation(bouncePos)
        .stretchTo(finalPos)
        .playbackRate(2);

    // Final target hit spark
    sequence.effect()
        .delay(350)
        .file(closest('jb2a.impact.orange'))
        .atLocation(finalPos)
        .scaleToObject(1.4, { considerTokenScale: true });

    return sequence;
}

async function play(token: Token, targetToken?: Token, config: AnimationEffectConfig = {}) {
    const seq = await create(token, targetToken, config);
    if (seq) return seq.play();
    return null;
}

export const ricochetShot = {
    create,
    play,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('ricochetShot', 'template', 'eskie.effect.ricochetShot', DEFAULT_CONFIG, '0.0.1', 'Ricochet Shot');
