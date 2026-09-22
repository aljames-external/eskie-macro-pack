// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'pushingAttack',
    pushDistance: 15,
    type: 'bludgeoning', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'heavy', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: Record<string, any> = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { pushDistance, type, weight, color, sound } = mConfig;

    if (!token || !target) return null;

    const weightIndex = ({ light: 0, medium: 1, heavy: 2 } as Record<string, number>)[weight] ?? 2;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target);
    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const gridSize = adapter.getGridSize();

    const position = {
        x: targetCenter.x - (gridSize * (pushDistance / 5) * Math.sign(tokenCenter.x - targetCenter.x)),
        y: targetCenter.y - (gridSize * (pushDistance / 5) * Math.sign(tokenCenter.y - targetCenter.y)),
    };

    const backposition = {
        x: (targetCenter.x - tokenCenter.x) * -0.1,
        y: (targetCenter.y - tokenCenter.y) * -0.1,
    };

    const distanceX = Math.abs(tokenCenter.x - targetCenter.x);
    const distanceY = Math.abs(tokenCenter.y - targetCenter.y);

    if (distanceY < distanceX) {
        position.y = targetCenter.y;
        backposition.y = 0;
    } else if (distanceX < distanceY) {
        position.x = targetCenter.x;
        backposition.x = 0;
    }

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Attacker thrust motion using Sequencer 4.3.0+ .motion()
    sequence.animation()
        .on(token)
        .motion({
            recoil: -0.2,
            duration: 450,
            ease: 'easeOutExpo'
        });

    sequence.effect()
        .file(closest('eskie.smoke.02.white'))
        .atLocation({ x: tokenCenter.x - backposition.x, y: tokenCenter.y - backposition.y })
        .rotateTowards(target)
        .size(tokenWidth * 2.15, { gridUnits: true })
        .spriteOffset({ x: -1.5 }, { gridUnits: true })
        .spriteRotation(180)
        .belowTokens()
        .delay(150);

    sequence.canvasPan()
        .delay(250)
        .shake({ duration: 250, strength: 2, rotation: false });

    sequence.effect()
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
        .randomizeMirrorY()
        .zIndex(1)
        .delay(1000);

    sequence.effect()
        .file(closest('jb2a.gust_of_wind.veryfast'))
        .atLocation(token)
        .stretchTo(position, { onlyX: true })
        .opacity(0.75)
        .belowTokens()
        .fadeOut(1000)
        .delay(1500);

    sequence.effect()
        .delay(1000)
        .file(closest('eskie.trail.token.generic.01.white'))
        .atLocation(token)
        .rotateTowards(position)
        .scaleToObject(1.5, { considerTokenScale: true })
        .startTime(750)
        .spriteOffset({ x: -1.25 }, { gridUnits: true });

    sequence.wait(1000);

    sequence.effect()
        .file(closest(`eskie.damage.${type}.01.yellow`))
        .atLocation(target)
        .size(tokenWidth * 1.5, { gridUnits: true })
        .zIndex(1);

    sequence.wait(250);

    // Target knockback push using Sequencer 4.3.0+ sequence.motion(target).moveBy() API
    sequence.motion(target)
        .moveBy(position, { ease: 'easeOutCirc' });

    return sequence;
}

async function play(token: Token, target: Token, config: Record<string, any> = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
    return null;
}

function stop() {
    // Transient animation
}

export const pushingAttack = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('pushingAttack', 'melee-target', 'eskie.effect.battlemaster.pushingAttack', DEFAULT_CONFIG, '0.0.2', 'Pushing Attack');

