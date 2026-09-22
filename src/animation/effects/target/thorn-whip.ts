// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { adapter } from '../../../adapters/index.js';

const DEFAULT_CONFIG = {
    id: 'thornWhip',
    color: 'green',
    timingAdjust: -100,
    pull: true,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, target: Token, config: Record<string, any> = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, timingAdjust, pull, sound } = mConfig;

    if (!token || !target) return null;

    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const dx = tokenCenter.x - targetCenter.x;
    const dy = tokenCenter.y - targetCenter.y;
    const distance = Math.hypot(dx, dy);

    const gridSize = adapter.getGridSize();
    const pullDistance = gridSize * 2; // 10ft
    const adjacentDistance = gridSize; // 5ft
    const maxAllowedPull = Math.max(0, distance - adjacentDistance);
    const moveDistance = Math.min(pullDistance, maxAllowedPull);

    const rawLocation = {
        x: targetCenter.x + (distance > 0 ? (dx / distance) * moveDistance : 0),
        y: targetCenter.y + (distance > 0 ? (dy / distance) * moveDistance : 0)
    };

    const location = adapter.getCenterPoint(rawLocation);
    const { widthUnits: targetWidth } = adapter.getTokenDimensions(target);
    const canPull = pull && (targetWidth <= 2);

    const seq = new Sequence();
    applySound(seq, sound);

    // Nature casting on source token
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`eskie.casting.nature.01.side.one_shot.${color}`))
        .attachTo(token)
        .rotateTowards(target)
        .playbackRate(1.25)
        .scaleToObject(1, { considerTokenScale: true });

    // Thorny vine stretching from token to target
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest('eskie.nature.vine.thorny.ranged.01.physical.normal.green'))
        .attachTo(token)
        .stretchTo(target)
        .zIndex(2)
        .waitUntilFinished(-1000);

    // Damage Effect
    seq.effect()
        .file(closest('eskie.damage.piercing.01.yellow'))
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(1)
        .randomRotation();

    if (canPull) {
        // Pull target token towards caster using Sequencer 4.3.0+ sequence.motion(target).moveTo()
        seq.motion(target)
            .moveTo(location, { rotate: false, ease: 'easeInCubic', delay: Math.max(0, 101 + timingAdjust) })
            .duration(500);
    }

    return seq;
}

async function play(token: Token, target: Token, config: Record<string, any> = {}) {
    const seq = await create(token, target, config);
    if (seq) return seq.play();
    return null;
}

async function stop(token: Token, target?: Token, config: Record<string, any> = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const thornWhip = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('thornWhip', 'ranged-target', 'eskie.effect.thornWhip', DEFAULT_CONFIG, '0.0.2', 'Thorn Whip');


