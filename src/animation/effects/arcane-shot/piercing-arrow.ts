// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'piercingArrow',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: any = {}) {
    const rawConfig = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, rawConfig);
    const { sound, template } = mConfig;

    const crosshairConfig = {
        type: 'ray',
        distance: 30,
        width: 5,
        icon: token.document.texture.src ?? '',
        label: 'Piercing Arrow',
        location: { obj: token, lockToEdge: true },
    };

    const [primary, secondary, center] = await templatelib.getPosition(template, crosshairConfig);
    if (!primary && !center) return null;
    const position = center ?? primary;

    const sequence = new Sequence();
    applySound(sequence, sound);

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    sequence
        .effect()
            .file(closest('eskie.velocity.02.white'))
            .atLocation(token)
            .rotateTowards(position)
            .size(tokenWidth * 2, { gridUnits: true })
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .tint('#ecc432')
            .opacity(0.85)
            .fadeIn(500)

        .effect()
            .file(closest('jb2a.energy_strands.in.green.01'))
            .atLocation(token)
            .rotateTowards(position)
            .size(tokenWidth * 2, { gridUnits: true })
            .spriteScale({ x: 0.75 })
            .spriteOffset({ x: -0.3 }, { gridUnits: true })
            .playbackRate(1.5)
            .waitUntilFinished()

        .effect()
            .file(closest('eskie.star.02.yellow'))
            .atLocation(token)
            .rotateTowards(position)
            .scaleToObject(1, { considerTokenScale: true })
            .spriteOffset({ x: -0.1 }, { gridUnits: true })

        .wait(250)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.ray.physical.green'))
            .atLocation(token)
            .stretchTo(position)
            .scale(2)
            .zIndex(2);

    const hitTargets = mConfig.targets?.length
        ? mConfig.targets
        : (Array.from(game.user?.targets ?? []));

    for (let i = 0; i < hitTargets.length; i++) {
        const t = hitTargets[i];
        const targetSeq = new Sequence()
            .wait(1 + i * 50)
            .motion(t)
                .noise({ strength: 0.05, frequency: 50, duration: 1000, gridUnits: true })
            .effect()
                .file(closest('eskie.damage.piercing.01.yellow'))
                .attachTo(t, { bindAlpha: false, bindVisibility: false })
                .scaleToObject(1.5, { considerTokenScale: true })
                .zIndex(1);

        sequence.addSequence(targetSeq);
    }

    return sequence;
}

async function play(token: Token, config: any = {}) {
    const sequence = await create(token, config);
    if (sequence) return sequence.play();
}

function stop() {
    Sequencer.EffectManager.endEffects({ name: 'Ray Crosshair' });
}

export const piercingArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('piercingArrow', 'template', 'eskie.effect.arcaneShot.piercingArrow', DEFAULT_CONFIG, '0.0.1', 'Piercing Arrow');
