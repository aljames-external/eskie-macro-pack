// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'parry',
    slowParry: false,
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: Record<string, any> = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { slowParry, type, weight, color, sound } = mConfig;

    if (!token || !target) return null;

    const src = adapter.getCenter(token);
    const tgtCenter = adapter.getCenter(target);

    const baseRad = Math.atan2(tgtCenter.y - src.y, tgtCenter.x - src.x);

    const recoilX = -Math.cos(baseRad) * 0.6;
    const recoilY = -Math.sin(baseRad) * 0.6;
    const returnX = Math.cos(baseRad) * 0.6;
    const returnY = Math.sin(baseRad) * 0.6;

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Parry recoil block using Sequencer 4.3.0+ sequence.motion(token).moveBy() API
    sequence.motion(token)
        .moveBy({ x: recoilX, y: recoilY }, { duration: 250, ease: 'easeOutCubic', delay: 100, gridUnits: true })
        .moveBy({ x: returnX, y: returnY }, { duration: 400, ease: 'easeOutSine', delay: 450, gridUnits: true });

    if (!slowParry) {
        sequence
            .effect()
                .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`))
                .atLocation(token)
                .rotateTowards(target)
                .scaleToObject(2, { considerTokenScale: true })
                .spriteOffset({ x: -1.675 * tokenWidth }, { gridUnits: true })
                .randomizeMirrorY()
                .zIndex(1)

            .effect()
                .file(closest('eskie.particle.05.orange'))
                .atLocation(token)
                .scaleToObject(2, { considerTokenScale: true })
                .randomRotation()
                .zIndex(1.1);
    } else {
        sequence
            .effect()
                .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow.01`))
                .atLocation(token)
                .rotateTowards(target)
                .scaleToObject(2, { considerTokenScale: true })
                .spriteOffset({ x: -1.675 * tokenWidth }, { gridUnits: true })
                .randomizeMirrorY()
                .zIndex(1)

            .effect()
                .file(closest('eskie.particle.07.orange'))
                .atLocation(token)
                .rotateTowards(target)
                .scaleToObject(1.5, { considerTokenScale: true })
                .zIndex(1.1)
                .spriteOffset({ x: -1.25 * tokenWidth }, { gridUnits: true });
    }

    return sequence;
}

async function play(token: Token, target: Token, config: Record<string, any> = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play({ preload: true });
    return null;
}

function stop() {
    // Transient animation
}

export const parry = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('parry', 'melee-target', 'eskie.effect.battlemaster.parry', DEFAULT_CONFIG, '0.0.2', 'Parry');
