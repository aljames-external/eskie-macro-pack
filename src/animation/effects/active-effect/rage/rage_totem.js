// Last Updated: 1/27/2025
// Author: .eskie
// Update: bakanabaka

import { closest } from "../../../../lib/filemanager.js";
import { util } from './rage-util.js';

export const DEFAULT_CONFIG = {
    id: 'Totem',
    color: 'red',
    spirit: 'bear',
    effect: {
        ground: { enabled: true, duration: -1 },
    },
};

async function play(token, config) {
    let seq = create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    return util.stop(token, mConfig);
}

async function clean(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    return util.clean(token, mConfig);
}

export const rageTotem = {
    create,
    play,
    stop,
    clean,
};

function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, color, spirit, effect } = mConfig;
    const label = `${id} - ${token.id}`;

    let seq = new Sequence()
      .effect()
        .copySprite(token)
        .attachTo(token)
        .duration(750) 
        .animateProperty("sprite", "width", { from: 0, to: 0.05, duration: 400, gridUnits:true, ease: "easeOutCubic"})
        .animateProperty("sprite", "height", { from: 0, to:  0.05, duration: 400, gridUnits:true, ease: "easeOutCubic"})
        .animateProperty("sprite", "width", { from: 0.05, to: 0, duration: 250, gridUnits:true, ease: "easeOutCubic", delay: 500})
        .animateProperty("sprite", "height", { from: 0.05, to: 0, duration: 250, gridUnits:true, ease: "easeOutCubic", delay: 500})
        .zIndex(1)  
        .waitUntilFinished(-450)  
      
      .canvasPan()
        .delay(250)
        .shake({ duration: 1100, strength: 1, rotation: false, fadeOut: 500 })

      .effect()
        .delay(251)
        .file(closest(`eskie.symbol.animal.${spirit}.${color}`))
        .attachTo(token,{offset:{y:-0}, gridUnits:true})
        .scaleToObject(1)
        .playbackRate(1)
        .startTime(2000)
        .duration(4000)
        .fadeIn(500, {ease:"easeOutCubic"})
        .scaleIn(0.3, 2500, {ease: "easeOutSine"})
        .opacity(0.9)
        .fadeOut(1500, {ease:"easeInSine"})
        .zIndex(5)

      .effect()
        .delay(251)
        .file(closest(`eskie.symbol.animal.${spirit}.${color}`))
        .attachTo(token,{offset:{y:-0}, gridUnits:true})
        .scaleToObject(3.25)
        .startTime(2000)
        .duration(4000)
        .fadeIn(500, {ease:"easeOutCubic"})
        .scaleIn(0.3, 2500, {ease: "easeOutSine"})
        .opacity(0.35)
        .belowTokens()
        .animateProperty("sprite", "position.y", { from: 0, to: -0.5, duration: 2000, gridUnits:true,ease:"easeOutCubic"})
        .fadeOut(1500, {ease:"easeInSine"})
        .zIndex(5)      
      
      .effect()
        .delay(250)
        .copySprite(token)
        .attachTo(token)
        .duration(3500) 
        .fadeOut(1500)
        .loopProperty("sprite", "position.y", { from: -0.035, to: 0.035, duration: 25, gridUnits:true, pingPong:true})
        .filter("ColorMatrix", { brightness:0 })  
        .filter("Blur", { blurX: 0, blurY: 10 })  
        .belowTokens()
        .zIndex(2);
      
      if (effect.ground.enabled) {
        seq = seq.effect()
            .delay(250)
            .file(closest("jb2a.impact.ground_crack.orange.02"))
            .atLocation(token)
            .belowTokens()
            .filter("ColorMatrix", {hue: -15,saturate: 1})
            .size(3.5, {gridUnits: true})
            .zIndex(1)
        
        .effect()
            .delay(250)
            .file(closest("jb2a.impact.ground_crack.still_frame.02"))
            .atLocation(token)
            .belowTokens()
            .fadeIn(1000)
            .filter("ColorMatrix", {hue: -15,saturate: 1})
            .size(3.5, {gridUnits: true})
            .zIndex(0);

        seq = (effect.ground.duration > 0) ? seq.duration(effect.ground.duration) : seq.persist();
      }

      seq = seq.effect()
        .delay(250)
        .file(closest("eskie.sound.roar.02"))
        .atLocation(token)
        .size(8, {gridUnits: true})
        .opacity(0.5)
      
      .effect()
        .delay(250)
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(token, {offset: {y:-0.05}, gridUnits: true})
        .scaleToObject(1.5)
        .opacity(0.9)
        .filter("ColorMatrix", {saturate: 1})
        .playbackRate(1.5)
        .duration(8000)
        .fadeOut(3000)
        .zIndex(1)
      
      .effect()
        .delay(250)
        .name(label)  
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(token, {offset: {y:-0.05}, gridUnits: true})
        .scaleToObject(1)
        .opacity(0.5)
        .filter("ColorMatrix", {saturate: 1})
        .playbackRate(1)
        .fadeOut(500)
        .persist()
        .zIndex(1)
      
      .effect()
        .delay(250)
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token)
        .name(label)
        .attachTo(token)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .filter("ColorMatrix", {saturate: 1})
        .tint("#FF0000")
        .persist()
        .private()
        .zIndex(1)
      
      .effect()
        .file(closest(`eskie.aura.token.generic.02.${color}`))
        .name(label)
        .attachTo(token)
        .scaleToObject(2.1)
        .persist()
    return seq;
}