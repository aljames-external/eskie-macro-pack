// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'ChannelElementsMetal',
    effectName: "ChannelMetal",
};

function _createMetal(sequence, token, xOffset) {
    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.electricity.04"))
        .attachTo(token, { offset: { x: xOffset * token.document.width, y: 0.6 * token.document.width }, gridUnits: true, bindRotation: false })
        .stretchTo(token, { offset: { x: xOffset * token.document.width, y: 0 }, gridUnits: true })
        .rotate(90)
        .fadeOut(1600)
        .opacity(1)
        .filter("ColorMatrix", { saturate: -1, hue: 50 })
        .spriteOffset({ x: -0.3 * token.document.width, y: 0.4 * token.document.width }, { gridUnits: true })
        .delay(200);

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.celestial_bodies.planet.atmo.05.blue"))
        .attachTo(token, { offset: { x: xOffset * token.document.width, y: 0.5 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.15, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.4, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("sprite", "position.y", { from: 0, to: 0.05, duration: 2500, pingPong: true, delay: 500, gridUnits: true, ease: "easeInSine" })
        .persist()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.75)
        .playbackRate(0.5);

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.celestial_bodies.planet.atmo.05.blue"))
        .attachTo(token, { offset: { x: xOffset * token.document.width, y: 0.4 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.2, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.4, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("sprite", "position.y", { from: 0, to: 0.05, duration: 2500, pingPong: true, delay: 500, gridUnits: true, ease: "easeInSine" })
        .persist()
        .zIndex(0.1)
        .tint("#78e4ff")
        .filter("ColorMatrix", { hue: 0, saturate: -1, brightness: 2 })
        .filter("Glow", { color: 0x000000, innerStrength: 3, outerStrength: 0 })
        .playbackRate(0.5);
}

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { effectName } = mConfig;
    const sequence = new Sequence();

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.electricity.35"))
        .attachTo(token, { offset: { x: 0.05, y: 0.1 }, gridUnits: true, bindRotation: false })
        .scaleToObject(3.5)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .fadeOut(100)
        .belowTokens()
        .opacity(1)
        .filter("ColorMatrix", { saturate: -1, hue: 50 });

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.shimmer.01.blue"))
        .attachTo(token, { offset: { x: 0, y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.25, { considerTokenScale: true })
        .rotate(-90);

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.wind_stream.200.white"))
        .attachTo(token, { offset: { x: 0, y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(2)
        .fadeIn(1000)
        .fadeOut(500)
        .persist()
        .playbackRate(0.5)
        .opacity(0.65)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .rotate(90)
        .tint("#fd9608")
        .mask();

    _createMetal(sequence, token, -0.6);
    _createMetal(sequence, token, -0.25);
    _createMetal(sequence, token, 0.25);
    _createMetal(sequence, token, 0.6);

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    return sequence.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { effectName } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: effectName, object: token });
}

export const metal = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
