// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'keeperOfSouls',
    color: 'teal'
};

async function create(target, ally, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (!target || !ally) return;

    const seq = new Sequence();

    // Damage & soul release on dying target
    seq.effect()
        .name(`${id} - ${target.id}`)
        .file(closest('eskie.slice.01.color.green'))
        .attachTo(target, { offset: { y: -0.3 }, gridUnits: true, bindRotation: false })
        .rotate(-90)
        .scaleToObject(0.8, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: 20 })
        .zIndex(2);

    seq.effect()
        .delay(50)
        .file(closest('jb2a.impact.004.green'))
        .attachTo(target, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.5, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: 50 })
        .zIndex(1);

    seq.effect()
        .delay(50)
        .file(closest('eskie.poison.01.teal.no_base'))
        .attachTo(target, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.35, { considerTokenScale: true })
        .duration(5000);

    seq.effect()
        .delay(50)
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(target)
        .scaleToObject(1.5, { considerTokenScale: true })
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

    // Energy strands transfer to ally
    seq.effect()
        .file(closest('jb2a.energy_strands.range.standard.blue.03'))
        .attachTo(target, { offset: { y: -0.35 }, gridUnits: true })
        .stretchTo(ally, { onlyX: true })
        .filter('ColorMatrix', { hue: -50 })
        .zIndex(4);

    seq.effect()
        .file(closest('jb2a.energy_strands.range.standard.blue.04'))
        .attachTo(target, { offset: { y: -0.35 }, gridUnits: true })
        .stretchTo(ally, { onlyX: true })
        .filter('ColorMatrix', { hue: -50 })
        .zIndex(4);

    seq.effect()
        .file(closest('jb2a.energy_strands.range.standard.blue.04'))
        .attachTo(target, { offset: { y: -0.35 }, gridUnits: true })
        .stretchTo(ally, { onlyX: true })
        .filter('ColorMatrix', { hue: -50 })
        .zIndex(4)
        .mirrorY()
        .waitUntilFinished(-1750);

    // Heal effects on receiving ally
    seq.effect()
        .file(closest('jb2a.impact.004.green'))
        .attachTo(ally, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.5, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: 50 })
        .zIndex(2);

    seq.effect()
        .file(closest('eskie.buff.one_shot.health.green'))
        .attachTo(ally, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(1, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: 75 });

    seq.effect()
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(ally)
        .scaleToObject(1.5, { considerTokenScale: true })
        .tint('#58feb0')
        .opacity(0.45)
        .fadeIn(500)
        .belowTokens()
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .scaleOut(0, 250, { ease: 'easeOutQuint' })
        .duration(3750)
        .fadeOut(1250)
        .randomRotation();

    return seq;
}

async function play(target, ally, config = {}) {
    const seq = await create(target, ally, config);
    if (seq) return seq.play();
}

async function stop(target, ally, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    if (target) Sequencer.EffectManager.endEffects({ name: `${id} - ${target.id}` });
}

export const keeperOfSouls = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('keeperOfSouls', 'ranged-target', 'eskie.effect.keeperOfSouls', DEFAULT_CONFIG, '0.0.0', 'Keeper of Souls');

