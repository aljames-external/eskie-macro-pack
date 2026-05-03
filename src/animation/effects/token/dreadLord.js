// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'dreadLord',
    darkMap: true,
    form: {
        change: false,
        baseForm: null,
        dreadForm: null,
    }
}

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {id, darkMap} = mConfig;

    let seq = new Sequence();
    seq = seq.effect()
        .file(closest("jb2a.energy_strands.in.red.01"))
        .attachTo(token)
        .scaleToObject(9, { considerTokenScale: true })
        .filter("ColorMatrix", { brightness: 0 })
        .randomRotation()
        .belowTokens()
        .zIndex(0.1);

    seq = seq.effect()
        .file(closest("jb2a.token_border.circle.static.purple.004"))
        .name(id)
        .attachTo(token)
        .opacity(0.6)
        .scaleToObject(1.7, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(500)
        .duration(2500)
        .filter("ColorMatrix", { saturate: 0.5, hue: -5 })
        .tint("#e51e19")
        .belowTokens()
        .zIndex(2);

    if (darkMap && canvas.scene.background?.src) {
        seq = seq.effect()
            .file(closest(canvas.scene.background.src))
            .filter("ColorMatrix", { brightness: 0.3 })
            .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .spriteOffset({ x: -0 }, { gridUnits: true })
            .duration(7000)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens()
    }

    seq = seq.effect()
        .file(closest(`jb2a.particles.outward.red.01.03`))
        .attachTo(token, { offset: { y: 0.1 }, gridUnits: true, bindRotation: false })
        .size(0.5 * token.document.width, { gridUnits: true })
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 1000, gridUnits: true })
        .filter("ColorMatrix", { saturate: 1, hue: 20 })
        .zIndex(0.3);

    seq = seq.effect()
        .file(closest("jb2a.flames.04.complete.purple"))
        .attachTo(token, { offset: { y: -0.35 }, gridUnits: true, bindRotation: true })
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .tint("#e51e19")
        .fadeOut(500)
        .scaleOut(0, 500, { ease: "easeOutCubic" })
        .duration(2500)
        .zIndex(1)
        .waitUntilFinished(-500);

    seq = seq.effect()
        .file(closest("jb2a.impact.ground_crack.dark_red.01"))
        .atLocation(token)
        .belowTokens()
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(7, { gridUnits: true })
        .tint("#e51e19")
        .zIndex(0.1);

    seq = seq.canvasPan()
        .shake({ duration: 3000, strength: 2, rotation: false, fadeOut: 3000 });

    seq = seq.effect()
        .file(closest("jb2a.token_border.circle.static.purple.004"))
        .name(id)
        .attachTo(token)
        .opacity(0.6)
        .scaleToObject(1.7, { considerTokenScale: true })
        .fadeIn(250)
        .fadeOut(500)
        .duration(2500)
        .filter("ColorMatrix", { saturate: 0.5, hue: -5 })
        .tint("#e51e19")
        .persist()
        .zIndex(2);

    seq = seq.effect()
        .name(id)
        .file(closest("jb2a.energy_strands.complete.dark_red.01"))
        .attachTo(token)
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(1)
        .filter("ColorMatrix", { brightness: 0 })
        .scaleIn(0, 1000, { ease: "easeOutBack" })
        .belowTokens()
        .persist()
        .zIndex(3);

    seq = seq.effect()
        .name(id)
        .file(closest("jb2a.energy_strands.overlay.dark_red.01"))
        .attachTo(token)
        .scaleToObject(2, { considerTokenScale: true })
        .filter("ColorMatrix", { brightness: 0 })
        .scaleIn(0, 1000, { ease: "easeOutBack" })
        .belowTokens()
        .persist()
        .zIndex(3);

    seq = seq.effect()
        .name(id)
        .file(closest("jb2a.template_circle.aura.01.complete.small.bluepurple"))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindRotation: true })
        .size(7.5, { gridUnits: true })
        .opacity(0.7)
        .scaleIn(0, 250, { ease: "easeOutBack" })
        .scaleOut(0, 6500, { ease: "easeInSine" })
        .filter("ColorMatrix", { saturate: 0.5, hue: -2 })
        .tint("#e51e19")
        .randomRotation()
        .belowTokens()
        .persist()
        .zIndex(0.3);

    seq = seq.effect()
        .name(id)
        .file(closest("jb2a.extras.tmfx.outflow.circle.02"))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindRotation: true })
        .size(13, { gridUnits: true })
        .opacity(0.65)
        .scaleIn(0, 250, { ease: "easeOutBack" })
        .scaleOut(0, 6500, { ease: "easeInSine" })
        .filter("ColorMatrix", { brightness: 0 })
        .belowTokens()
        .persist()
        .zIndex(0.2);

    seq = seq.effect()
        .name(id)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindRotation: true })
        .size(13, { gridUnits: true })
        .opacity(0.7)
        .scaleIn(0, 250, { ease: "easeOutBack" })
        .scaleOut(0, 6500, { ease: "easeInSine" })
        .filter("ColorMatrix", { brightness: 0 })
        .rotate(90)
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 20000 })
        .belowTokens()
        .persist()
        .zIndex(0.3);

    seq = seq.effect()
        .file(closest("jb2a.impact.003.dark_red"))
        .attachTo(token, { offset: { y: 0.1 }, gridUnits: true, bindRotation: true })
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2);

    return seq;
}

async function play(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {form} = mConfig;

    const seq = await create(token, config);
    if (seq) {
        if (form.change && form.dreadForm) {
            await token.document.update({ img: config.dreadForm });
        }
        return seq.play();
    }
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {id, form} = mConfig;

    Sequencer.EffectManager.endEffects({ name: id, object: token });
    if (form.change && form.baseForm) {
        await token.document.update({ img: config.baseForm });
    }
}

export const dreadLord = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
