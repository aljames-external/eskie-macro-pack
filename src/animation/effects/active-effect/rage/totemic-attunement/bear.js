// Last Updated: 1/27/2025
// Author: .eskie
// Conversion: bakanabaka

import { closest } from "../../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'Bear Totemic Attunement',
    color: 'red',
}

async function play(token, targets, config = {}) {
    const seq = await create(token, targets, config);
    if (seq) { await seq.play(); }
}

function targetSequence(target, config = {}) {
    const { color } = config;
    let seq = new Sequence();
    seq = seq.effect()
        .copySprite(target)
        .attachTo(target)
        .spriteRotation(-target.document.rotation)
        .duration(2500) 
        .fadeOut(1000)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 25, gridUnits:true, pingPong:true})
        .tint("#ff0000")
        .opacity(0.35)

    .effect()
        .file(`eskie.buff.one_shot.simple.${color}`)
        .attachTo(target, {offset:{y:-0.05}, gridUnits:true})
        .scaleToObject(1.2)
        .mirrorY()
        .mirrorX()
        .filter("ColorMatrix", {brightness:0, saturate:1})   
        .zIndex(2)

    .effect()
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(target, {offset:{y:-0.05}, gridUnits:true})
        .scaleToObject(1.2)
        .mirrorY()
        .duration(2000)
        .fadeOut(500)
        .filter("ColorMatrix", {brightness:0, saturate:1})    
        .zIndex(2);
    
    return seq;
}

function create(token, targets, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    let seq = new Sequence();

    seq = seq.effect()
        .name(label)
        .file(closest(`eskie.sound.roar.01`))
        .attachTo(token)
        .scaleToObject(3.5)
        .opacity(0.75)
        .randomRotation()
        .repeats(8, 250,250)
        .zIndex(1);

    for (const target of targets) seq.addSequence(targetSequence(target, config));

    return seq;
}

export const bearAttunement = {
    create,
    play,
};