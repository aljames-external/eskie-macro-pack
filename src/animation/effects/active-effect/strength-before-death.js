//Last Updated: 12/22/2025
//Author: .eskie

import { file } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: "Strength Before Death",
    tintMap: true,      //Set Map Tint
    cinemaBars: true    //Set Cinema Bars
}

function create(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, tintMap, cinemaBars } = mConfig;

    // Scene bounds in canvas coords (handles scenes that don't start at 0,0)
    const rect = canvas.dimensions.sceneRect; // { x, y, width, height }
    const left   = rect.x;
    const top    = rect.y;
    const right  = rect.x + rect.width;
    const bottom = rect.y + rect.height;

    // Token center in canvas coords
    const { x: cx, y: cy } = token.center;

    // Max distance (in pixels) from token center to any edge
    const maxPx = Math.max(
        cx - left,     // to left edge
        right - cx,    // to right edge
        cy - top,      // to top edge
        bottom - cy    // to bottom edge
    );

    // Convert pixels -> grid units (squares). Sequencer uses gridUnits when gridUnits:true
    const radiusGU = maxPx / canvas.grid.size;

    const seq = new Sequence()
        .effect()
            .name(`${id} ${token.name}`)
            .atLocation(token)
            .shape("circle", {
                radius: radiusGU,
                gridUnits: true,
                name: "test",
                fillAlpha: 0.75,
                fillColor: "#000000"        
            })
            .belowTiles()
            .fadeIn(1000)
            .fadeOut(2000)
            .duration(7000)
            .filter("Blur", { blurX: 10, blurY: 10 })
            .animateProperty("shapes.test", "scale.x", { from: 0, to: 1.1, duration: 4500,  ease: "easeInSine" })
            .animateProperty("shapes.test", "scale.y", { from: 0, to: 1.1, duration: 4500,  ease: "easeInSine" })
            .persist(tintMap)


        .effect()
            .delay(1000)
            .name(`${id} ${token.name}`)
            .file(file("eskie.screen_overlay.cinema_bars.01"))
            .screenSpace()
            .screenSpaceScale({fitX:true, fitY:true})
            .persist()
            .playIf(cinemaBars)

        .wait(4500)

        .effect()
            .delay(50)
            .file(file("jb2a.impact.ground_crack.02.orange"))
            .attachTo(token)
            .scaleToObject(2.5)
            .filter("ColorMatrix", {hue: -15,saturate: 1})
            .belowTokens()

        .effect()
            .delay(250)
            .file(file("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
            .attachTo(token)
            .scaleToObject(5)
            .opacity(0.15)
            .belowTokens()

        .effect()
            .file(file("eskie.aura.token.generic.01.red"))
            .attachTo(token)
            .scaleToObject(2.2)
            .animateProperty("sprite", "scale.y", { from: 0, to: 1.5, duration: 1500,  ease: "easeOutQuint" })
            .animateProperty("sprite", "position.y", { from: 0, to: -0.25, duration: 1500,  ease: "easeOutQuint", gridUnits:true })
            .belowTokens()
            .duration(1750)
            .fadeOut(1000)
            .filter("ColorMatrix", { hue: -7})
            .zIndex(2)

        .canvasPan()
        .shake({ duration: 500, strength: 1.5, rotation: false, fadeOut: 250 }) 

        .effect()
            .name(`${id} ${token.name}`)
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{y:0.25},gridUnits:true})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutQuint"})
            .spriteRotation(20)
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutCubic"})
            .belowTokens()
            .persist()

        .wait(100)

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:-1,y:-1},gridUnits:true, randomOffset: 1})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-1,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
            .opacity(0.8)

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:1,y:-1},gridUnits:true, randomOffset: 1})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-1,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
            .opacity(0.8)

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:-1,y:1},gridUnits:true, randomOffset: 1})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-1,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
            .opacity(0.8)

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:1,y:1},gridUnits:true, randomOffset: 1})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-1,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
            .opacity(0.8)

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:2,y:0},gridUnits:true, randomOffset: 1})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-1,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
            .opacity(0.8)

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:0,y:1.5},gridUnits:true, randomOffset: 1})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-1,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
            .opacity(0.8)

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:-2,y:0},gridUnits:true, randomOffset: 1})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-1,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
            .opacity(0.8)

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:0,y:-1.5},gridUnits:true, randomOffset: 1})
            .scaleToObject(2)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(1000, {ease:"easeOutSine"})
            .duration(1250)
            .animateProperty("sprite", "position.y", {from: 0, to:-1,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
            .opacity(0.8)

        .effect()
            .delay(50,250)
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:-1,y:-1},gridUnits:true, randomOffset: 1})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(3000, {ease:"easeOutSine"})
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutSine"})
    
        .effect()
            .delay(50,250)
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:1,y:-1},gridUnits:true, randomOffset: 1})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(3000, {ease:"easeOutSine"})
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutSine"})

        .effect()
            .delay(50,250)
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:-1,y:1},gridUnits:true, randomOffset: 1})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(3000, {ease:"easeOutSine"})
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutSine"})

        .effect()
            .delay(50,250)
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:1,y:1},gridUnits:true, randomOffset: 1})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(3000, {ease:"easeOutSine"})
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutSine"})

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:2,y:0},gridUnits:true, randomOffset: 1})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(3000, {ease:"easeOutSine"})
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutSine"})

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:0,y:1.5},gridUnits:true, randomOffset: 1})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(3000, {ease:"easeOutSine"})
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutSine"})

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:-2,y:0},gridUnits:true, randomOffset: 1})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(3000, {ease:"easeOutSine"})
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutSine"})

        .effect()
            .file(file("eskie.nature.flower.particle.01.red"))
            .attachTo(token, {offset:{x:0,y:-1.5},gridUnits:true, randomOffset: 1})
            .scaleToObject(1.5)
            .fadeIn(250, {ease:"easeOutQuint"})
            .fadeOut(3000, {ease:"easeOutSine"})
            .animateProperty("sprite", "position.y", {from: 0, to:-0.5,  duration: 1000, gridUnits: true, ease:"easeOutSine"})

        .effect()
            .name(`${id} ${token.name}`)
            .copySprite(token)
            .attachTo(token)
            .mask(token)
            .opacity(0.25)
            .loopProperty("sprite", "scale.y", { from: 1, to: 1.25, duration: 2000,  ease: "easeInOutSine" })
            .loopProperty("sprite", "scale.x", { from: 1, to: 1.25, duration: 2000,  ease: "easeInOutSine" })
            .loopProperty("sprite", "alpha", { from: 0.25, to: -0.25, duration: 2000,  ease: "easeInOutSine" })
            .persist()
    return seq;
}

async function play(token, config) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token, config) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    Sequencer.EffectManager.endEffects({ name: `${id} ${token.name}` }); 
}

export const strengthBeforeDeath = { 
    create,
    play,
    stop,
};

autoanimations.register("Strength Before Death", "effect", "eskie.effect.strengthBeforeDeath", DEFAULT_CONFIG);