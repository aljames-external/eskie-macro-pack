// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'eskie.effect.possession.main',
    color: 'teal',
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

async function create(token, target, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id, color } = mConfig;
    const tintColor = getTintColor(color);

    let seq = new Sequence();
    seq.wait(100)
        .animation()
        .on(token)
        .opacity(1)
        .hide()
        .wait(500)

        .effect()
        .copySprite(token)
        .atLocation(target)
        .mirrorX(token.document.mirrorX)
        .animateProperty("spriteContainer", "position.y", { from: -1, to: 0, duration: 750, gridUnits: true, ease: "easeOutExpo" })
        .scaleToObject(target.texture.scaleX, { considerTokenScale: true })
        .duration(750)
        .fadeOut(400)
        .opacity(0.65)
        .tint(tintColor)
        .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
        .filter("Blur", { blurX: 0, blurY: 10 })

        .effect()
        .delay(100)
        .file(closest(`jb2a.particles.outward.white.01.03`))
        .attachTo(target, { offset: { y: 0.2 }, gridUnits: true, bindRotation: false })
        .scaleToObject()
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: -0, to: -0.6, duration: 1000, gridUnits: true })
        .tint(tintColor)
        .filter("Blur", { blurX: 0, blurY: 5 })
        .opacity(0.8)
        .zIndex(0.3)

        .effect()
        .delay(500)
        .name(`${id} - ${target.uuid}`)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(target, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .fadeIn(1000)
        .fadeOut(500)
        .belowTokens()
        .opacity(0.45)
        .tint(tintColor)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
        .persist()

        .effect()
        .delay(500)
        .name(`${id} - ${target.uuid}`)
        .copySprite(target)
        .attachTo(target, { bindAlpha: false })
        .belowTokens()
        .mirrorX(token.document.mirrorX)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("Glow", { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0 })
        .fadeIn(1000)
        .fadeOut(500)
        .persist()
        .zIndex(0.1)
        .waitUntilFinished()
    
        .animation()
        .on(token)
        .show(false);

    return seq;
}

async function play(token, target, config) {
    let seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

async function stop(token, target, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    await Sequencer.EffectManager.endEffects({ name: `${id} - ${target.uuid}`, object: target });
    let sequence = new Sequence().animation().on(token).show(true);
    return sequence.play();
}

export const possession = {
    create,
    play,
    stop,
};
