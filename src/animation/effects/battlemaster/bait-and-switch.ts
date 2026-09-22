// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'baitAndSwitch',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target?: Token, config: Record<string, any> = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    const trg = target ?? Array.from(game.user?.targets ?? [])[0];
    if (!token || !trg) return;

    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(trg);

    let blurDirectionX = 0;
    let blurDirectionY = 0;
    if (token.x === trg.x) blurDirectionY = 15;
    if (token.y === trg.y) blurDirectionX = 20;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Target position swap motion via Sequencer 4.3.0+ sequence.motion(trg)
    sequence.motion(trg)
        .moveTo(tokenCenter, { duration: 1000, rotate: false, ease: 'easeInBack', delay: 250 });

    // Token position swap motion via Sequencer 4.3.0+ sequence.motion(token)
    sequence.motion(token)
        .moveTo(targetCenter, { duration: 1250, rotate: false, ease: 'easeOutCubic', delay: 500 });

    sequence.effect()
        .copySprite(token)
        .scaleToObject(1, { considerTokenScale: true })
        .moveTowards(targetCenter, { rotate: false, ease: 'easeOutCubic', delay: 500 })
        .moveSpeed(300)
        .duration(1250)
        .opacity(0.85)
        .fadeIn(50, { delay: 500 })
        .fadeOut(500, { ease: 'easeOutQuint' })
        .filter('Blur', { blurX: blurDirectionX, blurY: blurDirectionY })
        .zIndex(0.1);

    sequence.effect()
        .file(closest('eskie.smoke.01.white'))
        .atLocation(targetCenter)
        .rotateTowards(tokenCenter)
        .scaleToObject(1.5, { considerTokenScale: true })
        .belowTokens()
        .delay(750)
        .opacity(0.4)
        .spriteOffset({ x: -0.5 }, { gridUnits: true })
        .mirrorX()
        .spriteRotation(180);

    return sequence;
}

async function play(token: Token, target: Token, config: Record<string, any> = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const baitAndSwitch = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('baitAndSwitch', 'melee-target', 'eskie.effect.battlemaster.baitAndSwitch', DEFAULT_CONFIG, '0.0.2', 'Bait and Switch');
