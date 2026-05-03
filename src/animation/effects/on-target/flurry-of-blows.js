// Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'Flurry Of Blows',
    color: "yellow",
    sound: {
        enabled: true,
        volume: 0.5
    }
};

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const { color, sound } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let seq = new Sequence();

    seq = seq.sound()
        .file(closest(`psfx.impacts.bludgeoning`))
        .volume(sound.volume)
        .delay(125)
        .repeats(7,250,250)
        .playIf(sound.enabled);
    seq = seq.effect()
        .delay(125)
        .file(closest(`jb2a.melee_generic.creature_attack.fist.001.${color}`))
        .atLocation(token, {offset:{x:-0.75 , y:-0.2}, gridUnits:true, local:true})
        .rotateTowards(target,{randomOffset:0.15})
        .scaleToObject(2.5)
        .playbackRate(2.5)
        .spriteOffset({x:-0.05-(token.document.width-1) , y:-0.18*token.document.width}, {gridUnits:true})
        .repeats(7,250,250)
        .zIndex(1);

    seq = seq.sound()
        .file(closest(`psfx.impacts.bludgeoning`))
        .volume(sound.volume)
        .delay(250)
        .repeats(7,250,250)
        .playIf(sound.enabled);
    seq = seq.effect()
        .delay(250)
        .file(closest(`jb2a.melee_generic.creature_attack.fist.001.${color}`))
        .atLocation(token, {offset:{x:-0.75 , y:0.2}, gridUnits:true, local:true})
        .rotateTowards(target,{randomOffset:0.15})
        .scaleToObject(2.5)
        .playbackRate(2.5)
        .spriteOffset({x:-0.05-(token.document.width-1) , y:0.18*token.document.width}, {gridUnits:true})
        .repeats(7,250,250)
        .mirrorY()
        .zIndex(1);

    seq = seq.wait(250);

    seq = seq.effect()
        .file(closest("jb2a.impact.009.orange"))
        .atLocation(target,{randomOffset:1})
        .size(token.document.width*1.25, {gridUnits:true})
        .repeats(14,125,125)
        .randomRotation();

    seq = seq.effect()
        .copySprite(target)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(200)
        .fadeOut(200)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .duration(1750)
        .opacity(0.25);

    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
}

export const flurryOfBlows = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Flurry Of Blows", "melee-target", "eskie.effect.flurryOfBlows", DEFAULT_CONFIG);

