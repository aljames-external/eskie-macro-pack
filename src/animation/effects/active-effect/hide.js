//Last Updated: 12/15/2025
//Author: .eskie
//Integration: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: "hide"
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;

    let seq = new Sequence()
      .effect()
        .copySprite(token)
        .attachTo(token)
        .duration(1500) 
        .animateProperty("sprite", "width", { from: 0, to: 0.05, duration: 400, gridUnits:true, ease: "easeOutCubic"})
        .animateProperty("sprite", "height", { from: 0, to:  0.05, duration: 400, gridUnits:true, ease: "easeOutCubic"})
        .animateProperty("sprite", "width", { from: 0, to: - 0.05, duration: 250, gridUnits:true, ease: "easeOutCubic", delay: 500})
        .animateProperty("sprite", "height", { from: 0, to: - 0.05, duration: 250, gridUnits:true, ease: "easeOutCubic", delay: 500})
        .filter("Glow", { color: 0x000000 })
        .tint("#696969")
        .fadeIn(500, {delay:150})
        .fadeOut(1000)
     
      .effect()
        .copySprite(token)
        .attachTo(token)
        .duration(750) 
        .animateProperty("sprite", "width", { from: 0, to: 0.05, duration: 400, gridUnits:true, ease: "easeOutCubic"})
        .animateProperty("sprite", "height", { from: 0, to:  0.05, duration: 400, gridUnits:true, ease: "easeOutCubic"})
        .animateProperty("sprite", "width", { from: 0, to: - 0.05, duration: 250, gridUnits:true, ease: "easeOutCubic", delay: 500})
        .animateProperty("sprite", "height", { from: 0, to: - 0.05, duration: 250, gridUnits:true, ease: "easeOutCubic", delay: 500})
        .fadeOut(250)
        .zIndex(1)  
        .waitUntilFinished(-250)  

      .effect()
        .file(closest("eskie.smoke.03.black"))
        .attachTo(token)
        .scaleToObject(1.75)
        .opacity(1)
        .randomRotation()
        .fadeOut(1000)
        .zIndex(2)
        .tint("#696969")

      .animation()
        .on(token)
        .tint("#696969")
        .opacity(0.8)
  
    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token, config = {}) {
    new Sequence()

      .animation()
        .on(token)
        .opacity(1)
        .tint("#FFFFFF")
      
    .play();
}

export const hide = {
    create,
    play,
    stop,
};

autoanimations.register("Hide", "effect", "eskie.effect.hide", DEFAULT_CONFIG);