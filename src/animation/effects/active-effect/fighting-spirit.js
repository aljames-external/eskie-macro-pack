//Last Updated: 12/22/2025
//Author: .eskie

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: "Fighting Spirit",
}

function create(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    const label = `${id} - ${token.name}`;

    const seq =  new Sequence()
        .effect()
            .name(label)
            .copySprite(token)
            .attachTo(token)
            .scaleToObject(1,{considerTokenScale:true})
            .filter("Glow", { color: 0xf20736,knockout:true })
            .spriteRotation(-token.document.rotation)
            .fadeIn(1000)
            .fadeOut(500)
            .belowTokens()
            .loopProperty("sprite", "scale.x", { from:1, to: 0.975, duration: 1500,  pingPong:true})
            .loopProperty("sprite", "scale.y", { from: 1, to: 0.975, duration: 1500, pingPong:true})
            .persist()
        
        .effect()
            .file(closest("blfx.spell.cast.swirl1.fire1"))
            .attachTo(token)
            .scaleToObject()
            .filter("ColorMatrix", { hue: -25, saturate:1 })
            .playbackRate(1.15)
            .zIndex(0)
            .waitUntilFinished(-750)

        .effect()
            .file(closest("eskie.buff.loop.simple.red"))
            .attachTo(token, {offset:{y:-0.25},gridUnits:true})
            .scaleToObject(1.25)
            .spriteScale({x:1,y:1.25}, {gridUnits:true})
            .playbackRate(1.5)
            .duration(1500)
            .fadeOut(750)
            .zIndex(1)

        .effect()
            .file(closest("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{y:-0},gridUnits:true})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(5750, {ease:"easeOutQuint"})
            .spriteRotation(20)
            .belowTokens()
            .opacity(0.5)
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutCubic"})

        .effect()
            .name(label)
            .file(closest("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{y:0.25},gridUnits:true})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutQuint"})
            .spriteRotation(20)
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutCubic"})
            .belowTokens()
            .persist()

        .effect()
            .name(label)
            .file(closest("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{y:0.25},gridUnits:true})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .spriteRotation(20)
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutCubic"})
            .zIndex(0)

        .effect()
            .name(label)
            .file(closest("eskie.fire.02.orange"))
            .attachTo(token,{offset:{y:-0.05}, gridUnits:true})
            .scaleToObject(0.35)
            .scaleIn(0, 250, {ease: "easeOutQuint"})
            .filter("ColorMatrix", { hue: -30, saturate:0.5})
            .playbackRate(2)
            .loopProperty("sprite", "scale.x", { from: 1, to: 1.15, duration: 1500,  pingPong:true})
            .loopProperty("sprite", "scale.y", { from: 1, to: 1.15, duration: 1500, pingPong:true})
            .persist()
            .zIndex(0)
            .waitUntilFinished()

        .effect()
            .file(closest("jb2a.impact.010.red"))
            .attachTo(token,{offset:{y:-0}, gridUnits:true})
            .scaleToObject(0.45)
            .filter("ColorMatrix", { hue: 0, saturate:1})
            .zIndex(0);
    return seq;
}

async function play(token, config) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token, config) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} ${token.name}`;
    Sequencer.EffectManager.endEffects({ name: label, object: token }); 
}

export const fightingSpirit = { 
    create,
    play,
    stop,
};

autoanimations.register("Fighting Spirit", "effect", "eskie.effect.fightingSpirit", DEFAULT_CONFIG);