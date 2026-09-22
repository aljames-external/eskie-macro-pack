// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

import { adapter } from "../../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'eskie.effect.possession.main',
    color: 'teal',
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

async function create(token: Token, target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, sound } = mConfig;
    const tintColor = getTintColor(color);
    const label = `${id} - ${target.document.uuid}`;

    let seq = new Sequence();
    applySound(seq, sound);

    // Possessing spirit float motion via Sequencer 4.3.0+ .motion() API
    seq.motion(token)
        .name(label)
        .oscillate()
        .fadeTo(0.65)
        .tintTo(tintColor)
        .persist();

    seq.effect()
        .delay(100)
        .file(closest(`jb2a.particles.outward.white.01.03`))
        .attachTo(target, { offset: { y: 0.2 }, gridUnits: true, bindRotation: false })
        .scaleToObject()
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty('sprite', 'width', { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty('sprite', 'height', { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty('spriteContainer', 'position.y', { from: -0, to: -0.6, duration: 1000, gridUnits: true })
        .tint(tintColor)
        .filter("Blur", { blurX: 0, blurY: 5 })
        .opacity(0.8)
        .zIndex(0.3);

    seq.effect()
        .delay(500)
        .name(label)
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
        .persist();

    seq.effect()
        .delay(500)
        .name(label)
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target, { bindAlpha: false })
        .belowTokens()
        .mirrorX(token.document.texture.scaleX < 0)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("Glow", { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0 })
        .fadeIn(1000)
        .fadeOut(500)
        .persist()
        .zIndex(0.1)
        .waitUntilFinished();

    return seq;
}

async function play(token: Token, target: Token, config: any = {}) {
    let seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

async function stop(token: Token, target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    const label = `${id} - ${target.document.uuid}`;
    return Sequencer.EffectManager.endEffects({ name: label });
}

export const possession = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

