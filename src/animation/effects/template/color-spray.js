//Last Updated: 12/21/2025
//Author: EskieMoh#2969
//Modified by: Gornetron
//Modular by: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'colorSpray',
    wave_count: 10,
    delay: 200,
}

function createSpellCircle(token, mConfig) {
    const { position } = mConfig;
    const seq = new Sequence()
        .effect()
            .file(closest("jb2a.particles.outward.greenyellow.02.03"))
            .atLocation(token) 
            .delay(150)
            .anchor({ x: 0.1})
            .size(2.5,{gridUnits:true})
            .rotateTowards(position, {randomOffset: 0.25, cacheLocation: true})
            .fadeIn(1400, {ease:"easeOutBack"})
            .filter("ColorMatrix", {saturate: -1, brightness:2})
            .fadeOut(400)
            .duration(7000)
            .opacity(0.8)
            .zIndex(3)

        .effect()
            .attachTo(token)
            .anchor({ x: -0.5 })
            .size({width:0.4,height:1},{gridUnits:true})
            .file(closest("jb2a.magic_signs.circle.02.illusion.loop.yellow"))
            .rotateTowards(position)
            .mirrorY()
            .scaleIn(0, 500, {ease: "easeOutCubic"})
            .scaleOut(0, 500, {ease: "easeOutCubic"})
            .loopProperty("alphaFilter", "alpha", { from: 0, to: -0.5, duration: 1000,pingPong:true})
            .filter("ColorMatrix", {saturate: -1, brightness:1.2})
            .fadeOut(300)
            .duration(7000)

        .zIndex(0);
    return seq;
}

function createBolt(token, i, mConfig) {
    const { delay, position } = mConfig;

    const seq = new Sequence()
        .effect()
            .file("jb2a.energy_strands.range.standard.blue")
            .atLocation(token, {offset:{x:0.2},gridUnits:true, local:true}) 
            .delay(i * delay)
            .stretchTo(position, {randomOffset: 1, gridUnits: true, cacheLocation: true})
            .filter("ColorMatrix", {hue: 24*i-24})
            .randomizeMirrorY()
            .fadeIn(500, {ease:"easeOutBack"})
            .fadeOut(400)
            .opacity(1)
            .zIndex(1)

        .effect()
            .file("jb2a.energy_strands.range.standard.blue")
            .atLocation(token, {offset:{x:0.2,y:0.2},gridUnits:true, local:true}) 
            .delay(i * delay)
            .stretchTo(position, {offset:{y:-1},randomOffset: 1, gridUnits: true, cacheLocation: true, local: true})
            .filter("ColorMatrix", {hue: 24*i+96})
            .randomizeMirrorY()
            .fadeIn(500, {ease:"easeOutBack"})
            .fadeOut(400)
            .opacity(1)
            .duration(900)
            .zIndex(1)

        .effect()
            .file("jb2a.energy_strands.range.standard.blue")
            .atLocation(token, {offset:{x:0.2,y:-0.2},gridUnits:true, local:true}) 
            .delay(i * delay)
            .stretchTo(position, {offset:{y:1},randomOffset: 1, gridUnits: true, cacheLocation: true, local:true})
            .filter("ColorMatrix", {hue: 24*i-144})
            .randomizeMirrorY()
            .fadeIn(500, {ease:"easeOutBack"})
            .fadeOut(400)
            .opacity(1)
            .duration(900)

        .zIndex(1)
    return seq;
}

async function create(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { wave_count, template } = mConfig;

    let position;
    if (template) {
        const farpoint = template._object.ray.B;        // Get the furthest point on the cone
        position = { x: farpoint.x, y: farpoint.y };    // Decouple from the template so when it is deleted we don't crash
    } else {
        // TODO - better sequencer crosshairs for cones
        position = await Sequencer.Crosshair.show();
        if (position.cancelled) { return; }
    }
    if (!position) { return; }

    mConfig.position = position;

    const seq = createSpellCircle(token, mConfig);
    for (let i = 0; i < wave_count; i++) {
        seq.addSequence(createBolt(token, i, mConfig))
    }
    return seq;
}

async function play(token, config) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

export const colorSpray = {
    create,
    play,
}

autoanimations.register('Color Spray', 'template', 'eskie.effect.colorSpray', DEFAULT_CONFIG);