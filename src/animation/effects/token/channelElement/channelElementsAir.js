// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'ChannelElementsAir',
    effectName: "ChannelAir",
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { effectName } = mConfig;
    const sequence = new Sequence();

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.air.portal"))
        .attachTo(token, { offset: { x: 0, y: -0.0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(2.5)
        .fadeIn(250)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .fadeOut(500)
        .belowTokens()
        .opacity(0.85)
        .filter("ColorMatrix", { saturate: -1 });

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.air.explosion.gray"))
        .attachTo(token, { offset: { x: 0, y: -0.0 }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.45)
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
        .opacity(0.5)
        .filter("ColorMatrix", { saturate: 1, brightness: 2 })
        .rotate(90)
        .mask();

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.smoke.19"))
        .attachTo(token, { offset: { x: 0.2 * token.document.width, y: 0.45 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.5, { considerTokenScale: true })
        .rotate(-30)
        .persist()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.5);

    sequence.effect()
        .name(effectName)
        .file(closest("animated-spell-effects-cartoon.smoke.19"))
        .attachTo(token, { offset: { x: 0.2 * token.document.width, y: 0.35 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.5, { considerTokenScale: true })
        .rotate(-30)
        .persist()
        .zIndex(0.1);

    sequence.effect()
        .name(effectName)
        .delay(700)
        .file(closest("animated-spell-effects-cartoon.smoke.19"))
        .attachTo(token, { offset: { x: -0.4 * token.document.width, y: -0.25 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.2, { considerTokenScale: true })
        .belowTokens(false)
        .mirrorY(true)
        .rotate(110)
        .persist()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.5);

    sequence.effect()
        .name(effectName)
        .delay(700)
        .file(closest("animated-spell-effects-cartoon.smoke.19"))
        .attachTo(token, { offset: { x: -0.4 * token.document.width, y: -0.35 * token.document.width }, gridUnits: true, bindRotation: false })
        .scaleToObject(1.2, { considerTokenScale: true })
        .belowTokens(false)
        .mirrorY(true)
        .rotate(110)
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

export const air = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
