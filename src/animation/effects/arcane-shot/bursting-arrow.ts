// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'burstingArrow',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target?: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    const trg = target ?? Array.from(game.user?.targets ?? [])[0];
    if (!token || !trg) return;

    const sequence = new Sequence();
    applySound(sequence, sound);

    const targetWidth = adapter.getTokenDimensions(trg).widthUnits;

    sequence
        .effect()
            .file(closest('eskie.casting.physical.03.side.one_shot.white'))
            .attachTo(token)
            .rotateTowards(trg)
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(2)
            .waitUntilFinished(-750)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.01.physical.medium.white.slow'))
            .atLocation(token)
            .stretchTo(trg)
            .loopProperty('sprite', 'position.y', { from: -0.05, to: 0.05, duration: 50, gridUnits: true, pingPong: true })
            .opacity(0.5)
            .zIndex(3)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.01.physical.medium.white.slow'))
            .atLocation(token)
            .stretchTo(trg)
            .zIndex(2)
            .waitUntilFinished(-750)

        .canvasPan()
            .delay(200)
            .shake({ duration: 500, strength: 4, rotation: false, fadeOut: 500 })

        .effect()
            .file(closest('jb2a.explosion.04.blue'))
            .atLocation(trg)
            .size(3.5 + targetWidth, { gridUnits: true })
            .opacity(0.75)
            .filter('ColorMatrix', { saturate: -1 })

        .effect()
            .delay(200)
            .file(closest('jb2a.extras.tmfx.border.circle.outpulse.01.fast'))
            .atLocation(trg)
            .size(3.75 + targetWidth, { gridUnits: true })
            .opacity(0.5)
            .belowTokens()
            .filter('ColorMatrix', { saturate: -1 })
            .zIndex(1)

        .effect()
            .delay(200)
            .file(closest('jb2a.impact.ground_crack.still_frame.01'))
            .atLocation(trg)
            .size(4 + targetWidth, { gridUnits: true })
            .fadeIn(250)
            .fadeOut(1000)
            .duration(2500)
            .opacity(0.75)
            .belowTokens();

    const hitTargets = (mConfig.targets?.length ? mConfig.targets : [trg]);
    for (const t of hitTargets) {
        const targetSeq = new Sequence()
            .motion(t)
                .noise({ strength: 0.05, frequency: 50, duration: 1000, gridUnits: true })
            .effect()
                .file(closest('eskie.damage.force.01.white'))
                .attachTo(t, { bindAlpha: false, bindVisibility: false })
                .scaleToObject(1.5, { considerTokenScale: true })
                .zIndex(1);

        sequence.addSequence(targetSeq);
    }

    return sequence;
}

async function play(token: Token, target?: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop(token: Token, target: Token, config: any = {}) {
    // Transient sequence effects
}

export const burstingArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('burstingArrow', 'ranged-target', 'eskie.effect.arcaneShot.burstingArrow', DEFAULT_CONFIG, '0.0.1', 'Bursting Arrow');
