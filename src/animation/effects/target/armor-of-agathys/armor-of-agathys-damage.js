// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { file } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const sequence = new Sequence();

    sequence.effect()
        .file(file("jb2a.impact.004.blue"))
        .atLocation(token)
        .rotateTowards(target)
        .scaleToObject(1.45)
        .spriteScale({ x: 0.75, y: 1.0 })
        .filter("ColorMatrix", { saturate: -0.75, brightness: 1.5 })
        .spriteOffset({ x: -0.15 }, { gridUnits: true });

    sequence.effect()
        .atLocation(token)
        .file(file("jb2a.side_impact.part.fast.ice_shard.blue"))
        .rotateTowards(target)
        .scaleToObject(2)
        .randomizeMirrorY()
        .zIndex(2);

    sequence.effect()
        .copySprite(target)
        .atLocation(target)
        .fadeIn(100)
        .fadeOut(100)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 175, pingPong: true, gridUnits: true })
        .scaleToObject(target.document.texture.scaleX)
        .duration(500)
        .opacity(0.15);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) { return sequence.play(); }
}

export const armorOfAgathysDamage = {
    create,
    play,
};
