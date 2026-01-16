// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { file } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const sequence = new Sequence();

    sequence.effect()
        .file(file("jb2a.melee_generic.piercing.two_handed"))
        .atLocation(target)
        .spriteOffset({ x: -5.6, y: 0.1 }, { gridUnits: true })
        .size(8, { gridUnits: true })
        .rotateTowards(token)
        .playbackRate(0.8)
        .randomizeMirrorY()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .rotate(180)
        .zIndex(1);

    sequence.effect()
        .copySprite(target)
        .attachTo(target)
        .fadeIn(500)
        .fadeOut(500)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 55, pingPong: true, gridUnits: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 0.5 })
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.65)
        .zIndex(0.1);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) {
        return sequence.play();
    }
}

export const dreadLordAttack = {
    create,
    play,
};
