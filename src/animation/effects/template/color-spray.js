//Last Updated: 1/22/2026
//Author: .eskie
//Modular by: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { templates } from "../../../lib/templates.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'colorSpray',
    wave_count: 4,
}

async function create(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { wave_count, template } = mConfig;

    const cfg = { 
        radius: 1,
        max: 500,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: 'Color Spray'
    };
    let [position, secondary] = await templates.getPosition(template, cfg);
    if (!position) { return; }
    if (!secondary) {
        secondary = position;
        position = token.center;
    }

    const seq = new Sequence();
    
    //Cast Effect
    seq.effect()
        .file(closest("eskie.star.02.white"))
        .atLocation(position)
        .size(token.document.width, {gridUnits:true})
        .zIndex(3);

    seq.effect()
        .file(closest("jb2a.sacred_flame.target.white"))
        .atLocation(position)
        .size(token.document.width*0.65, {gridUnits:true})
        .zIndex(2)
        .scaleIn(0, 500, {ease: "easeOutCubic"})
        .filter("ColorMatrix", { hue: 150, brightness:1.1 })
        .scaleOut(0, 500, {ease: "easeOutCubic"})
        .endTime(2500);

    //Color Spray Effect
    for (let i = 0; i < wave_count; i++){

        const tintColor1 = `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`;
        const tintColor2 = `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`;
        const tintColor3 = `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`;

        const wave = new Sequence();

        wave.effect()
            .file(closest("eskie.pulse.energy.03.fast.white"))
            .atLocation(position)
            .rotateTowards(secondary)
            .spriteOffset({x:-token.document.width*1.1},{gridUnits:true})
            .size(token.document.width*2, {gridUnits:true})
            .tint(tintColor1)
            .zIndex(2)
            .filter("ColorMatrix", { brightness:2 });

        wave.effect()
            .file(closest("jb2a.energy_strands.range.standard.grey"))
            .atLocation(position, {offset:{x:-0.25, y:0}, gridUnits:true, local: true})
            .stretchTo(secondary, {offset:{x:0, y:0}, gridUnits:true, local: true})
            .fadeIn(500, {ease:"easeOutBack"})
            .fadeOut(400)
            .tint(tintColor1)
            .zIndex(1);

        wave.effect()
            .delay(150)
            .file(closest("jb2a.energy_strands.range.standard.grey"))
            .atLocation(position, {offset:{x:-0.25, y:0}, gridUnits:true, local: true})
            .stretchTo(secondary, {offset:{x:-0.5, y:-1}, gridUnits:true, local: true})
            .fadeIn(500, {ease:"easeOutBack"})
            .fadeOut(400)
            .mirrorY()
            .tint(tintColor2)
            .zIndex(1);

        wave.effect()
            .delay(300)
            .file(closest("jb2a.energy_strands.range.standard.grey"))
            .atLocation(position, {offset:{x:-0.25, y:0}, gridUnits:true, local: true})
            .stretchTo(secondary, {offset:{x:-0.5, y:1}, gridUnits:true, local: true})
            .mirrorY()
            .fadeIn(500, {ease:"easeOutBack"})
            .fadeOut(400)
            .tint(tintColor3)
            .zIndex(1);

        wave.effect()
            .delay(150)
            .file(closest("eskie.star.twinkling_star.01.white"))
            .atLocation({x:position.x, y:position.y}, {randomOffset: 2.2})
            .size(0.75, {gridUnits: true})
            .filter("ColorMatrix", {hue: Math.floor(Math.random() * 361), brightness: 1})
            .randomSpriteRotation()
            .scaleIn(0, 150, {ease: "easeOutBack"})
            .duration(400)
            .repeats(5, 100,100)
            .zIndex(3);
        
        seq.addSequence(wave);
        seq.wait(150);
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

autoanimations.register('Color Spray', 'template', 'eskie.effect.colorSpray', DEFAULT_CONFIG, '1.0');