// Original Author: .eskie / EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'faerieFire',
    color: 'green', // 'blue', 'green', 'purple'
    aoeDistance: 10,
    glow: true
};

function getTintAndHue(color) {
    switch (color) {
        case 'blue':
            return { tintColor: '0x2eb9dc', hue: '100', hue2: '0' };
        case 'green':
            return { tintColor: '0xd3eb6a', hue: '45', hue2: '-35' };
        case 'purple':
            return { tintColor: '0xcb40f2', hue: '250', hue2: '0' };
        default:
            return { tintColor: '0xd3eb6a', hue: '45', hue2: '-35' };
    }
}

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const seq = await createCloud(token, mConfig);
    const { targets } = mConfig;

    if (targets?.length) {
        for (const target of targets) {
            seq.addSequence(await createEffect(target, mConfig));
        }
    }
    return seq;
}

async function createCloud(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, template, color } = mConfig;
    const { tintColor, hue, hue2 } = getTintAndHue(color);

    const portalEntry = Sequencer.Database.getEntry(closest('eskie.crosshair.rectangle.fantasy_01.white.full.20x20ft'));
    const portalPath = typeof portalEntry === 'string' ? portalEntry : (portalEntry?.file ?? portalEntry?.files?.[0]);
    const cfg = {
        radius: 20,
        max: 60,
        icon: portalPath,
        label: 'Faerie Fire'
    };
    let [primary, secondary, center] = await templatelib.getPosition(template, cfg);
    if (!center && !primary) return;
    const targetPos = center ?? primary;

    const sequence = new Sequence();

    if (token) {
        sequence.effect()
            .name(`${id} - ${token.id}`)
            .file(closest('eskie.casting.nature.01.side.one_shot.white'))
            .attachTo(token)
            .rotateTowards(targetPos)
            .scaleToObject(1.25, { considerTokenScale: true })
            .spriteOffset({ x: -0.25 }, { gridUnits: true })
            .filter('Glow', { color: tintColor, distance: 1, outerStrength: 0, innerStrength: 2 });
    }

    sequence.effect()
        .file(closest(`jb2a.sacred_flame.target.${color}`))
        .atLocation(targetPos)
        .scale(0.25)
        .playbackRate(1)
        .duration(1000)
        .scaleOut(0.5, 1000, { ease: 'easeOutBack' })
        .filter('ColorMatrix', { brightness: 0, hue: hue })
        .filter('Blur', { blurX: 5, blurY: 10 })
        .belowTokens()
        .opacity(0.75);

    sequence.effect()
        .file(closest(`jb2a.sacred_flame.target.${color}`))
        .atLocation(targetPos)
        .scale(0.25)
        .playbackRate(1)
        .duration(1000)
        .scaleIn(0, 1000, { ease: 'easeOutCubic' })
        .animateProperty('sprite', 'width', { from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
        .animateProperty('sprite', 'height', { from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
        .animateProperty('sprite', 'position.y', { from: 0, to: -0.25, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
        .waitUntilFinished(-200);

    sequence.effect()
        .file(closest(`jb2a.impact.010.${color}`))
        .atLocation(targetPos, { offset: { y: -0.25 }, gridUnits: true })
        .scaleToObject(0.45)
        .randomRotation()
        .zIndex(1);

    sequence.effect()
        .file(closest(`eskie.pulse.energy.01.${color}`))
        .atLocation(targetPos, { offset: { y: -0.25 }, gridUnits: true })
        .scaleToObject(1.1)
        .filter('ColorMatrix', { hue: hue2 });

    sequence.effect()
        .file(closest('jb2a.extras.tmfx.outflow.circle.04'))
        .atLocation(targetPos)
        .belowTokens()
        .scaleToObject(1)
        .opacity(0.25)
        .duration(2500)
        .fadeIn(500)
        .fadeOut(2000)
        .tint(tintColor);

    sequence.effect()
        .file(closest(`jb2a.fireflies.{{Pfew}}.02.${color}`))
        .atLocation(targetPos, { randomOffset: 0.75 })
        .scaleToObject(0.5)
        .randomRotation()
        .duration(750)
        .fadeOut(500)
        .setMustache({
            'Pfew': () => {
                const Pfews = ['few', 'many'];
                return Pfews[Math.floor(Math.random() * Pfews.length)];
            }
        })
        .repeats(10, 75, 75)
        .spriteOffset({ y: -0.25 }, { gridUnits: true })
        .zIndex(1);

    return sequence;
}

function createEffect(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, color, glow } = mConfig;
    const { tintColor } = getTintAndHue(color);

    const sequence = new Sequence();

    if (glow) {
        sequence.effect()
            .name(`${id} - ${token.id}`)
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .attachTo(token, { bindAlpha: false, bindVisibility: false })
            .belowTokens()
            .scaleToObject(1, { considerTokenScale: true })
            .filter('Glow', { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0, knockout: true })
            .fadeIn(500)
            .fadeOut(500)
            .persist();

        sequence.effect()
            .name(`${id} - ${token.id}`)
            .file(closest(`eskie.texture_mask.glitter.01.${color}.particles_only`))
            .attachTo(token, { bindAlpha: false, bindVisibility: false })
            .mask()
            .scaleToObject(1.5, { considerTokenScale: true })
            .fadeIn(500)
            .fadeOut(1500)
            .duration(2000);
    }

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) return sequence.play();
}

async function playCloud(token, config = {}) {
    const sequence = await createCloud(token, config);
    if (sequence) return sequence.play();
}

async function playEffect(token, config = {}) {
    const sequence = await createEffect(token, config);
    if (sequence) return sequence.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    if (token) Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}`, object: token });
}

async function clean(config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id}` });
}

export const faerieFire = {
    create,
    play,
    stop,
    clean,
    template: {
        create: createCloud,
        play: playCloud,
        default_config: DEFAULT_CONFIG
    },
    effect: {
        create: createEffect,
        play: playEffect,
        default_config: DEFAULT_CONFIG
    },
    default_config: DEFAULT_CONFIG
};

autoanimations.register('faerieFire', 'template', 'eskie.effect.faerieFire.template', DEFAULT_CONFIG, '0.0.0', 'Faerie Fire');
autoanimations.register('faerieFire', 'effect', 'eskie.effect.faerieFire.effect', DEFAULT_CONFIG, '0.0.0', 'Faerie Fire');