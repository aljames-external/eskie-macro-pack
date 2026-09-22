// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'graspingArrow',
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

    sequence
        .effect()
            .file(closest('eskie.casting.physical.03.side.one_shot.green'))
            .attachTo(token)
            .rotateTowards(trg)
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(2)
            .waitUntilFinished(-750)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.01.physical.medium.green.normal'))
            .atLocation(token)
            .stretchTo(trg)
            .zIndex(2)
            .waitUntilFinished(-750)

        .motion(trg)
            .noise({ strength: 0.05, frequency: 50, duration: 1000, gridUnits: true })

        .effect()
            .file(closest('eskie.damage.poison.01.green'))
            .attachTo(trg, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(0.95, { considerTokenScale: true })
            .zIndex(1)

        .effect()
            .file(closest('eskie.nature.vine.normal.01.physical.green'))
            .atLocation(trg)
            .scaleToObject(1.25, { considerTokenScale: true })
            .zIndex(3)

        .effect()
            .name(`Grasping Arrow ${trg.name}`)
            .file(closest('jb2a.plant_growth.04.ring.4x4.pulse.greenwhite'))
            .attachTo(trg)
            .scaleToObject(1.25, { considerTokenScale: true })
            .zIndex(1)
            .filter('ColorMatrix', { saturate: 0, hue: -20 })

        .wait(250)

        .effect()
            .name(`Grasping Arrow ${trg.name}`)
            .file(closest('eskie.nature.vine.normal.circle.01.physical.green.radius_20ft'))
            .attachTo(trg)
            .scaleToObject(1.95, { considerTokenScale: true })
            .randomRotation()
            .zIndex(1)
            .persist()
            .mask()

        .effect()
            .name(`Grasping Arrow ${trg.name}`)
            .file(closest('eskie.nature.vine.normal.circle.01.physical.green.radius_10ft'))
            .attachTo(trg)
            .scaleToObject(1.45, { considerTokenScale: true })
            .randomRotation()
            .zIndex(1)
            .persist()
            .belowTokens();

    return sequence;
}

async function play(token: Token, target?: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token: Token, target: Token, config: any = {}) {
    Sequencer.EffectManager.endEffects({ name: `Grasping Arrow ${target.name}`, object: target });
}

export const graspingArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('graspingArrow', 'ranged-target', 'eskie.effect.arcaneShot.graspingArrow', DEFAULT_CONFIG, '0.0.1', 'Grasping Arrow');
