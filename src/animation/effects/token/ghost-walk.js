// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'ghostWalk',
    changeLight: true,
    color: '#58feb0',
    padding: 1
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, changeLight, color, padding } = mConfig;

    const label = `${id} - ${token.id}`;

    const seq = new Sequence();

    seq.animation()
        .on(token)
        .opacity(0);

    if (changeLight) {
        seq.thenDo(async () => {
            const light = {
                dim: 0,
                bright: 1,
                alpha: 0.25,
                luminosity: 0.55,
                color: color,
                animation: {
                    type: 'torch',
                    speed: 4,
                    intensity: 5
                },
                attenuation: 0.85,
                contrast: 0,
                shadows: 0
            };
            await token.document.update({ light });
        });
    }

    // Outflow base pulse
    seq.effect()
        .name(label)
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(token, { bindAlpha: false })
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .belowTokens()
        .opacity(0.45)
        .zIndex(1)
        .tint(color)
        .fadeIn(1500, { ease: 'easeInSine' })
        .fadeOut(1500)
        .duration(5000)
        .persist();

    // Ghost copy floating with subtle sway
    seq.effect()
        .delay(250)
        .name(label)
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .attachTo(token, { bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.65)
        .tint(color)
        .loopProperty('sprite', 'position.x', { from: 0, to: 0.025, duration: 5000, gridUnits: true, pingPong: true, ease: 'easeOutSine', delay: 3000 })
        .loopProperty('sprite', 'position.x', { from: 0, to: -0.025, duration: 5000, gridUnits: true, pingPong: true, ease: 'easeInSine', delay: 3000 })
        .loopProperty('sprite', 'position.y', { from: 0, to: -0.03, duration: 2500, gridUnits: true, pingPong: true, delay: 3000 })
        .filter('ColorMatrix', { saturate: -0.2, brightness: 1.2 })
        .filter('Blur', { blurX: 0, blurY: 0.8 })
        .fadeIn(1500, { ease: 'easeInSine' })
        .fadeOut(1000)
        .persist();

    // Smoke particle burst
    seq.effect()
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(token)
        .scaleToObject(2 * padding, { considerTokenScale: true })
        .opacity(0.5)
        .filter('ColorMatrix', { saturate: 0, brightness: 1.5 })
        .tint(color);

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, changeLight } = mConfig;
    const label = `${id} - ${token.id}`;

    if (changeLight) {
        await token.document.update({ light: { dim: 0, bright: 0 } });
    }

    await new Sequence().animation().on(token).opacity(1).show(true).play();
    await Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const ghostWalk = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

autoanimations.register('ghostWalk', 'token', 'eskie.effect.ghostWalk', DEFAULT_CONFIG, '0.0.0', 'Ghost Walk');
autoanimations.register('ghostWalk', 'effect', 'eskie.effect.ghostWalk', DEFAULT_CONFIG, '0.0.0', 'Ghost Walk');

