// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { file } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: "fly",
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;

    let seq = new Sequence();
    seq = seq.effect()
        .file(file("jb2a.misty_step.01.blue"))
        .atLocation(token)
        .scaleToObject(1.75)
        .belowTokens();

    seq = seq.animation()
        .on(token)
        .opacity(0);

    seq = seq.effect()
        .copySprite(token)
        .name(`${id} - ${token.id}`)
        .atLocation(token)
        .opacity(1)
        .duration(800)
        .anchor({ x: 0.55, y: 0.9 })
        .animateProperty("spriteContainer", "position.y", { from: 50, to: 0, duration: 500 })
        .loopProperty("sprite", "position.y", { from: 0, to: -50, duration: 2500, pingPong: true, delay: 500 })
        .attachTo(token, { bindAlpha: false })
        .zIndex(2)
        .persist();

    seq = seq.effect()
        .copySprite(token)
        .name(`${id} - ${token.id}`)
        .atLocation(token)
        .scaleToObject(0.9)
        .duration(1000)
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .attachTo(token, { bindAlpha: false })
        .zIndex(1)
        .persist();

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;

    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}`, object: token }),
        new Sequence().animation().on(token).opacity(1).play()
    ])
}

export const fly = {
    play,
    stop,
};
