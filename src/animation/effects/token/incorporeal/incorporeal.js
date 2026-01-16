// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'eskie.effect.incorporeal.main',
    color: 'teal',
    changeLight: true,
};

function getTintColor(color) {
    switch (color) {
        case "teal": return '#6ff087';
        case "green": return '#6cde3b';
        case "blue": return '#74e2cf';
        case "red": return '#e22c47';
        default: return '#6ff087';
    }
}

async function create(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, color, changeLight } = mConfig;
    const tintColor = getTintColor(color);

    let seq = new Sequence();

    seq.animation()
        .on(token)
        .opacity(0);

    if (changeLight) {
        seq.thenDo(function () {
            const light = { dim: 0, bright: 1, alpha: 0.25, luminosity: 0.55, color: tintColor, animation: { type: "torch", speed: 4, intensity: 5 }, attenuation: 0.85, contrast: 0, shadows: 0 };
            token.document.update({ light });
        });
    }

    seq.effect()
        .name(`${id} - ${token.uuid}`)
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

    seq.effect()
        .name(`${id} - ${token.uuid}`)
        .copySprite(token)
        .attachTo(token, { bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.65)
        .tint(tintColor)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .loopProperty("sprite", "position.x", { from: 0.025, to: -0.025, duration: 5000, gridUnits: true, pingPong: true, ease: "easeOutSine" })
        .loopProperty("sprite", "position.y", { from: 0, to: -0.03, duration: 2500, gridUnits: true, pingPong: true })
        .persist()
        .filter("Glow", { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0 })
        .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
        .filter("Blur", { blurX: 0, blurY: 0.8 });

    seq.effect()
        .file(closest("jb2a.smoke.puff.centered.grey"))
        .atLocation(token)
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(0.5)
        .filter("ColorMatrix", { saturate: 0, brightness: 1.5 })
        .tint(tintColor);

    return seq;
}

async function play(token, config) {
    let seq = await create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    if (mConfig.changeLight) {
        await token.document.update({ light: { dim: 0, bright: 0 } });
    }
    await Sequencer.EffectManager.endEffects({ name: `${id} - ${token.uuid}`, object: token });
}

async function clean(token, config) {
    new Sequence()
        .animation()
            .on(token)
            .opacity(1)
            .play();
    return stop(token, config);
}

export const incorporeal = {
    clean,
    create,
    play,
    stop,
};
