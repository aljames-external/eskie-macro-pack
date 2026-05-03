// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'ChannelDivinityDreadAspect',
    darkMap: true,
}

async function create(token, targets, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {darkMap} = mConfig;

    const sequence = new Sequence();

    sequence.effect()
        .file(closest("jb2a.extras.tmfx.border.circle.inpulse.01.fast"))
        .attachTo(token)
        .scaleToObject(2, { considerTokenScale: true })
        .filter("ColorMatrix", { brightness: 0 });

    sequence.effect()
        .file(closest("jb2a.token_border.circle.static.purple.004"))
        .attachTo(token)
        .name("Rage")
        .opacity(0.6)
        .scaleToObject(1.7, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(500)
        .duration(2500)
        .filter("ColorMatrix", { saturate: 0.5, hue: -5 })
        .tint("#e51e19")
        .belowTokens()
        .zIndex(2);

    if (darkMap && canvas.scene.background.src) {
        sequence.effect()
            .file(closest(canvas.scene.background.src))
            .filter("ColorMatrix", { brightness: 0.3 })
            .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .spriteOffset({ x: -0 }, { gridUnits: true })
            .duration(3000)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens();
    }

    sequence.effect()
        .file(closest(`jb2a.particles.outward.red.01.03`))
        .attachTo(token, { offset: { y: 0.1 }, gridUnits: true, bindRotation: false })
        .size(0.5 * token.document.width, { gridUnits: true })
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "position.y", { from: 0, to: -0.6, duration: 1000, gridUnits: true })
        .filter("ColorMatrix", { saturate: 1, hue: 20 })
        .zIndex(0.3);

    sequence.effect()
        .file(closest("jb2a.flames.04.complete.purple"))
        .attachTo(token, { offset: { y: -0.35 }, gridUnits: true, bindRotation: true })
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .tint("#e51e19")
        .fadeOut(500)
        .scaleOut(0, 500, { ease: "easeOutCubic" })
        .duration(2500)
        .zIndex(1);

    sequence.effect()
        .file(closest("jb2a.cast_generic.ice.01.blue"))
        .attachTo(token, { offset: { y: 0.15 }, gridUnits: true, bindRotation: true })
        .opacity(1.5)
        .playbackRate(1.5)
        .scaleToObject(1.5, { considerTokenScale: true })
        .filter("ColorMatrix", { brightness: 0 })
        .waitUntilFinished(-200);

    sequence.effect()
        .file(closest("jb2a.template_circle.aura.01.complete.small.bluepurple"))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindRotation: true })
        .scaleToObject(4, { considerTokenScale: true })
        .scaleIn(0, 250, { ease: "easeOutBack" })
        .scaleOut(0, 6500, { ease: "easeInSine" })
        .filter("ColorMatrix", { saturate: 0.5, hue: -2 })
        .tint("#e51e19")
        .randomRotation()
        .belowTokens()
        .zIndex(3);

    sequence.canvasPan()
        .shake({ duration: 1500, strength: 2, rotation: false, fadeOut: 1500 });

    sequence.effect()
        .attachTo(token)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(1)
        .belowTokens()
        .randomRotation()
        .filter("ColorMatrix", { brightness: 0 })
        .fadeIn(500)
        .fadeOut(500);

    sequence.effect()
        .file(closest("jb2a.impact.003.dark_red"))
        .attachTo(token, { offset: { y: 0.1 }, gridUnits: true, bindRotation: true })
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2);

    sequence.effect()
        .file(closest("jb2a.impact.004.dark_red"))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindRotation: true })
        .scaleToObject(7.5, { considerTokenScale: true })
        .randomRotation()
        .filter("ColorMatrix", { brightness: 0 })
        .opacity(0.75)
        .scaleIn(0, 1400, { ease: "easeOutCubic" })
        .fadeOut(1000)
        .belowTokens()
        .zIndex(2);

    sequence.effect()
        .file(closest("jb2a.extras.tmfx.outpulse.circle.02.fast"))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindRotation: true })
        .size(13, { gridUnits: true })
        .opacity(0.5)
        .filter("ColorMatrix", { brightness: 0 })
        .tint("#e51e19");

    targets.forEach(target => {
        sequence.effect()
            .file(closest("jb2a.toll_the_dead.red.skull_smoke"))
            .attachTo(target)
            .scaleToObject(1.65, { considerTokenScale: true })
            .filter("ColorMatrix", { saturate: 0.25, hue: -2 })
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
    });

    return sequence;
}

async function play(token, targets, config = {}) {
    const sequence = await create(token, targets, config);
    if (sequence) { return sequence.play(); }
}

export const channelDivinityDreadAspect = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
