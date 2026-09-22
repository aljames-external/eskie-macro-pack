// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'ghostWalk',
    changeLight: true,
    color: '#58feb0',
    padding: 1,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: Record<string, any> = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, changeLight, color, padding, sound } = mConfig;

    const label = `${id} - ${token.id}`;

    const seq = new Sequence();
    applySound(seq, sound);

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

    // Incorporeal spirit hover motion via Sequencer 4.3.0+ .motion() API
    seq.motion(token)
        .name(label)
        .fadeTo(0.65)
        .tintTo(color)
        .oscillate()
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

async function play(token: Token, config: Record<string, any> = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token: Token, config: Record<string, any> = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, changeLight } = mConfig;
    const label = `${id} - ${token.id}`;

    if (changeLight) {
        await token.document.update({ light: { dim: 0, bright: 0 } });
    }

    await new Sequence()
        .motion(token)
        .fadeTo(1)
        .tintTo('#FFFFFF')
        .play();
    await Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const ghostWalk = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('ghostWalk', 'token', 'eskie.effect.ghostWalk', DEFAULT_CONFIG, '0.0.2', 'Ghost Walk');
adapter.autorec.register('ghostWalk', 'effect', 'eskie.effect.ghostWalk', DEFAULT_CONFIG, '0.0.2', 'Ghost Walk');

