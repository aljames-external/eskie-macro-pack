// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'pathOfTheGrave',
    color: 'teal'
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    if (!token || !target) return;

    const label = `${id} - ${target.id}`;
    const seq = new Sequence();

    seq.effect()
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(token)
        .scaleToObject(1.5, { considerTokenScale: true })
        .tint('#58feb0')
        .opacity(0.45)
        .fadeIn(500)
        .belowTokens()
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .scaleOut(0, 250, { ease: 'easeOutQuint' })
        .duration(2000)
        .fadeOut(1250)
        .randomRotation();

    seq.wait(100);

    seq.effect()
        .file(closest('eskie.environment.wisp.01.teal.single'))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(0.65, { considerTokenScale: true })
        .tint('#58feb0')
        .spriteOffset({ x: 0.5, y: -0.05 }, { gridUnits: true })
        .spriteAnchor({ x: 1 })
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .scaleOut(0, 250, { ease: 'easeOutQuint' })
        .zIndex(1)
        .duration(750);

    seq.effect()
        .file(closest('jb2a.extras.tmfx.inflow.circle.01'))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(0.25, { considerTokenScale: true })
        .spriteOffset({ x: 0.5 }, { gridUnits: true })
        .spriteAnchor({ x: 1 })
        .tint('#58feb0')
        .opacity(0.45)
        .fadeIn(500)
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .scaleOut(0, 250, { ease: 'easeOutQuint' })
        .duration(750);

    seq.effect()
        .delay(500)
        .file(closest('eskie.damage.necrotic.01.teal'))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(0.65, { considerTokenScale: true })
        .spriteOffset({ x: 0.15 }, { gridUnits: true })
        .filter('ColorMatrix', { hue: -20 })
        .zIndex(1);

    seq.effect()
        .delay(500)
        .file(closest('eskie.particle.01.one_shot.blue'))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(0.65, { considerTokenScale: true })
        .spriteOffset({ x: 0.15 }, { gridUnits: true })
        .filter('ColorMatrix', { hue: -50 })
        .zIndex(1);

    seq.wait(500);

    seq.effect()
        .file(closest('eskie.smoke.07.green'))
        .attachTo(target, { offset: { y: 0.05 }, gridUnits: true })
        .scaleToObject(1.75, { considerTokenScale: true })
        .belowTokens()
        .opacity(0.5)
        .filter('ColorMatrix', { hue: 75 });

    // Persistent curse skull
    seq.effect()
        .name(label)
        .delay(50)
        .file(closest('eskie.symbol.skull.poison.teal'))
        .attachTo(target)
        .scaleToObject(0.35, { considerTokenScale: true })
        .opacity(1)
        .zIndex(2)
        .persist();

    // Persistent ribbon aura
    seq.effect()
        .name(label)
        .delay(50)
        .file(closest('eskie.aura.token.ribbon.02.teal'))
        .attachTo(target)
        .scaleToObject(1.5, { considerTokenScale: true })
        .opacity(1)
        .filter('ColorMatrix', { hue: -25 })
        .playbackRate(0.75)
        .zIndex(1)
        .persist()
        .waitUntilFinished();

    seq.effect()
        .file(closest('eskie.damage.necrotic.01.teal'))
        .attachTo(target)
        .scaleToObject(2, { considerTokenScale: true })
        .playbackRate(0.8)
        .belowTokens();

    seq.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .opacity(0.25)
        .loopProperty('sprite', 'scale.y', { from: 1, to: 1.25, duration: 1000, ease: 'easeInOutSine' })
        .loopProperty('sprite', 'scale.x', { from: 1, to: 1.25, duration: 1000, ease: 'easeInOutSine' })
        .loopProperty('sprite', 'alpha', { from: 0.25, to: -0.25, duration: 1000, ease: 'easeInOutSine' })
        .duration(1000)
        .fadeOut(1500)
        .zIndex(2)
        .tint('#58feb0');

    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) return seq.play();
}

async function stop(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    if (target) Sequencer.EffectManager.endEffects({ name: `${id} - ${target.id}`, object: target });
}

export const pathOfTheGrave = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('pathOfTheGrave', 'ranged-target', 'eskie.effect.pathOfTheGrave', DEFAULT_CONFIG, '0.0.0', 'Path of the Grave');
autoanimations.register('channelDivinityPathToTheGrave', 'ranged-target', 'eskie.effect.pathOfTheGrave', DEFAULT_CONFIG, '0.0.0', 'Channel Divinity: Path to the Grave');

