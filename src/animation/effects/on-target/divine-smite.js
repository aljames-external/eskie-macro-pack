// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: "divineSmite",
    color: "yellowwhite"
};

async function create(token, target, config = {}) {
    const { id, color } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    let seq = new Sequence();
    seq = seq.effect()
        .delay(500)
        .file(closest(`jb2a.particles.outward.white.02.03`))
        .attachTo(token, {offset:{y:-0.25}, gridUnits:true, bindRotation: false})
        .scaleToObject(1.2)
        .playbackRate(2)
        .duration(2000)
        .fadeOut(800)
        .fadeIn(1000)
        .animateProperty("sprite", "height", { from: 0, to: 2, duration: 3000, gridUnits:true, ease:"easeOutBack"})
        .filter("Blur", { blurX: 0, blurY: 15 })
        .opacity(2)
        .zIndex(0.2);

    seq = seq.effect()
        .delay(1050)
        .file(closest(`jb2a.divine_smite.caster.reversed.${color}`))
        .atLocation(token)
        .scaleToObject(2.2)
        .startTime(900)
        .fadeIn(200);

    seq = seq.effect()
        .file(closest(`jb2a.divine_smite.caster.${color}`))
        .atLocation(token)
        .scaleToObject(1.85)
        .belowTokens()
        .waitUntilFinished(-1200);

    seq = seq.canvasPan()
        .delay(300)
        .shake({duration: 1000, strength: 1, rotation: false, fadeOutDuration:1000 });

    seq = seq.effect()
        .delay(300)
        .file(closest("jb2a.impact.ground_crack.01.blue"))
        .atLocation(target)
        .size(2.3*token.document.width, {gridUnits:true})
        .filter("ColorMatrix", { saturate:-0.5, hue: -160 })
        .belowTokens()
        .playbackRate(0.85)
        .randomRotation();

    seq = seq.effect()
        .file(closest(`jb2a.divine_smite.target.${color}`))
        .atLocation(target)
        .rotateTowards(token)
        .scaleToObject(3)
        .spriteOffset({x:-1.5*token.document.width, y:-0*token.document.width},{gridUnits:true})
        .mirrorY()
        .rotate(90)
        .zIndex(2);

    return seq;
}

async function play(token, target, config) {
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
}

export const divineSmite = {
    create,
    play,
};

autoanimations.register("Divine Smite", "melee-target", "eskie.effect.divineSmite", DEFAULT_CONFIG);
