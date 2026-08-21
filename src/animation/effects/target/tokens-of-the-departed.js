// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'tokensOfTheDeparted',
    color: 'teal',
    changeLight: true
};

async function createHarvest(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (!token || !target) return;

    const seq = new Sequence();

    seq.effect()
        .delay(50)
        .file(closest('eskie.poison.01.teal.no_base'))
        .attachTo(target, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.3, { considerTokenScale: true })
        .duration(5000);

    seq.effect()
        .delay(50)
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(target)
        .scaleToObject(1.25, { considerTokenScale: true })
        .tint('#58feb0')
        .opacity(0.45)
        .fadeIn(500)
        .belowTokens()
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .scaleOut(0, 250, { ease: 'easeOutQuint' })
        .duration(3750)
        .fadeOut(1250)
        .randomRotation();

    seq.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .mask(target)
        .opacity(0.25)
        .loopProperty('sprite', 'scale.y', { from: 1, to: 1.25, duration: 1000, ease: 'easeInOutSine' })
        .loopProperty('sprite', 'scale.x', { from: 1, to: 1.25, duration: 1000, ease: 'easeInOutSine' })
        .loopProperty('sprite', 'alpha', { from: 0.25, to: -0.25, duration: 1000, ease: 'easeInOutSine' })
        .duration(1000)
        .fadeOut(1500);

    seq.wait(250);

    seq.effect()
        .file(closest('eskie.particle.01.loop.green'))
        .attachTo(target, { offset: { y: -0.15 }, gridUnits: true, bindRotation: false })
        .scaleToObject(1, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: 50 })
        .zIndex(1)
        .fadeIn(1000)
        .fadeOut(1000)
        .opacity(0.25)
        .duration(3500);

    seq.effect()
        .file(closest('eskie.environment.wisp.01.teal.single'))
        .attachTo(target, { offset: { y: -0.35 }, gridUnits: true, bindRotation: false })
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2)
        .fadeIn(2000)
        .duration(3500)
        .animateProperty('sprite', 'position.y', { from: 0.4, to: 0, duration: 1500, ease: 'easeInSine', gridUnits: true })
        .scaleIn(0, 1500, { ease: 'easeInSine' })
        .scaleOut(0, 500, { ease: 'easeOutCubic' })
        .waitUntilFinished(-500);

    seq.effect()
        .file(closest('jb2a.impact.010.blue'))
        .attachTo(target, { offset: { y: -0.35 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.8, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: -50 })
        .zIndex(3);

    seq.effect()
        .file(closest('jb2a.extras.tmfx.border.circle.outpulse.01.fast'))
        .atLocation(target, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.25, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: -50 })
        .spriteOffset({ y: -0.35 }, { gridUnits: true })
        .zIndex(2)
        .duration(2500)
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.1, duration: 1000, ease: 'linear', gridUnits: true })
        .animateProperty('sprite', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 1000 })
        .animateProperty('sprite', 'position.y', { from: 0, to: 0.55, duration: 1250, ease: 'easeOutSine', gridUnits: true, delay: 1250 })
        .animateProperty('sprite', 'rotation', { from: 0, to: 720, duration: 1500, delay: 1000, ease: 'easeOutCubic' })
        .moveTowards(token, { delay: 1000, ease: 'easeOutCubic', rotate: false })
        .scaleOut(0, 1500, { ease: 'easeOutCubic' })
        .tint('#58feb0');

    seq.effect()
        .file(closest('eskie.star.03.blue'))
        .atLocation(target, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.75, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: -50 })
        .spriteOffset({ y: -0.35 }, { gridUnits: true })
        .zIndex(3)
        .duration(2500)
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.1, duration: 1000, ease: 'linear', gridUnits: true })
        .animateProperty('sprite', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 1000 })
        .animateProperty('sprite', 'position.y', { from: 0, to: 0.55, duration: 1250, ease: 'easeOutSine', gridUnits: true, delay: 1250 })
        .animateProperty('sprite', 'rotation', { from: 0, to: 720, duration: 1500, delay: 1000, ease: 'easeOutCubic' })
        .moveTowards(token, { delay: 1000, ease: 'easeOutCubic', rotate: false })
        .scaleOut(0, 1500, { ease: 'easeOutSine' })
        .waitUntilFinished(-500);

    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest('eskie.particle.01.one_shot.blue'))
        .attachTo(token)
        .scaleToObject(0.65, { considerTokenScale: true })
        .filter('ColorMatrix', { brightness: 1.5, hue: -35 })
        .zIndex(1);

    return seq;
}

async function playHarvest(token, target, config = {}) {
    const seq = await createHarvest(token, target, config);
    if (seq) return seq.play();
}

async function createUse(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (!token || !target) return;

    const label = `${id}Use - ${target.id}`;
    const seq = new Sequence();

    seq.effect()
        .file(closest('jb2a.extras.tmfx.border.circle.outpulse.01.fast'))
        .atLocation(token, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.25, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: -50 })
        .zIndex(1)
        .duration(1500)
        .animateProperty('sprite', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
        .animateProperty('sprite', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
        .moveTowards(target, { delay: 500, ease: 'easeOutCubic', rotate: false })
        .scaleOut(0, 1000, { ease: 'easeOutSine' })
        .tint('#58feb0');

    seq.effect()
        .file(closest('eskie.star.03.blue'))
        .atLocation(token, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.75, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: -50 })
        .zIndex(1)
        .duration(1500)
        .animateProperty('sprite', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
        .animateProperty('sprite', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
        .animateProperty('sprite', 'rotation', { from: 0, to: 720, duration: 1500, delay: 500, ease: 'easeOutCubic' })
        .moveTowards(target, { delay: 500, ease: 'easeOutCubic', rotate: false })
        .scaleOut(0, 1000, { ease: 'easeOutSine' })
        .waitUntilFinished(-500);

    seq.effect()
        .file(closest('eskie.poison.circle.01.teal'))
        .atLocation(target)
        .scaleToObject(1.5, { considerTokenScale: true })
        .zIndex(2);

    seq.effect()
        .name(label)
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(target, { bindAlpha: false })
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .belowTokens()
        .opacity(0.45)
        .tint('#58feb0')
        .fadeIn(2500, { ease: 'easeInSine' })
        .persist();

    seq.effect()
        .name(label)
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target, { bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.65)
        .tint('#58feb0')
        .loopProperty('sprite', 'position.x', { from: 0.025, to: -0.025, duration: 5000, gridUnits: true, pingPong: true, ease: 'easeOutSine' })
        .loopProperty('sprite', 'position.y', { from: 0, to: -0.03, duration: 2500, gridUnits: true, pingPong: true })
        .filter('ColorMatrix', { saturate: -0.2, brightness: 1.2 })
        .filter('Blur', { blurX: 0, blurY: 0.8 })
        .fadeIn(2500, { ease: 'easeInSine' })
        .persist();

    return seq;
}

async function playUse(token, target, config = {}) {
    const seq = await createUse(token, target, config);
    if (seq) return seq.play();
}

async function stop(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    if (target) {
        Sequencer.EffectManager.endEffects({ name: `${id}Use - ${target.id}`, object: target });
    }
    if (token) {
        Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}`, object: token });
    }
}

export const tokensOfTheDeparted = {
    create: createHarvest,
    play: playHarvest,
    harvest: {
        create: createHarvest,
        play: playHarvest,
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

autoanimations.register('tokensOfTheDeparted', 'ranged-target', 'eskie.effect.tokensOfTheDeparted.harvest', DEFAULT_CONFIG, '0.0.0', 'Tokens of the Departed');
autoanimations.register('tokensOfTheDepartedUse', 'ranged-target', 'eskie.effect.tokensOfTheDeparted.use', DEFAULT_CONFIG, '0.0.0', 'Tokens of the Departed (Use)');

