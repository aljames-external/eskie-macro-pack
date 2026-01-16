// Author: .eskie
// Modular Conversion: bakanabaka

import { file } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'stunningFist',
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    const middleposition = {
        x: (target.center.x - token.center.x)* 0.25,
        y: (target.center.y - token.center.y)* 0.25,
    };

    let seq = new Sequence();

    seq.animation()
        .delay(250)
        .on(token)
        .opacity(0)

    .animation()
        .delay(250)
        .on(target)
        .opacity(0)

    .effect()
        .copySprite(target)
        .attachTo(target, {bindAlpha: false})
        .spriteRotation(-target.document.rotation)
        .animateProperty("sprite", "position.x", { from: 0, to: token.document.texture.scaleX*middleposition.x+0.5, duration: 100, ease:"easeOutExpo", delay: 1350})
        .animateProperty("sprite", "position.y", { from: 0, to: token.document.texture.scaleY*middleposition.y+0.5, duration: 100, ease:"easeOutExpo", delay: 1350})
        .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 150, ease:"easeOutCubic", delay: 1300})
        .animateProperty("sprite", "rotation", { from: 0, to: -45, duration: 350, ease:"easeOutBack", delay: 1450})
        .animateProperty("sprite", "position.x", { from: 0, to: -token.document.texture.scaleX*middleposition.x-0.5, duration: 250, ease:"easeInOutQuad", delay: 1450})
        .animateProperty("sprite", "position.y", { from: 0, to: -token.document.texture.scaleY*middleposition.y-0.5, duration: 250, ease:"easeInOutQuad", delay: 1450})
        .scaleToObject(1, {considerTokenScale: true})
        .fadeIn(200, {delay:1250})
        .fadeOut(500)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .opacity(0.25)
        .duration(2500)  

    .effect()
        .copySprite(target)
        .attachTo(target, {bindAlpha: false})
        .spriteRotation(-target.document.rotation)
        .animateProperty("sprite", "position.x", { from: 0, to: token.document.texture.scaleX*middleposition.x+0.5, duration: 100, ease:"easeOutExpo", delay: 1350})
        .animateProperty("sprite", "position.y", { from: 0, to: token.document.texture.scaleY*middleposition.y+0.5, duration: 100, ease:"easeOutExpo", delay: 1350})
        .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 150, ease:"easeOutCubic", delay: 1300})
        .animateProperty("sprite", "rotation", { from: 0, to: -45, duration: 350, ease:"easeOutBack", delay: 1450})
        .animateProperty("sprite", "position.x", { from: 0, to: -token.document.texture.scaleX*middleposition.x-0.5, duration: 250, ease:"easeInOutQuad", delay: 1450})
        .animateProperty("sprite", "position.y", { from: 0, to: -token.document.texture.scaleY*middleposition.y-0.5, duration: 250, ease:"easeInOutQuad", delay: 1450})
        .scaleToObject(1, {considerTokenScale: true})
        .duration(2000)  

    .effect()
        .copySprite(token)
        .attachTo(token, {bindAlpha: false})
        .spriteRotation(-token.document.rotation)
        .animateProperty("sprite", "position.x", { from: 0, to: token.document.texture.scaleX*middleposition.x, duration: 100, ease:"easeOutExpo", delay: 1250})
        .animateProperty("sprite", "position.y", { from: 0, to: token.document.texture.scaleY*middleposition.y, duration: 100, ease:"easeOutExpo", delay: 1250})
        .animateProperty("sprite", "position.x", { from: 0, to: -token.document.texture.scaleX*middleposition.x, duration: 350, ease:"easeInOutQuad", delay: 1350})
        .animateProperty("sprite", "position.y", { from: 0, to: -token.document.texture.scaleY*middleposition.y, duration: 350, ease:"easeInOutQuad", delay: 1350})
        .scaleToObject(1, {considerTokenScale: true})
        .duration(2000)

    .effect()
        .file(file("jb2a.sacred_flame.target.blue"))
        .atLocation(token, {offset:{y:0}, gridUnits:true})
        .scaleToObject(0.5)
        .playbackRate(2)
        .fadeOut(100)
        .zIndex(2)

    .effect()
        .file(file("eskie.aura.token.generic.02.blue"))
        .attachTo(token, {bindAlpha: false})
        .scaleToObject(2.1, {considerTokenScale:true})
        .fadeIn(1000)
        .opacity(0.75)
        .startTime(1500)

    .effect()
        .file(file("jb2a.particles.inward.blue.01.01"))
        .attachTo(token)
.opacity(0.35)
        .scaleToObject(1.5)
        .filter("ColorMatrix", {saturate: 1})
        .fadeIn(500)
        .duration(1500)
        .mask(token)
        .fadeOut(250)

    .effect()
        .file(file("eskie.nature.flower.particle.01.blue"))
        .atLocation(token)
        .scaleToObject(0.75)
        .duration(1500)
        .fadeOut(250)
        .opacity(1)
        .zIndex(1)
        .waitUntilFinished(-1250)

    .wait(750)

    .effect()
        .delay(100)
        .file(file("eskie.slice.01.white.colorless"))
        .atLocation(target)
        .scaleToObject(5)
        .rotateTowards(token)
        .spriteOffset({x:-3},{gridUnits:true})
        .playbackRate(1.5)
        .opacity(0.5)
        .belowTokens()

    .effect()
        .file(file("eskie.velocity.01.white"))
        .atLocation(target)
        .scaleToObject(3)
        .rotateTowards(token)
        .playbackRate(1.25)
        .spriteOffset({x:-2},{gridUnits:true})
        .opacity(0.5)
        .zIndex(5)

    .effect()
        .file(file("jb2a.melee_generic.creature_attack.fist.002.blue"))
        .atLocation(token, {offset:{x:-0.75 , y:-0.2}, gridUnits:true, local:true})
        .rotateTowards(target,{randomOffset:0.15})
        .scaleToObject(3)
        .spriteOffset({x:-0.3-(token.document.width-1) , y:-0.2*token.document.width}, {gridUnits:true})
        .zIndex(2)

    .effect()
        .file(file("jb2a.swirling_leaves.outburst.01.pink"))
        .scaleIn(0, 500, {ease: "easeOutCubic"}) 
        .filter("ColorMatrix", { saturate: 1, hue: -105 })
        .scaleToObject(0.75)
        .fadeOut(2000)
        .atLocation(token)
        .zIndex(1)

    .canvasPan()
        .delay(250)
        .shake({duration: 250, strength: 2, rotation: false })

    .animation()
        .on(token)
        .opacity(1)
        .delay(600)

    .animation()
        .on(target)
        .opacity(1)
        .delay(600)

    .effect()
        .file(file("jb2a.impact.010.blue"))
        .scaleIn(0, 100, {ease: "easeOutCubic"}) 
        .scaleToObject(2.5)
        .atLocation(target)
        .randomRotation()

    .effect()
        .file(file("jb2a.impact.ground_crack.blue.02"))
        .scaleIn(0, 100, {ease: "easeOutCubic"}) 
        .scaleToObject(2.5)
        .atLocation(target)
        .randomRotation()
        .belowTokens()

    .effect()
        .delay(1000)
        .file(file("jb2a.dizzy_stars.200px.yellow"))
        .scaleIn(0, 100, {ease: "easeOutCubic"}) 
        .scaleToObject(1)
        .opacity(1)
        .attachTo(target, {offset:{y:-0.5*target.document.width}, gridUnits:true});
    
    return seq;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) { return sequence.play({preload:true}); }
}

export const stunningFist = {
    create,
    play,
};

autoanimations.register("Stunning Fist", "melee-target", "eskie.effect.stunningFist", DEFAULT_CONFIG)