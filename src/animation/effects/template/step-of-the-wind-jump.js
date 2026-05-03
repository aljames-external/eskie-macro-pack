// Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { templates } from '../../../lib/templates.js';
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'step-of-the-wind-jump'
};

async function create(token, config = {}) {
    let { id, template } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    //Determine Jump Timings
    let jumpTime = 750;
    let upTime = jumpTime*0.5;
    let downTime = jumpTime*0.4;

    const cfg = { 
        radius: 1,
        max: 500,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: 'Step of the Wind'
    };
    let [position, _] = await templates.getPosition(template, cfg);
    if (!position || position.cancelled ) { return; }

    // Determine Trail Direction
    let dx = position.x - token.center.x;
    let dy = position.y - token.center.y;

    let trailOffset  = { x: -0.75, y: 0 };
    let trailRotFrom = -45;
    let trailRotTo   = 45;
    let mirrorTrail  = false;

    if (dx > 0) {
        //Trail Right (Default)  
        trailOffset = { x: -0.75, y: 0 };
        trailRotFrom = -45;
        trailRotTo   = 45;
        mirrorTrail = false;
    } else if (dx < 0) {
        //Trail Left
        trailOffset = { x: 0.75, y: 0 };
        trailRotFrom = 45;
        trailRotTo   = -45;
        mirrorTrail = true;
    } else {
        if (dy > 0) {
            //Trail Down
            trailRotFrom = 90;
            trailRotTo   = 90;
        } else if (dy < 0) {
            //Trail Up
            trailRotFrom = -90;
            trailRotTo   = -90;
        }
    }

    let seq = new Sequence();
    
    seq.wait(100)

        .animation()
            .delay(200)
            .on(token)
            .opacity(0)

        .effect()
            .file(closest("eskie.smoke.03.white"))
            .atLocation(token)
            .scaleToObject(1.75)
            .belowTokens()
            .randomRotation()
            .scaleIn(0, 300, {ease: "easeOutExpo"})
            .opacity(0.85)
            .zIndex(1)

        .effect()
            .file(closest("eskie.nature.flower.particle.01.blue"))
            .atLocation(token)
            .scaleToObject(1.5)
            .playbackRate(2)
            .scaleIn(0, 1000, {ease: "easeOutCubic"})
            .duration(2500)
            .fadeIn(250)
            .fadeOut(1000)
            .spriteRotation(45)
            .zIndex(6)
            .animateProperty("sprite", "height", {from:1, to: 1.5,  duration: 1000, gridUnits: true, ease:"easeOutCubic"})

        .effect()
            .copySprite(token)
            .atLocation(token)   
            .scaleToObject(0.9, { considerTokenScale: true })
            .opacity(0.5)
            .belowTokens()
            .anchor({ x: 0.5, y: 0.5 })
            .filter("ColorMatrix", { brightness: -1 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .animateProperty("sprite", "width", {from: 0, to: -0.15,  duration: upTime, gridUnits: true,delay: 200})
            .animateProperty("sprite", "width", {from: 0, to: 0.15,  duration: downTime, gridUnits: true, delay: upTime+200})
            .animateProperty("sprite", "height", {from: 0, to: -0.15,  duration: upTime, gridUnits: true,delay: 200})
            .animateProperty("sprite", "height", {from: 0, to: 0.15,  duration: downTime, gridUnits: true, delay: upTime+200})
            .moveTowards(position, {ease:"linear", rotate:false,delay: 200})
            .duration(jumpTime+200)
            .zIndex(2)

        .effect()
            .name(`${token.document.name} Step of the Wind (Jump)`)
            .copySprite(token)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(1)
            .animateProperty("sprite", "position.y", {from: 0, to: -1.5,  duration: upTime, gridUnits: true, ease: "easeOutCubic",delay: 200})
            .animateProperty("sprite", "position.y", {from: 0, to: 1.5,  duration: downTime, gridUnits: true, fromEnd: false, ease: "easeInSine", delay: upTime+200})
            .moveTowards(position, {ease:"linear", rotate:false,delay: 200})
            .persist()
            .extraEndDuration(800)
            .duration(jumpTime+200)
            .animateProperty("sprite", "rotation", { from: 0, to: 360, duration: upTime+downTime,ease:"easeInSine", delay:200})
            .zIndex(5)

        .effect()
            .name(`${token.document.name} Step of the Wind (Jump)`)
            .file(closest("eskie.trail.token.generic.01.white"))
            .scaleToObject(1.5, {considerTokenScale: true})
            .atLocation(token)   
            .opacity(1)
            .animateProperty("spriteContainer", "position.y", {from: 0, to: -1.5,  duration: upTime, gridUnits: true, ease: "easeOutCubic",delay: 200})
            .animateProperty("spriteContainer", "position.y", {from: 0, to: 1.5,  duration: downTime, gridUnits: true, fromEnd: false, ease: "easeInSine", delay: upTime+200})
            .moveTowards(position, {ease:"linear", rotate:false,delay: 200})
            .persist()
            .fadeIn(250, {delay:200})
            .fadeOut(50, {ease:"easeOutQuint"})
            .duration(jumpTime+200)
            .animateProperty("spriteContainer", "rotation", { from: trailRotFrom, to: trailRotTo, duration: upTime+downTime,ease:"easeInSine", delay:200})
            .mirrorX(mirrorTrail)
            .spriteOffset(trailOffset,{gridUnits:true})
            .filter("ColorMatrix", { saturate:3})
            .zIndex(5)

        .wait(jumpTime)

        .animation()
            .on(token)
            .teleportTo(position)
            .snapToGrid()
            .waitUntilFinished()

        .thenDo(function(){
            Sequencer.EffectManager.endEffects({ name: `${token.document.name} Step of the Wind (Jump)`})
        })

        .animation()
            .delay(200)
            .on(token)
            .opacity(1)
            .snapToGrid()

        .effect()
            .file(closest("eskie.smoke.03.white"))
            .atLocation(token)
            .scaleToObject(1.75)
            .belowTokens()
            .randomRotation()
            .scaleIn(0, 300, {ease: "easeOutExpo"})
            .opacity(0.85)

        .effect()
            .file(closest("eskie.nature.flower.particle.01.blue"))
            .atLocation(token)
            .scaleToObject(1.5)
            .playbackRate(2)
            .scaleIn(0, 1000, {ease: "easeOutCubic"})
            .duration(2500)
            .fadeIn(250)
            .fadeOut(1000)
            .spriteRotation(45)
            .zIndex(6)
            .animateProperty("sprite", "height", {from:1, to: 1.5,  duration: 1000, gridUnits: true, ease:"easeOutCubic"});
        
    return seq;
}

async function play(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const sequence = await create(token, mConfig);
    if (sequence) { return sequence.play(); }
}


export const stepOfTheWindJump = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Step of the Wind Jump", "template", "eskie.effect.stepOfTheWind.jump", DEFAULT_CONFIG);