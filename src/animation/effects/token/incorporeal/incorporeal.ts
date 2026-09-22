// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

import { adapter } from "../../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../utils/sound.js";

const DEFAULT_CONFIG = {
    id: 'eskie.effect.incorporeal.main',
    color: 'teal',
    changeLight: true,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function getTintColor(color: any) {
    switch (color) {
        case "teal": return '#6ff087';
        case "green": return '#6cde3b';
        case "blue": return '#74e2cf';
        case "red": return '#e22c47';
        default: return '#6ff087';
    }
}

async function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, changeLight, sound } = mConfig;
    const tintColor = getTintColor(color);

    let seq = new Sequence();
    applySound(seq, sound);

    if (changeLight) {
        seq.thenDo(function () {
            const light = { dim: 0, bright: 1, alpha: 0.25, luminosity: 0.55, color: tintColor, animation: { type: "torch", speed: 4, intensity: 5 }, attenuation: 0.85, contrast: 0, shadows: 0 };
            token.document.update({ light });
        });
    }

    seq.effect()
        .name(`${id} - ${token.document.uuid}`)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(token, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .belowTokens()
        .opacity(0.45)
        .tint(tintColor)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
        .persist();

    seq.motion(token)
        .name(`${id} - ${token.document.uuid}`)
        .oscillate({ period: 2000, amplitude: 0.05 })
        .fadeTo(0.5, { duration: 500 })
        .tintTo(tintColor, { duration: 500 });

    seq.effect()
        .file(closest("jb2a.smoke.puff.centered.grey"))
        .atLocation(token)
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(0.5)
        .filter("ColorMatrix", { saturate: 0, brightness: 1.5 })
        .tint(tintColor);

    return seq;
}

async function play(token: Token, config: any = {}) {
    let seq = await create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    if (mConfig.changeLight) {
        await token.document.update({ light: { dim: 0, bright: 0 } });
    }
    await Sequencer.EffectManager.endEffects({ name: `${id} - ${token.document.uuid}`, object: token });
}

async function clean(token: Token, config: any = {}) {
    return stop(token, config);
}

export const incorporeal = {
    clean,
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

