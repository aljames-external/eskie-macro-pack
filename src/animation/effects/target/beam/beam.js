// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'beam',
    effects: [
        { img: `jb2a.magic_signs.circle.02.transmutation.loop.dark_green` },
        { img: `jb2a.particles.outward.white.01.02` },
        { img: `jb2a.extras.tmfx.border.circle.inpulse.01.fast` },
        { img: `jb2a.disintegrate.green` },
    ],
};

function create(token, target, config = {}) {
    let mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let { id, effects } = mConfig;

    let seq = new Sequence()
        .effect()
        .name(id)
        .atLocation(token)
        .file(closest(effects[0].img))
        .scaleToObject(1.25)
        .rotateIn(180, 600, {ease: "easeOutCubic"})
        .scaleIn(0, 600, {ease: "easeOutCubic"})
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
        .belowTokens()
        .fadeOut(2000)
        .zIndex(0)

        .effect()
        .name(id)
        .atLocation(token)
        .file(closest(effects[0].img))
        .scaleToObject(1.25)
        .rotateIn(180, 600, {ease: "easeOutCubic"})
        .scaleIn(0, 600, {ease: "easeOutCubic"})
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
        .belowTokens(true)
        .filter("ColorMatrix", {saturate:-1, brightness:2})
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(1)
        .duration(1200)
        .fadeIn(200, {ease: "easeOutCirc", delay: 500})
        .fadeOut(300, {ease: "linear"})
        .zIndex(0.1)

        .effect()
        .name(id)
        .file(closest(effects[1].img))
        .scaleIn(0, 1000, {ease: "easeOutQuint"})
        .delay(500)
        .fadeOut(1000)
        .atLocation(token)
        .duration(1000)
        .size(1.75, {gridUnits: true})
        .animateProperty("spriteContainer", "position.y", {  from:0 , to: -0.5, gridUnits:true, duration: 1000})
        .zIndex(1)

        .effect()
        .name(id)
        .file(closest(effects[1].img))
        .scaleIn(0, 1000, {ease: "easeOutQuint"})
        .delay(500)
        .fadeOut(1000)
        .atLocation(token)
        .duration(1000)
        .size(1.75, {gridUnits: true})
        .animateProperty("spriteContainer", "position.y", {  from:0 , to: -0.5, gridUnits:true, duration: 1000})
        .zIndex(1)
        .mirrorX()

        .wait(1000)

        .effect()
        .name(id)
        .file(closest(effects[2].img))
        .atLocation(token)
        .tint("#d9df53")
        .scaleToObject(1.5)

        .wait(500)

        .effect()
        .name(id)
        .file(closest(effects[3].img))
        .atLocation(token)
        .stretchTo(target)
        .zIndex(1)

        .wait(500)

    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

async function stop(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: id, object: token }),
        Sequencer.EffectManager.endEffects({ name: id, object: target })
    ]);
    
}

export const beam = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};