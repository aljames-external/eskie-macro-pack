// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    color: "teal",
    changeLight: true,
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { color, changeLight } = mConfig;
    let tintColor;
    let hue;

    if (color == "teal") {
        tintColor = '#6ff087'
        hue = 35
    }
    else if (color == "green") {
        tintColor = '#6cde3b'
        hue = 0
    }
    else if (color == "blue") {
        tintColor = '#74e2cf'
        hue = 75
    }
    else if (color == "red") {
        tintColor = '#e22c47'
        hue = -95
    }

    const middleposition = {
        x: (target.center.x - token.center.x) * 0.25,
        y: (target.center.y - token.center.y) * 0.25,
    };

    let sequence = new Sequence()
        .wait(100)
        .thenDo(function () {
            if (Tagger.hasTags(token, "Incorporeal")) {
                // End current poltergeist image
                Sequencer.EffectManager.endEffects({ name: `Incorporeal ${token.document.name}`, object: token });
            }
        })

        // Poltergeist attack
        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .atLocation(token)
        .mirrorX(token.document.mirrorX)
        .animateProperty("spriteContainer", "position.x", { from: 0, to: middleposition.x, duration: 250, ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: middleposition.y, duration: 250, ease: "easeOutCubic" })
        .scaleToObject(1.45, { considerTokenScale: true })
        .duration(500)
        .fadeOut(500)
        .opacity(0.45)
        .tint(tintColor)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("Glow", { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0 })
        .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
        .filter("Blur", { blurX: 0, blurY: 0.8 })
        .playIf(() => {
            return Tagger.hasTags(token, "Incorporeal");
        })

        .effect()
        .copySprite(token)
        .atLocation(token)
        .mirrorX(token.document.mirrorX)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("spriteContainer", "position.x", { from: 0, to: middleposition.x, duration: 250, ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: middleposition.y, duration: 250, ease: "easeOutCubic" })
        .duration(500)
        .fadeOut(400)
        .opacity(0.65)
        .tint(tintColor)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("Glow", { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0 })
        .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
        .filter("Blur", { blurX: 0, blurY: 0.8 })
        .playIf(() => {
            return Tagger.hasTags(token, "Incorporeal");
        })

        // Target hit point
        .effect()
        .delay(150)
        .file(closest("jb2a.impact.004.green"))
        .atLocation(target)
        .rotateTowards(token)
        .scaleToObject(1.45)
        .spriteScale({ x: 0.75, y: 1.0 })
        .filter("ColorMatrix", { saturate: -0.75, brightness: 1.5, hue: hue })
        .spriteOffset({ x: -0.15 }, { gridUnits: true })
        .zIndex(2)

        // Drain Touch Cracks
        .effect()
        .file(closest("jb2a.impact.ground_crack.02.white"))
        .atLocation(target)
        .rotateTowards(token)
        .spriteOffset({ x: -0.4 }, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 0, brightness: 1.5 })
        .size(token.document.width * 1.5, { gridUnits: true })
        .tint(tintColor)
        .mask(target)
        .zIndex(1)

        // Target grows pale
        .effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1 })
        .fadeIn(3000)
        .fadeOut(1000)
        .duration(5000)

        // Animate hit dust
        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(target)
        .filter("ColorMatrix", { brightness: 0, saturate: -1 })
        .scaleToObject(1.45, { considerTokenScale: true })
        .fadeIn(3000)
        .fadeOut(1000)
        .belowTokens()
        .duration(5000)

        // Cracks on target
        .effect()
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(target)
        .rotateTowards(token)
        .spriteOffset({ x: -0.4 }, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .filter("Glow", { outerStrength: 6, distance: 10, color: 0x000000 })
        .size(token.document.width * 1.5, { gridUnits: true })
        .fadeIn(2000)
        .fadeOut(1000)
        .duration(5000)
        .tint(tintColor)
        .mask(target)
        .zIndex(0)
        .wait(750);
        
    return sequence;
}

async function play(token, target, config = {}) {
    await Tagger.addTags(token, "DrainingTouch");
    const sequence = await create(token, target, config);
    await sequence.play();
    await Tagger.removeTags(token, "DrainingTouch");

    if (Tagger.hasTags(token, "Incorporeal")) {
        const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
        const { color, changeLight } = mConfig;
        let tintColor;
        if (color == "teal") { tintColor = '#6ff087' }
        else if (color == "green") { tintColor = '#6cde3b' }
        else if (color == "blue") { tintColor = '#74e2cf' }
        else if (color == "red") { tintColor = '#e22c47' }

        // Make attacker into a poltergeist
        new Sequence()
            .animation()
            .on(token)
            .opacity(0)
            .thenDo(function () {
                if (changeLight == true) {
                    var light = { dim: 0, bright: 1, alpha: 0.25, luminosity: 0.55, color: tintColor, animation: { type: "torch", speed: 4, intensity: 5 }, attenuation: 0.85, contrast: 0, shadows: 0 };
                    token.document.update({ light })
                }
            })

            .effect()
            .name(`Incorporeal ${token.document.name}`)
            .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
            .attachTo(token, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
            .scaleToObject(1.45, { considerTokenScale: true })
            .randomRotation()
            .belowTokens()
            .opacity(0.45)
            .tint(tintColor)
            .fadeIn(500)
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
            .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
            .persist()

            .effect()
            .name(`Incorporeal ${token.document.name}`)
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(0.65)
            .tint(tintColor)
            .fadeIn(500)
            .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
            .loopProperty("sprite", "position.x", { from: 0.025, to: -0.025, duration: 5000, gridUnits: true, pingPong: true, ease: "easeOutSine" })
            .loopProperty("sprite", "position.y", { from: 0, to: -0.03, duration: 2500, gridUnits: true, pingPong: true })
            .persist()
            .filter("Glow", { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0 })
            .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
            .filter("Blur", { blurX: 0, blurY: 0.8 })
            .waitUntilFinished()

            .effect()
            .file(closest("jb2a.smoke.puff.centered.grey"))
            .atLocation(token)
            .scaleToObject(2, { considerTokenScale: true })
            .opacity(0.5)
            .filter("ColorMatrix", { saturate: 0, brightness: 1.5 })
            .tint(tintColor)
            .playIf(() => {
                return !Tagger.hasTags(token, "DrainingTouch");
            })
            .thenDo(function () {
                if (!Tagger.hasTags(token, "DrainingTouch")) {
                    if (!Tagger.hasTags(token, "Possession")) {
                        Tagger.removeTags(token, "Incorporeal");
                        if (changeLight == true) {
                            var light = { dim: 0, bright: 0 };
                            token.document.update({ light });
                        }
                        Sequencer.EffectManager.endEffects({ name: `Incorporeal ${token.document.name}`, object: token });
                    }
                }
            })
            .play()
    }
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const drainingTouch = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
