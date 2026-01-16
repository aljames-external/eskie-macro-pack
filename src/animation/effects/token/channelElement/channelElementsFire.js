// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'ChannelElementsFire',
    effectName: "ChannelFire",
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { effectName } = mConfig;
    const sequence = new Sequence();

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.fire.33"))
        .attachTo(token, { offset: { x: 0.1, y: -0.1 }, gridUnits: true, bindRotation: false })
        .scaleToObject(3.5)
        .fadeIn(250)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .fadeOut(500)
        .belowTokens()
        .opacity(0.85);

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.fire.13"))
        .attachTo(token, { offset: { x: 0, y: -0.5 }, gridUnits: true, bindRotation: false })
        .scaleToObject(2.5)
        .fadeIn(250)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
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
        .playbackRate(0.8)
        .opacity(0.45)
        .filter("ColorMatrix", { saturate: 1, brightness: 2 })
        .rotate(90)
        .tint("#fd9608")
        .mask();

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.fire.27"))
        .attachTo(token, { offset: { x: 0.05 * token.document.width, y: 0.35 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.1, { considerTokenScale: true })
        .rotate(-67)
        .persist()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.6);

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.fire.27"))
        .attachTo(token, { offset: { x: 0.05 * token.document.width, y: 0.25 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.1, { considerTokenScale: true })
        .rotate(-67)
        .persist()
        .zIndex(0.1);

    sequence.effect()
        .name(effectName)
        .delay(500)
        .file(closest("animated-spell-effects-cartoon.fire.27"))
        .attachTo(token, { offset: { x: -0.325 * token.document.width, y: -0.15 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.9, { considerTokenScale: true })
        .belowTokens(false)
        .mirrorY(true)
        .rotate(145)
        .persist()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.6);

    sequence.effect()
        .name(effectName)
        .delay(500)
        .file(closest("animated-spell-effects-cartoon.fire.27"))
        .attachTo(token, { offset: { x: -0.325 * token.document.width, y: -0.25 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(0.9, { considerTokenScale: true })
        .belowTokens(false)
        .mirrorY(true)
        .rotate(145)
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
    const { effectName } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: effectName, object: token });
}

export const fire = {
    create,
    play,
    stop,
};
