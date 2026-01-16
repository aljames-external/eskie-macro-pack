// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    darkMap: true,
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { darkMap } = mConfig;

    let sequence = new Sequence();
    sequence.effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .scaleToObject(3)
        .opacity(0.75)
        .belowTokens()
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .zIndex(1);

    sequence.effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.04"))
        .attachTo(token)
        .scaleToObject(1.75)
        .fadeIn(1000)
        .fadeOut(500)
        .opacity(1.2)
        .randomRotation()
        .belowTokens()
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .zIndex(1);

    if (darkMap && canvas.scene.background.src) {
        sequence.effect()
            .file(canvas.scene.background.src)
            .filter("ColorMatrix", { brightness: 0.3 })
            .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .duration(6000)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens();
    }
    sequence.wait(750)

    .effect()
        .file(closest("jb2a.impact.010.green"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.2 }, { gridUnits: true })
        .scaleToObject(0.4)
        .fadeOut(750)
        .zIndex(1)
        .wait(50)

    .effect()
        .file(closest("jb2a.twinkling_stars.points04.orange"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.2 }, { gridUnits: true })
        .filter("ColorMatrix", { hue: 70 })
        .rotate(0)
        .scaleToObject(0.4)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .animateProperty("sprite", "rotation", { from: 0, to: 360, duration: 1000, ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.x", { from: -0.2, to: 0.25, duration: 1500, gridUnits: true, ease: "easeOutBack", delay: 1500 })
        .animateProperty("sprite", "rotation", { from: 0, to: 360, duration: 4042, ease: "easeOutSine" })
        .fadeOut(750)
        .zIndex(1)

    .effect()
        .file(closest("jb2a.extras.tmfx.outpulse.circle.03.normal"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.175 }, { gridUnits: true })
        .rotate(0)
        .scaleToObject(0.35)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .animateProperty("sprite", "rotation", { from: 0, to: 360, duration: 1000, ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.x", { from: -0.2, to: 0.275, duration: 1500, gridUnits: true, ease: "easeOutBack", delay: 1500 })
        .tint("#89eb34")
        .opacity(0.8)
        .duration(4042)
        .fadeOut(750)
        .zIndex(0)
        .wait(3000)

    .effect()
        .file(closest("jb2a.cast_generic.dark.side01.red"))
        .size(1 * token.document.width, { gridUnits: true })
        .atLocation(token)
        .rotateTowards(target)
        .filter("ColorMatrix", { hue: -285 })
        .waitUntilFinished(-1500)
        .zIndex(2)

    .effect()
        .file(closest("jb2a.fireball.beam.dark_red"))
        .atLocation(token)
        .playbackRate(1.75)
        .scale(0.3)
        .stretchTo(target)
        .filter("ColorMatrix", { hue: -285 })
        .startTime(2000)
        .waitUntilFinished(-2100)

    .effect()
        .file(closest("jb2a.impact.004.dark_red"))
        .atLocation(target)
        .scaleToObject(2.5)
        .filter("ColorMatrix", { hue: -285 })
        .fadeOut(1167)
        .opacity(0.45)
        .scaleIn(0, 1167, { ease: "easeOutCubic" })
        .canvasPan()
        .shake({ duration: 100, strength: 25, rotation: false })

    .effect()
        .file(closest("jb2a.static_electricity.03.blue"))
        .attachTo(target)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .opacity(0.75)
        .playbackRate(4)
        .fadeOut(1000)
        .randomRotation()
        .repeats(10, 250, 250)
        .zIndex(1)

    .effect()
        .copySprite(target)
        .attachTo(target)
        .fadeIn(5000)
        .fadeOut(5000)
        .scaleToObject(1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 0.5 })
        .duration(10000)

    .effect()
        .file(closest("jb2a.token_border.circle.static.blue.009"))
        .attachTo(target)
        .fadeIn(1000)
        .fadeOut(6000)
        .scaleToObject(1.6, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .belowTokens()
        .duration(10000)

    .effect()
        .copySprite(target)
        .attachTo(target)
        .fadeIn(100)
        .fadeOut(1000)
        .playbackRate(4)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 55, pingPong: true, gridUnits: true })
        .scaleToObject(1, { considerTokenScale: true })
        .duration(5000)
        .opacity(0.15)
        .zIndex(0.1)

    .effect()
        .delay(2000)
        .file(closest("jb2a.static_electricity.03.blue"))
        .attachTo(target)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .opacity(0.75)
        .playbackRate(2)
        .fadeOut(1000)
        .randomRotation()
        .repeats(3, 2000, 4000)
        .zIndex(1);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const fingerOfDeath = {
    create,
    play,
    stop
};
