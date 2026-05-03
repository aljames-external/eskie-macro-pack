// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'ChannelElementsWater',
    effectName: "ChannelWater",
};

function _createWaterPulse(token, x, y, rotation) {
    return new Sequence()
        .effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.water.49"))
        .attachTo(token, { offset: { x, y }, gridUnits: true, bindRotation: false })
        .scaleToObject(2)
        .fadeIn(250)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .rotate(rotation)
        .fadeOut(500)
        .belowTokens()
        .opacity(1);
}

function _createWaterSplash(token, xOffset, delay, mirrorX) {
    const effect = new Sequence()
        .effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.water.69"))
        .attachTo(token, { offset: { x: xOffset * token.document.width, y: -0.05 }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.35, { considerTokenScale: true })
        .fadeIn(1000)
        .persist()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.3);
    if (delay) effect.delay(delay);
    if (mirrorX) effect.mirrorX();

    effect
        .effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.water.69"))
        .attachTo(token, { offset: { x: (xOffset + 0.1) * token.document.width, y: -0.05 }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.35, { considerTokenScale: true })
        .fadeIn(1000)
        .persist()
        .zIndex(0.1);
    if (delay) effect.delay(delay);
    if (mirrorX) effect.mirrorX();
    return effect;
}

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { effectName } = mConfig;
    const sequence = new Sequence();

    sequence.addSequence(_createWaterPulse(token, 1, 0, 0));
    sequence.addSequence(_createWaterPulse(token, 0, 1, -90));
    sequence.addSequence(_createWaterPulse(token, 0, -1, 90));
    sequence.addSequence(_createWaterPulse(token, -1, 0, 180));

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.water.63"))
        .attachTo(token, { offset: { x: 0, y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(2)
        .fadeOut(250)
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
        .tint("#2db4e1")
        .mask();

    sequence.addSequence(_createWaterSplash(token, -0.23, 0, false));
    sequence.addSequence(_createWaterSplash(token, 0.23, 700, true));

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

export const water = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
