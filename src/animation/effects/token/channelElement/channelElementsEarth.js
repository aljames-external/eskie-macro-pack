// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'ChannelElementsEarth',
    effectName: "ChannelEarth",
};

function _createRock(sequence, token, effectName, xOffset) {
    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.celestial_bodies.asteroid.single.iron.red.01"))
        .attachTo(token, { offset: { x: xOffset * token.document.width, y: 0.5 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.25, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.4, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("sprite", "position.y", { from: 0, to: 0.05, duration: 2500, pingPong: true, delay: 500, gridUnits: true, ease: "easeInSine" })
        .persist()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.3);

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.celestial_bodies.asteroid.single.iron.red.01"))
        .attachTo(token, { offset: { x: xOffset * token.document.width, y: 0.4 }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.3, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.4, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("sprite", "position.y", { from: 0, to: 0.05, duration: 2500, pingPong: true, delay: 500, gridUnits: true, ease: "easeInSine" })
        .persist()
        .zIndex(0.1)
        .filter("ColorMatrix", { saturate: -0.5, brightness: 1.5, hue: 20 });
}

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { effectName } = mConfig;
    const sequence = new Sequence();

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.energy.pulse.yellow"))
        .attachTo(token, { offset: { x: 0, y: -0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(3.5)
        .fadeIn(250)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .fadeOut(500)
        .belowTokens()
        .opacity(1)
        .filter("ColorMatrix", { saturate: 0.25, hue: -20 });

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.impact.ground_crack.orange.03"))
        .attachTo(token, { offset: { x: 0, y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(2.5)
        .fadeOut(500)
        .belowTokens();

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.wind_stream.200.white"))
        .attachTo(token, { offset: { x: 0, y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(2)
        .fadeIn(1000)
        .fadeOut(500)
        .persist()
        .playbackRate(0.5)
        .opacity(0.45)
        .filter("ColorMatrix", { saturate: 1, brightness: 2 })
        .rotate(90)
        .tint("#fd9608")
        .mask();

    _createRock(sequence, token, effectName, -0.6);
    _createRock(sequence, token, effectName, -0.25);
    _createRock(sequence, token, effectName, 0.25);
    _createRock(sequence, token, effectName, 0.6);

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    return sequence.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { effectName } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: effectName, object: token });
}

export const earth = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
