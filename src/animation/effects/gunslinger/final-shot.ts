import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { settingsOverride } from '../../../lib/settings.js';

// Author: bakanabaka
// Gunslinger: Final Shot (Sequencer 4.3.0+ .motion() Animation)

const DEFAULT_CONFIG: AnimationEffectConfig = {
    id: 'finalShot',
    label: 'Final Shot',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, targetToken?: Token, config: AnimationEffectConfig = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { template, sound } = mConfig;

    const trg = targetToken ?? Array.from(game.user?.targets ?? [])[0];
    let targetPos = trg ? adapter.getCenter(trg) : mConfig.position;
    if (!targetPos) {
        const crosshairCfg = {
            radius: 1,
            icon: 'icons/weapons/guns/revolver-fire-yellow.webp',
            label: 'Final Shot'
        };
        const [primary, secondary, center] = await templatelib.getPosition(template, crosshairCfg);
        targetPos = center ?? primary;
    }
    if (!targetPos) return null;

    const tokenPlaceable = (adapter.getPlaceable(token as any) ?? (token as any)?.object ?? token) as Token;
    if (!tokenPlaceable) return null;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Caster weapon recoil via Sequencer 4.3.0+ .motion()
    sequence.motion(tokenPlaceable)
        .moveBy({ x: -15, y: 0 }, { duration: 150, ease: 'easeOutQuad' })
        .moveBy({ x: 15, y: 0 }, { duration: 150, ease: 'easeInQuad' });

    // Muzzle flash at caster position
    sequence.effect()
        .file(closest('jb2a.disintegrate.orange'))
        .atLocation(token)
        .stretchTo(trg ?? targetPos)
        .playbackRate(1.8)
        .opacity(0.9);

    // Target impact flash
    let impactFx = sequence.effect()
        .delay(200)
        .file(closest('jb2a.impact.fire.orange'));

    if (trg) {
        impactFx.atLocation(trg).scaleToObject(1.5, { considerTokenScale: true });
    } else {
        impactFx.atLocation(targetPos).size(1.5, { gridUnits: true });
    }

    return sequence;
}

async function play(token: Token, targetToken?: Token, config: AnimationEffectConfig = {}) {
    const seq = await create(token, targetToken, config);
    if (seq) return seq.play();
    return null;
}

export const finalShot = {
    create,
    play,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('finalShot', 'template', 'eskie.effect.finalShot', DEFAULT_CONFIG, '0.0.1', 'Final Shot');
