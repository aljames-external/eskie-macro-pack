// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const sequence = new Sequence();

    sequence.effect()
        .file(closest(`jb2a.particles.outward.purple.01.03`))
        .attachTo(target)
        .scale(0.15)
        .playbackRate(1)
        .duration(1000)
        .fadeOut(500)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { hue: 0 })
        .animateProperty("sprite", "width", { from: 0, to: 0.5, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 1.5, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true })
        .zIndex(0.2);

    sequence.effect()
        .file(closest("eskie.symbol.eye.01.purple"))
        .attachTo(target)
        .scaleToObject(0.75)
        .scaleIn(0, 250, { ease: "easeOutCubic" })
        .zIndex(0.1);

    sequence.effect()
        .file(closest("jb2a.smoke.puff.centered.grey"))
        .attachTo(target)
        .scaleToObject(4)
        .spriteOffset({ x: 0.1, y: -0.45 }, { gridUnits: true })
        .filter("ColorMatrix", { brightness: -1 });

    sequence.effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeOut(300)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 175, pingPong: true, gridUnits: true })
        .scaleToObject(target.document.texture.scaleX)
        .duration(500)
        .tint("#dcace3")
        .opacity(0.45);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) { sequence.play(); }
}

export const hexDamage = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};