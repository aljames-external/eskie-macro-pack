//Last Updated: 1/27/2025
//Author: .eskie

import { closest } from "../../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'Eagle Totemic Attunement',
    flight: {
        wingSize: 1.25,
        flaps: 2,
        sway: 1,
    },
    color: 'red',
};

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { await seq.play(); }
}

function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, color, flight } = mConfig;
    const { wingSize, flaps, sway } = flight;
    const label = `${id} - ${token.id}`;

    let seq = new Sequence();

    seq = seq.animation()
      .delay(100)
      .on(token)
      .opacity(0)
    
    .effect()
      .name(label)
      .copySprite(token)
      .attachTo(token,{ bindAlpha: false})
      .scaleToObject(0.8)
      .zIndex(0.1)
      .persist()
      .belowTokens()
      .filter("ColorMatrix", { brightness:0 })
      .filter("Blur", { blurX: 5, blurY: 10 })
      .opacity(0.65)

    .effect()
      .delay(400)
      .file(closest(`eskie.sound.roar.01`))
      .attachTo(token,{offset:{y:-0.5-(0.1*sway)},gridUnits:true, bindAlpha:false})
      .scaleToObject(3.5)
      .opacity(0.75)
      .randomRotation();
    
    if (flaps != 0) {
    seq = seq.effect()
      .name(label)
      .file(closest(`eskie.wings.bird.01`))
      .attachTo(token,{offset:{y:-0.5-(0.1*sway)},gridUnits:true, bindAlpha:false})
      .scaleToObject(3*wingSize)
      .animateProperty("sprite", "position.y", { from: 0.5+(0.1*sway), to: -0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
      .loopProperty("spriteContainer", "position.y", { values:[0.075*sway,0.1*sway,0.025*sway,0,0.025*sway,0.05*sway], duration: 1000, gridUnits: true, ease: "linear",pingPong: true })
      .playbackRate(2);
      if (flaps > 0) seq = seq.loopOptions({ loops: flaps, loopDelay:1000, endOnLastLoop:true });
      seq = seq.fadeIn(500, {ease:"easeOutCubic", delay:350})
      .fadeOut(500, {ease:"easeOutCubic"})
      .tint("#ff0000")
      .filter("ColorMatrix", {brightness:5, saturate: -1})
      .opacity(0.25)
      .zIndex(0)
      .persist()
    
    .effect()
      .name(label)
      .file(closest(`eskie.wings.bird.01`))
      .attachTo(token,{offset:{y:-0.5-(0.1*sway)},gridUnits:true, bindAlpha:false})
      .scaleToObject(3*wingSize)
      .animateProperty("sprite", "position.y", { from: 0.5+(0.1*sway), to: -0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
      .loopProperty("spriteContainer", "position.y", { values:[0.075*sway,0.1*sway,0.025*sway,0,0.025*sway,0.05*sway], duration: 1000, gridUnits: true, ease: "linear",pingPong: true })
      .playbackRate(2);
      if (flaps > 0) seq = seq.loopOptions({ loops: flaps, loopDelay:1000, endOnLastLoop:true });
      seq = seq.fadeIn(500, {ease:"easeOutCubic", delay:350})
      .fadeOut(500, {ease:"easeOutCubic"})
      .tint("#ff0000")
      .filter("ColorMatrix", {brightness:3, saturate: 1, hue:20})
      .opacity(1)
      .filter("Glow", { color: 0xFF0000, knockout:true, distance:5 })
      .zIndex(0)
      .persist();
    }

    seq = seq.effect()
      .name(label)
      .file(closest(`eskie.buff.loop.simple.${color}`))
      .attachTo(token,{offset:{y:-0.5-(0.1*sway)},gridUnits:true, bindAlpha: false})
      .animateProperty("sprite", "position.y", { from: 0.5+(0.1*sway), to: -0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
      .loopProperty("spriteContainer", "position.y", { values:[0.075*sway,0.1*sway,0.025*sway,0,0.025*sway,0.05*sway], duration: 1000, gridUnits: true, ease: "linear",pingPong: true })
      .scaleToObject(1)
      .opacity(0.5)
      .filter("ColorMatrix", {saturate: 1})
      .playbackRate(1)
      .fadeOut(500)
      .zIndex(0.2)
      .persist()
    
    .effect()
      .name(label)
      .file(closest(`eskie.aura.token.generic.02.${color}`))
      .attachTo(token,{offset:{y:-0.5-(0.1*sway)},gridUnits:true, bindAlpha: false})
      .animateProperty("sprite", "position.y", { from: 0.5+(0.1*sway), to: -0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
      .loopProperty("spriteContainer", "position.y", { values:[0.075*sway,0.1*sway,0.025*sway,0,0.025*sway,0.05*sway], duration: 1000, gridUnits: true, ease: "linear",pingPong: true })
      .scaleToObject(2.1)
      .zIndex(0.2)
      .timeRange(500, 2500)
      .persist()
    
    .effect()
      .name(label)
      .copySprite(token)
      .attachTo(token,{offset:{y:-0.5-(0.1*sway)},gridUnits:true, bindAlpha: false})
      .zIndex(0.1)
      .persist()
      .animateProperty("sprite", "position.y", { from: 0.5+(0.1*sway), to: -0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
      .loopProperty("spriteContainer", "position.y", { values:[0.075*sway,0.1*sway,0.025*sway,0,0.025*sway,0.05*sway], duration: 1000, gridUnits: true, ease: "linear",pingPong: true })

    return seq;
}

async function stop(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} - ${token.id}`;

    await new Sequence().animation().on(token).opacity(1).play();
    return Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const eagleAttunement = {
    create,
    play,
    stop,
};