// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: "chromatic-orb",
    damageType: "fire",
};

async function create(token, target, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, damageType } = mergedConfig;

    const colorMapping = {
        acid: {color: "green", orb: "yellow", hue: 20, impact: "green"},
        cold: {color: "blue", orb: "blue", hue: 0, impact: "blue"},
        fire: {color: "orange", orb: "yellow", hue: -15, impact: "orange"},
        lightning: {color: "purple", orb: "green", hue: 180, impact: "pinkpurple"},
        poison: {color: "green", orb: "green", hue: -20, impact: "green"},
        thunder: {color: "white", orb: "white", hue: 0, impact: "blue"},
    };

    const {color, orb, hue, impact} = colorMapping[damageType];

    // Calculate distance in pixels
    const dx = target.center.x - token.center.x;
    const dy = target.center.y - token.center.y;
    const distance = (Math.sqrt(dx * dx + dy * dy))/canvas.grid.size;

    const effectDuration = 800 + (100 * distance)
    const effectOffsetX = Math.round((Math.random() - 0.5) * (canvas.grid.size/2));
    const effectOffsetY = Math.round((Math.random() - 0.5) * (canvas.grid.size/2));

    let seq = new Sequence()

        .addNamedLocation("position", { x: target.center.x + effectOffsetX, y: target.center.y + effectOffsetY })

        .effect()
            .file(closest("jb2a.aura_themed.01.orbit.complete.metal.01.grey"))
            .atLocation(token)
            .scaleToObject(1.75)
            .fadeIn(500)
            .animateProperty("sprite", "width", { from: 0, to: -1, duration: 1500, gridUnits:true, ease: "easeOutCubic"})
            .animateProperty("sprite", "height", { from: 0, to: -1, duration: 1500, gridUnits:true, ease: "easeOutCubic"})
            .startTime(5500)
            .zIndex(1)

        .effect()
            .file(closest("jb2a.moonbeam.01.complete.rainbow"))
            .atLocation(token)
            .scaleToObject(1.5)
            .fadeIn(500)
            .animateProperty("sprite", "width", { from: 0, to: -1, duration: 1500, gridUnits:true, ease: "easeOutCubic"})
            .animateProperty("sprite", "height", { from: 0, to: -1, duration: 1500, gridUnits:true, ease: "easeOutCubic"})
            .playbackRate(1.25)
            .fadeOut(250)
            .duration(2500)

        .wait(1500)

        .effect()
            .file(closest(`jb2a.impact.002.${impact}`))
            .atLocation(token)
            .scaleToObject(1)
            .zIndex(3)

        .effect()
            .file(closest(`jb2a.markers.light_orb.loop.${orb}`))
            .atLocation(token)
            .scaleIn(0, 500, {ease:"easeOutBack"})
            .moveTowards("position", {delay:500, ease: "easeInBack"})
            .scaleToObject(1)
            .filter("ColorMatrix", { hue: hue, saturate: 1 })
            .fadeIn(250)
            .duration(effectDuration)
            .zIndex(2)

        .effect()
            .file(closest("jb2a.moonbeam.01.loop.rainbow"))
            .atLocation(token)
            .moveTowards("position", {delay:500, ease: "easeInBack"})
            .scaleToObject(0.45)
            .fadeIn(250)
            .duration(effectDuration)
            .zIndex(1)
            .waitUntilFinished(-100)

        .effect()
            .file(`eskie.damage.${damageType}.01.${color}`)
            .atLocation("position")
            .size(1, {gridUnits:true});
    
    return seq;
}

async function play(token, target, config) {
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
}

export const chromaticOrb = {
    create,
    play,
};

autoanimations.register("Chromatic Orb", "ranged-target", "eskie.effect.chromaticOrb", DEFAULT_CONFIG);
