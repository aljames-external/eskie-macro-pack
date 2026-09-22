// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'banishingArrow',
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
            .file(closest('eskie.casting.physical.03.side.one_shot.purple'))
            .attachTo(token)
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(2)
            .waitUntilFinished(-1250)

        .motion(target)
            .scaleTo(0, { duration: 500 })
            .rotateBy(360, { duration: 500 })

        .effect()
            .file(closest('eskie.attack.ranged.arrow.01.physical.medium.purple.slow'))
            .atLocation(token)
            .stretchTo(target)
            .zIndex(2)
            .waitUntilFinished(-750)

        .effect()
            .file(closest('eskie.damage.piercing.01.red'))
            .attachTo(target, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(1.5, { considerTokenScale: true })
            .filter('ColorMatrix', { hue: -75 })
            .zIndex(1)

        .effect()
            .file(closest('jb2a.portals.horizontal.vortex.purple'))
            .attachTo(target, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(0.25, { considerTokenScale: true })
            .fadeIn(250)
            .scaleIn(0, 250, { ease: 'easeOutBack' })
            .scaleOut(0, 900, { ease: 'easeInSine' })
            .duration(1150)

        .effect()
            .delay(250)
            .file(closest('jb2a.cast_generic.02.dark_purple'))
            .attachTo(target, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(1)

        .effect()
            .file(closest('jb2a.energy_strands.in.purple.01'))
            .attachTo(target, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(1.5, { considerTokenScale: true })
            .playbackRate(2)
            .scaleOut(0, 1000, { ease: 'easeInSine' })
            .fadeOut(250)

        .effect()
            .delay(1000)
            .file(closest('eskie.star.02.purple'))
            .attachTo(target, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(0.8, { considerTokenScale: true })
            .zIndex(2)

        .effect()
            .name(`${target.name} Banishing Arrow`)
            .file(closest('jb2a.extras.tmfx.outflow.circle.04'))
            .attachTo(target, { bindVisibility: false, bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .rotateIn(-360, 500, { ease: 'easeOutCubic' })
            .scaleIn(0, 600, { ease: 'easeInOutCirc' })
            .fadeOut(1000)
            .opacity(1)
            .belowTokens()
            .persist()
            .filter('ColorMatrix', { brightness: -1 });

    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token: Token, target: Token, config: any = {}) {
    Sequencer.EffectManager.endEffects({ name: `${target.name} Banishing Arrow`, object: target });
    await new Sequence()
        .motion(target)
        .scaleTo(1)
        .play();
}

export const banishingArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('banishingArrow', 'ranged-target', 'eskie.effect.arcaneShot.banishingArrow', DEFAULT_CONFIG, '0.0.1', 'Banishing Arrow');
