// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'goodberry',
    color: 'green'
};

async function createCast(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, color } = mConfig;

    const seq = new Sequence();

    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`eskie.casting.nature.01.center.one_shot.${color}`))
        .attachTo(token)
        .scaleToObject(0.8, { considerTokenScale: true });

    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest('blfx.misc.nature.goodberry.1.color1'))
        .attachTo(token)
        .scaleToObject(1.2, { considerTokenScale: true })
        .zIndex(1)
        .duration(1500)
        .scaleOut(0, 250, { ease: 'easeOutCubic' })
        .waitUntilFinished(-250);

    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`jb2a.impact.002.${color}`))
        .attachTo(token)
        .scaleToObject(0.65, { considerTokenScale: true })
        .zIndex(2);

    return seq;
}

async function playCast(token, config = {}) {
    const seq = await createCast(token, config);
    if (seq) return seq.play();
}

async function createUse(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, color } = mConfig;

    const seq = new Sequence();

    seq.effect()
        .name(`${id}Use - ${token.id}`)
        .file(closest('blfx.misc.nature.goodberry.1.color1'))
        .attachTo(token)
        .scaleToObject(1.2, { considerTokenScale: true })
        .startTime(1000)
        .duration(2000)
        .fadeIn(300)
        .scaleOut(0, 250, { ease: 'easeOutCubic' })
        .animateProperty('sprite', 'position.y', { from: 0.25, to: 0, duration: 300, gridUnits: true, ease: 'easeOutCubic' })
        .loopProperty('sprite', 'position.y', { from: 0.05, to: 0, duration: 150, gridUnits: true, ease: 'easeOutCubic', delay: 300 })
        .zIndex(1)
        .waitUntilFinished(-250);

    seq.effect()
        .name(`${id}Use - ${token.id}`)
        .file(closest(`jb2a.impact.002.${color}`))
        .attachTo(token)
        .scaleToObject(0.6, { considerTokenScale: true })
        .zIndex(2);

    seq.effect()
        .name(`${id}Use - ${token.id}`)
        .file(closest(`eskie.particle.01.one_shot.${color}`))
        .attachTo(token)
        .scaleToObject(0.75, { considerTokenScale: true })
        .zIndex(2);

    seq.effect()
        .name(`${id}Use - ${token.id}`)
        .file(closest(`eskie.buff.one_shot.health.${color}`))
        .attachTo(token)
        .scaleToObject(1, { considerTokenScale: true });

    seq.effect()
        .name(`${id}Use - ${token.id}`)
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .attachTo(token)
        .belowTokens()
        .scaleToObject(1, { considerTokenScale: true })
        .filter('Glow', { color: '#6ee91c', distance: 10, outerStrength: 4, innerStrength: 0, knockout: true })
        .fadeIn(250)
        .fadeOut(750)
        .duration(1000);

    return seq;
}

async function playUse(token, config = {}) {
    const seq = await createUse(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
    Sequencer.EffectManager.endEffects({ name: `${id}Use - ${token.id}` });
}

export const goodberry = {
    create: createCast,
    play: playCast,
    cast: {
        create: createCast,
        play: playCast,
        default_config: DEFAULT_CONFIG
    },
    use: {
        create: createUse,
        play: playUse,
        default_config: DEFAULT_CONFIG
    },
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('goodberry', 'token', 'eskie.effect.goodberry.cast', DEFAULT_CONFIG, '0.0.0', 'Goodberry');
autoanimations.register('goodberryUse', 'token', 'eskie.effect.goodberry.use', DEFAULT_CONFIG, '0.0.0', 'Goodberry (Use)');
autoanimations.register('goodberry', 'effect', 'eskie.effect.goodberry.use', DEFAULT_CONFIG, '0.0.0', 'Goodberry');

