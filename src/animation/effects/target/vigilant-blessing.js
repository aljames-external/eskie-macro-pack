// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'vigilantBlessing',
    darkMap: true
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, darkMap } = mConfig;

    const recipient = target ?? token;
    if (!recipient) return;

    const label = `${id} - ${recipient.id}`;
    const seq = new Sequence();

    if (darkMap && canvas?.scene?.background?.src) {
        seq.effect()
            .name(label)
            .file(closest(canvas.scene.background.src))
            .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .fadeIn(750)
            .fadeOut(750)
            .duration(4000)
            .filter('ColorMatrix', { brightness: 0 })
            .belowTokens()
            .opacity(0.5)
            .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY });
    }

    seq.effect()
        .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
        .attachTo(recipient, { offset: { y: -0.5 * recipient.document.width }, gridUnits: true })
        .scaleToObject(1.25, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
        .rotate(180)
        .zIndex(2);

    seq.effect()
        .delay(1000)
        .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
        .attachTo(recipient)
        .scaleToObject(2.2, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .startTime(1000)
        .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
        .zIndex(1);

    seq.effect()
        .delay(1000)
        .file(closest('jb2a.twinkling_stars.points08.white'))
        .attachTo(recipient, { offset: { y: -0.5 * recipient.document.width }, gridUnits: true })
        .scaleToObject(0.65, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .duration(3500)
        .fadeOut(1000)
        .zIndex(1);

    seq.wait(1100);

    const starOffsets = [
        { x: -0.25, y: 0.25 },
        { x: 0.25, y: 0.25 },
        { x: -0.25, y: -0.25 },
        { x: 0.25, y: -0.25 }
    ];

    starOffsets.forEach((offset, idx) => {
        seq.effect()
            .delay(idx * 150)
            .file(closest('eskie.star.twinkling_star.01.white'))
            .attachTo(recipient, { offset, randomOffset: 0.3, gridUnits: true })
            .scaleToObject(0.55, { considerTokenScale: true })
            .zIndex(1)
            .randomizeMirrorX()
            .randomizeMirrorY();
    });

    seq.effect()
        .file(closest('eskie.buff.one_shot.simple.blue'))
        .attachTo(recipient)
        .scaleToObject(1, { considerTokenScale: true })
        .filter('ColorMatrix', { saturate: -1, brightness: 2 });

    seq.effect()
        .file(closest('eskie.symbol.constellation.symbol_only.01.sun.white'))
        .atLocation(recipient)
        .scaleToObject(2, { considerTokenScale: true })
        .fadeIn(1000)
        .filter('ColorMatrix', { brightness: 0 })
        .opacity(0.5)
        .duration(4500)
        .fadeOut(1000)
        .belowTokens()
        .zIndex(0);

    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) return seq.play();
}

async function createEffect(token, config = {}) {
    return create(token, token, config);
}

async function playEffect(token, config = {}) {
    const seq = await createEffect(token, config);
    if (seq) return seq.play();
}

async function stop(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    const recipient = target ?? token;
    if (recipient) Sequencer.EffectManager.endEffects({ name: `${id} - ${recipient.id}`, object: recipient });
}

export const vigilantBlessing = {
    create,
    play,
    stop,
    target: {
        create,
        play,
        default_config: DEFAULT_CONFIG
    },
    effect: {
        create: createEffect,
        play: playEffect,
        default_config: DEFAULT_CONFIG
    },
    default_config: DEFAULT_CONFIG
};

autoanimations.register('vigilantBlessing', 'ranged-target', 'eskie.effect.vigilantBlessing.target', DEFAULT_CONFIG, '0.0.0', 'Vigilant Blessing');
autoanimations.register('vigilantBlessing', 'effect', 'eskie.effect.vigilantBlessing.effect', DEFAULT_CONFIG, '0.0.0', 'Vigilant Blessing');



