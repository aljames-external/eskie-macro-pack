// Original Author: .eskie
// Modular Conversion & .motion() Update: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'lungingAttack',
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    color: 'blue',
    tint: '#01aafe',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { type, weight, color, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = ({ light: 0, medium: 1, heavy: 2 } as Record<string, number>)[weight] ?? 1;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target);
    if (!targetSquare) return;

    const src = adapter.getCenter(token);
    const tgt = adapter.getCenter(target);

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Dynamic motion shadow under lunging token
    sequence.effect()
        .copySprite(token)
        .attachTo(token)
        .scaleToObject(0.9, { considerTokenScale: true })
        .belowTokens()
        .filter('ColorMatrix', { brightness: 0 })
        .filter('Blur', { blurX: 5, blurY: 10 })
        .opacity(0.65)
        .fadeOut(500)
        .duration(1500);

    // Battlemaster lunging attack motion toward target via Sequencer 4.3.0+ sequence.motion(token)
    sequence.motion(token)
        .rotateTowards(target)
        .moveTo(targetSquare, {
            duration: 1500,
            ease: 'easeOutCubic'
        });

    sequence.wait(400);

    sequence.effect()
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.02`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * tokenWidth + 0.75 }, { gridUnits: true })
        .mirrorY(src.x >= tgt.x)
        .zIndex(2);

    sequence.effect()
        .delay(150)
        .file(closest(`eskie.damage.${type}.01.yellow`))
        .size(1.25 * tokenWidth, { gridUnits: true })
        .atLocation(targetSquare)
        .randomRotation()
        .zIndex(0.1);

    sequence.effect()
        .delay(150)
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .opacity(0.25)
        .duration(1000)
        .fadeOut(750);

    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const lungingAttack = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('lungingAttack', 'melee-target', 'eskie.effect.battlemaster.lungingAttack', DEFAULT_CONFIG, '0.0.1', 'Lunging Attack');

