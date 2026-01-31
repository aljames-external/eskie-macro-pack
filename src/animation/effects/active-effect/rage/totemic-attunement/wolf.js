//Last Updated: 1/27/2025
//Author: .eskie

import { closest } from "../../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'Wolf Totemic Attunement',
    color: 'red',
};

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, color } = mConfig;
    const label = `${id} - ${token.id}`;

    const mid = {
        x: (target.center.x - token.center.x)* 0.25,
        y: (target.center.y - token.center.y)* 0.25,
    };

    const back = {
        x: (target.center.x - token.center.x)* -0.25,
        y: (target.center.y - token.center.y)* -0.25,
    };

    const seq = new Sequence()
        .animation()
            .delay(100)
            .on(token)
            .opacity(0)  

        .effect()
            .delay(100)
            .file(closest(`jb2a.bite.400px.${color}`))
            .atLocation(target)
            .scaleToObject(3)
            .belowTokens()
            .tint("#ff0000")
            .opacity(0.8)

        .effect()
            .delay(150)
            .copySprite(target)
            .attachTo(target)
            .duration(1000) 
            .fadeOut(500)
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 25, gridUnits:true, pingPong:true})
            .tint("#ff0000")
            .opacity(0.35)  

        .effect()
            .delay(200)
            .file(closest(`jb2a.impact.008.${color}`))
            .atLocation(target,{offset:{x:-mid.x,y:-mid.y}})
            .size(token.document.width+1, {gridUnits:true})
            .zIndex(1)

        .effect()
            .name(label)  
            .file(closest(`eskie.buff.loop.simple.${color}`))
            .atLocation(token, {offset: {y:-0.05}, gridUnits: true})
            .scaleToObject(1)
            .opacity(0.5)
            .filter("ColorMatrix", {saturate: 1})
            .playbackRate(1)
            .fadeOut(500)
            .duration(1600) 
            .animateProperty("sprite", "position.x", { from: 0, to: mid.x, duration: 250, ease:"easeOutExpo",delay:200})
            .animateProperty("sprite", "position.y", { from: 0, to: mid.y, duration: 250, ease:"easeOutExpo",delay:200})
            .animateProperty("sprite", "position.x", { from: 0, to: -mid.x+back.x, duration: 250, ease:"easeOutExpo",delay:1000})
            .animateProperty("sprite", "position.y", { from: 0, to: -mid.y+back.y, duration: 250, ease:"easeOutExpo",delay:1000}) 
            .animateProperty("sprite", "position.x", { from: 0, to: -back.x, duration: 250, ease:"easeOutSine",delay:1250})
            .animateProperty("sprite", "position.y", { from: 0, to: -back.y, duration: 250, ease:"easeOutSine",delay:1250})
            .zIndex(0.2)

        .effect()
            .file(closest(`eskie.aura.token.generic.02.${color}`))
            .name(label)
            .atLocation(token)
            .scaleToObject(2.1)
            .startTime(500)
            .duration(2000)
            .animateProperty("sprite", "position.x", { from: 0, to: mid.x, duration: 250, ease:"easeOutExpo",delay:200})
            .animateProperty("sprite", "position.y", { from: 0, to: mid.y, duration: 250, ease:"easeOutExpo",delay:200})
            .animateProperty("sprite", "position.x", { from: 0, to: -mid.x+back.x, duration: 250, ease:"easeOutExpo",delay:1000})
            .animateProperty("sprite", "position.y", { from: 0, to: -mid.y+back.y, duration: 250, ease:"easeOutExpo",delay:1000}) 
            .animateProperty("sprite", "position.x", { from: 0, to: -back.x, duration: 250, ease:"easeOutSine",delay:1250})
            .animateProperty("sprite", "position.y", { from: 0, to: -back.y, duration: 250, ease:"easeOutSine",delay:1250})
            .zIndex(0.3)


        .effect()
            .copySprite(token)
            .atLocation(token)
            .animateProperty("sprite", "position.x", { from: 0, to: mid.x, duration: 250, ease:"easeOutExpo",delay:200})
            .animateProperty("sprite", "position.y", { from: 0, to: mid.y, duration: 250, ease:"easeOutExpo",delay:200})
            .animateProperty("sprite", "position.x", { from: 0, to: -mid.x+back.x, duration: 250, ease:"easeOutExpo",delay:1000})
            .animateProperty("sprite", "position.y", { from: 0, to: -mid.y+back.y, duration: 250, ease:"easeOutExpo",delay:1000}) 
            .animateProperty("sprite", "position.x", { from: 0, to: -back.x, duration: 250, ease:"easeOutSine",delay:1250})
            .animateProperty("sprite", "position.y", { from: 0, to: -back.y, duration: 250, ease:"easeOutSine",delay:1250})
            .zIndex(0.1)
            .duration(1600)
            .waitUntilFinished(-700)  

        .animation()
            .delay(550)  
            .on(token)
            .opacity(1)    

        .canvasPan()
            .shake({ duration: 1100, strength: 1, rotation: false, fadeOut: 500 })

        .effect()
            .file(closest(`eskie.sound.roar.01`))
            .atLocation(target,{offset:{x:-mid.x,y:-mid.y}})
            .size(token.document.width+5,{gridUnits:true})

        .animation()
            .delay(100)
            .on(target)
            .opacity(0)

        .effect()
            .copySprite(target)
            .attachTo(target, {bindAlpha:false, bindRotation:false,local:false})
            .scaleToObject(0.9)
            .zIndex(0.1)
            .belowTokens()
            .filter("ColorMatrix", { brightness:0 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.65)
            .duration(1200)

        .effect()
            .delay(100)
            .file(closest(`eskie.damage.piercing.01.${color}`))
            .attachTo(target,{bindAlpha:false,bindRotation:false})
            .scaleToObject(1.5)
            .opacity(1)
            .zIndex(1)
            .belowTokens()
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", gridUnits: true })
            .filter("ColorMatrix", { saturate:1 })

        .effect()
            .copySprite(target)
            .attachTo(target, {bindAlpha:false, bindRotation:false,local:false})
            .scaleToObject(1)
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", delay:100, gridUnits: true })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.5, duration: 250, ease: "easeOutCubic", delay:600, gridUnits: true })
            .animateProperty("sprite", "rotation", { from: 0, to: 90, duration: 250, ease: "easeOutCubic", delay:100 })  
            .duration(1200)
            .waitUntilFinished(-500)

        .effect()
            .file(closest(`eskie.smoke.03.tan`))
            .attachTo(target,{bindAlpha:false,bindRotation:false})
            .scaleToObject(2)
            .opacity(0.8)
            .belowTokens()

        .animation()
            .delay(300)
            .on(target)
            .opacity(1)
            .rotate(target.document.rotation+90);

    return seq;
}

export const wolfAttunement = {
    create,
    play,
};