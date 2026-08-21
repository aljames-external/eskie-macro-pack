// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { autoanimations, CONCENTRATING } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'entangle',
    entangle: true,
    color: 'green',
    targets: undefined,
    template: undefined
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, entangle, color, targets, template } = mConfig;

    const portalEntry = Sequencer.Database.getEntry(closest('eskie.crosshair.rectangle.fantasy_01.white.full.20x20ft'));
    const portalPath = typeof portalEntry === 'string' ? portalEntry : (portalEntry?.file ?? portalEntry?.files?.[0]);
    const cfg = {
        radius: 20,
        max: 90,
        icon: portalPath,
        label: 'Entangle'
    };

    let [primary, secondary, center] = await templatelib.getPosition(template, cfg);
    if (!center && !primary) return;
    const targetPos = center ?? primary;

    const targetTokens = targets?.length ? targets : Array.from(game.user.targets);

    const seq = new Sequence();

    // Casting on token
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`eskie.casting.nature.01.side.loop.${color}`))
        .attachTo(token)
        .rotateTowards(targetPos)
        .scaleToObject(1.25, { considerTokenScale: true })
        .spriteOffset({ x: -0.25 }, { gridUnits: true })
        .duration(2000)
        .fadeOut(500);

    // Center casting ring
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`eskie.casting.nature.01.center.loop.${color}`))
        .atLocation(targetPos)
        .size(1, { gridUnits: true })
        .belowTokens()
        .duration(2000)
        .fadeOut(500)
        .zIndex(1.1);

    // Persistent area vines
    seq.effect()
        .delay(500)
        .name(`${id} - ${token.id}`)
        .file(closest('eskie.nature.vine.normal.circle.01.physical.green.radius_20ft'))
        .atLocation(targetPos)
        .scaleToObject(1.15)
        .persist()
        .belowTokens()
        .zIndex(1)
        .randomRotation();

    // Individual target vine restraints (isolated sequences to prevent compounding delay)
    if (entangle && targetTokens.length > 0) {
        for (const targetToken of targetTokens) {
            const targetSeq = new Sequence()
                .effect()
                .delay(1000)
                .name(`${id} - ${targetToken.id}`)
                .file(closest('eskie.nature.vine.normal.token.01.physical.green'))
                .attachTo(targetToken)
                .scaleToObject(1.3, { considerTokenScale: true })
                .persist();
            seq.addSequence(targetSeq);
        }
    }

    // Conjuration complete magic sign
    seq.effect()
        .name(`${id} - ${token.id}`)
        .atLocation(targetPos)
        .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_green'))
        .size(3.5, { gridUnits: true })
        .fadeIn(600)
        .opacity(1)
        .rotateIn(180, 600, { ease: 'easeOutCubic' })
        .scaleIn(0, 600, { ease: 'easeOutCubic' })
        .belowTokens()
        .fadeOut(500)
        .duration(3000);

    // Persistent faded ground rune
    seq.effect()
        .name(`${id} - ${token.id}`)
        .atLocation(targetPos)
        .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_green'))
        .size(3.5, { gridUnits: true })
        .fadeIn(600, { delay: 2500 })
        .opacity(0.5)
        .rotateIn(180, 600, { ease: 'easeOutCubic' })
        .scaleIn(0, 600, { ease: 'easeOutCubic' })
        .persist()
        .belowTokens()
        .filter('ColorMatrix', { brightness: 0 });

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const entangle = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('entangle', 'template', 'eskie.effect.entangle', DEFAULT_CONFIG, '0.0.0', 'Entangle');
autoanimations.register(CONCENTRATING('entangle', 'Entangle'), 'effect', 'eskie.effect.entangle', DEFAULT_CONFIG);

