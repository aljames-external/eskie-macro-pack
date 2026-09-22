// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'beguilingArrow',
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
            .filter('ColorMatrix', { hue: 35, brightness: 1 })
            .waitUntilFinished(-750)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.01.physical.medium.purple.slow'))
            .atLocation(token)
            .stretchTo(target, { attachTo: false })
            .zIndex(2)
            .filter('ColorMatrix', { hue: 35, brightness: 1 })
            .waitUntilFinished(-750)

        .motion(target)
            .noise()
            .duration(1000)

        .effect()
            .file(closest('jb2a.impact_themed.heart.02.pink'))
            .attachTo(target)
            .scaleToObject(1.25, { considerTokenScale: true })
            .zIndex(1)

        .effect()
            .file(closest('eskie.damage.psychic.01.pink'))
            .attachTo(target, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(1.5, { considerTokenScale: true })
            .zIndex(1)

        .effect()
            .copySprite(target)
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .fadeIn(500)
            .duration(8750)
            .fadeOut(1000)
            .opacity(0.75)
            .rotate(0)
            .belowTokens()
            .filter('Glow', { color: 0xfd5dbb, distance: 10, outerStrength: 4, innerStrength: 0 })
            .filter('ColorMatrix', { saturate: -0.2, brightness: 1.2 })

        .effect()
            .file(closest('jb2a.template_circle.symbol.out_flow.heart.pink'))
            .attachTo(target)
            .scaleToObject(1.75, { considerTokenScale: true })
            .fadeIn(500)
            .duration(8750)
            .belowTokens()
            .fadeOut(1000)

        .effect()
            .file(closest('jb2a.extras.tmfx.border.circle.outpulse.01.fast'))
            .attachTo(target)
            .scaleToObject(0.95, { considerTokenScale: true })
            .fadeIn(500)
            .duration(8750)
            .fadeOut(1000)
            .playbackRate(1.25)
            .tint('#fd5dbb')
            .zIndex(1);

    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop(token: Token, target: Token, config: any = {}) {
    // Transient timed sequence effects
}

export const beguilingArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('beguilingArrow', 'ranged-target', 'eskie.effect.arcaneShot.beguilingArrow', DEFAULT_CONFIG, '0.0.1', 'Beguiling Arrow');
