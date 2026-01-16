// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'ChannelElementsWood',
    effectName: "ChannelWood",
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, effectName } = mConfig;
    const sequence = new Sequence();

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.plant_growth.04.ring.4x4.pulse.greenwhite"))
        .attachTo(token, { offset: { x: 0, y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(3)
        .playbackRate(1.5)
        .fadeIn(250)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .rotate(0)
        .fadeOut(500)
        .belowTokens()
        .opacity(1);

    sequence.effect()
        .name(effectName)
        .file(closest("jb2a.swirling_leaves.outburst.01.greenorange"))
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
        .tint("#8aeb01")
        .mask();

    sequence.effect()
        .delay(700)
        .name(effectName)
        .file(closest("jb2a.swirling_leaves.loop.01.green.1"))
        .attachTo(token, { offset: { x: 0, y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(3.5, { considerTokenScale: true })
        .fadeIn(1000)
        .belowTokens()
        .persist()
        .zIndex(0.1);

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    return sequence.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, effectName } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: effectName, object: token });
}

export const wood = {
    create,
    play,
    stop,
};
