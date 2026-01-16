// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';

const DEFAULT_CONFIG = {};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let seq = new Sequence()
        .effect()
            .file(closest("jb2a.extras.tmfx.inpulse.circle.01.normal"))
            .atLocation(target)
            .scaleToObject(1)

        .effect()
            .file(closest("jb2a.misty_step.02.yellow"))
            .atLocation(target)
            .scaleToObject(1)
            .scaleOut(1, 3500, {ease: "easeOutCubic"})

        .wait(1400)

        .effect()
            .file(closest("jb2a.healing_generic.burst.tealyellow"))
            .atLocation(target)
            .scaleToObject(1.5)
            .filter("ColorMatrix", {hue:225})
            .fadeOut(1000, {ease: "easeInExpo"})
            .belowTokens()
            .scaleIn(0, 500, {ease: "easeOutCubic"})
            .duration(1200)
            .attachTo(target, {bindAlpha: false})

        .effect()
            .copySprite(target)
            .atLocation(target)
            .filter("ColorMatrix", {saturate:-1, brightness:10})
            .filter("Blur", { blurX: 5, blurY: 10 })
            .fadeIn(100)
            .opacity(1)
            .fadeOut(5000)
            .duration(6000)
            .attachTo(target)

        .effect()
            .file(closest("jb2a.fireflies.few.02.yellow"))
            .atLocation(target)
            .scaleToObject(2)
            .duration(10000)
            .fadeIn(1000)
            .fadeOut(500)
            .attachTo(target)

        .effect()
            .file(closest("jb2a.extras.tmfx.outflow.circle.02"))
            .atLocation(target)
            .fadeIn(200)
            .opacity(0.25)
            .duration(10000)
            .scaleToObject(2)
            .fadeOut(500)
            .fadeIn(1000)
            .belowTokens()
            .attachTo(target)

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .atLocation(target)
            .filter("ColorMatrix", {saturate:-1, brightness:2})
            .fadeIn(200, {ease: "easeInExpo"})
            .duration(10000)
            .opacity(0.25)
            .scaleToObject(2)
            .fadeOut(500)
            .fadeIn(1000)
            .belowTokens()
            .attachTo(target);
            
    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
}

export const revivify = {
    create,
    play,
};
