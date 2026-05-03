// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const sequence = new Sequence();

    sequence.effect()
        .file(closest("jb2a.toll_the_dead.red.skull_smoke"))
        .attachTo(target)
        .scaleToObject(1.65, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: 0.25, hue: -5 })
        .tint("#e51e19")
        .zIndex(1);

    sequence.effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(2000)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 55, pingPong: true, gridUnits: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 0.5 })
        .duration(5000)
        .opacity(0.65)
        .zIndex(0.1);

    sequence.effect()
        .file(closest(`jb2a.particles.outward.red.01.03`))
        .attachTo(target, { offset: { y: 0.1 }, gridUnits: true, bindRotation: false })
        .size(1 * target.document.width, { gridUnits: true })
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 1000, gridUnits: true })
        .filter("ColorMatrix", { saturate: 1, hue: 20 })
        .zIndex(0.3);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) {
        return sequence.play();
    }
}

export const dreadLordFear = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
