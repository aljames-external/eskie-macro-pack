// Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

const DEFAULT_CONFIG = {
    id: 'Flurry Of Blows',
    color: "yellow",
    sound: {
        punch1: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            delay: 125,
            file: 'psfx.impacts.bludgeoning',
            repeats: [7, 250, 250],
        },
        punch2: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            delay: 250,
            file: 'psfx.impacts.bludgeoning',
            repeats: [7, 250, 250],
        }
    }
};

async function create(token: Token, target: Token, config: any = {}) {
    if (!token || !target) return null;
    config = settingsOverride(config);
    const { color, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const middle = {
        x: (targetCenter.x - tokenCenter.x) * 0.25,
        y: (targetCenter.y - tokenCenter.y) * 0.25,
    };
    let seq = new Sequence();

    applySound(seq, sound.punch1);
    seq = seq.effect()
        .delay(125)
        .file(closest(`jb2a.melee_generic.creature_attack.fist.001.${color}`))
        .atLocation(token, {offset:{x:-0.75 , y:-0.2}, gridUnits:true, local:true})
        .rotateTowards(target,{randomOffset:0.15})
        .scaleToObject(2.5)
        .playbackRate(2.5)
        .spriteOffset({x:-0.05-(tokenWidth-1) , y:-0.18*tokenWidth}, {gridUnits:true})
        .repeats(7,250,250)
        .zIndex(1);

    applySound(seq, sound.punch2);
    seq = seq.effect()
        .delay(250)
        .file(closest(`jb2a.melee_generic.creature_attack.fist.001.${color}`))
        .atLocation(token, {offset:{x:-0.75 , y:0.2}, gridUnits:true, local:true})
        .rotateTowards(target,{randomOffset:0.15})
        .scaleToObject(2.5)
        .playbackRate(2.5)
        .spriteOffset({x:-0.05-(tokenWidth-1) , y:0.18*tokenWidth}, {gridUnits:true})
        .repeats(7,250,250)
        .mirrorY()
        .zIndex(1);

    seq = seq.motion(token)
        .moveBy(middle, { duration: 100, ease: "easeOutExpo" })
        .moveBy({ x: -middle.x, y: -middle.y }, { duration: 350, ease: "easeInOutQuad" });

    seq = seq.wait(250);

    seq = seq.effect()
        .file(closest("jb2a.impact.009.orange"))
        .atLocation(target,{randomOffset:1})
        .size(tokenWidth * 1.25, {gridUnits:true})
        .repeats(14,125,125)
        .randomRotation();

    return seq;
}

async function play(token: Token, target: Token, config: any = {}) {
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
}

export const flurryOfBlows = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("flurryOfBlows", "melee-target", "eskie.effect.flurryOfBlows", DEFAULT_CONFIG, "0.0.1", "Flurry Of Blows");

