// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'enfeeblingArrow',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    if (!target) return;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .file(closest('eskie.casting.physical.03.side.one_shot.green'))
            .attachTo(token)
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(2)
            .filter('ColorMatrix', { hue: 50, brightness: 1 })
            .waitUntilFinished(-750)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.01.physical.medium.green.normal'))
            .atLocation(token)
            .stretchTo(target)
            .zIndex(2)
            .filter('ColorMatrix', { hue: 50, brightness: 1 })
            .waitUntilFinished(-750)

        .motion(target)
            .noise()
            .duration(1000)

        .effect()
            .file(closest('eskie.damage.necrotic.01.teal'))
            .attachTo(target, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(1.5, { considerTokenScale: true })
            .zIndex(1)

        .effect()
            .file(closest('jb2a.misty_step.02.blue'))
            .atLocation(target)
            .scaleToObject(1.75, { considerTokenScale: true })
            .startTime(1500)
            .filter('ColorMatrix', { hue: -75 })
            .belowTokens()
            .zIndex(2)

        .effect()
            .name(`${target.name} Enfeebling Arrow`)
            .file(closest('eskie.poison.token_mask.01.teal.full'))
            .attachTo(target)
            .scaleToObject(0.95, { considerTokenScale: true })
            .fadeIn(1000)
            .fadeOut(1000)
            .persist()
            .mask(target)
            .zIndex(0)

        .effect()
            .file(closest('jb2a.extras.tmfx.inflow.circle.01'))
            .attachTo(target)
            .scaleToObject(1.65, { considerTokenScale: true })
            .fadeIn(500)
            .duration(10000)
            .fadeOut(1000)
            .opacity(0.75)
            .mask()
            .playbackRate(0.75)
            .tint('#51e692')
            .zIndex(1);

    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token: Token, target: Token, config: any = {}) {
    Sequencer.EffectManager.endEffects({ name: `${target.name} Enfeebling Arrow`, object: target });
}

export const enfeeblingArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('enfeeblingArrow', 'ranged-target', 'eskie.effect.arcaneShot.enfeeblingArrow', DEFAULT_CONFIG, '0.0.1', 'Enfeebling Arrow');
