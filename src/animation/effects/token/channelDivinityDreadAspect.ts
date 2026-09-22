// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

const DEFAULT_CONFIG = {
    id: 'ChannelDivinityDreadAspect',
    darkMap: true,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, targets: Token[], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { darkMap, sound } = mConfig;

    const sequence = new Sequence();
    applySound(sequence, sound);

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

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (darkMap && bg?.src) {
        const dims = adapter.getSceneDimensions(canvas?.scene);
        sequence.effect()
            .file(closest(bg.src))
            .filter("ColorMatrix", { brightness: 0.3 })
            .atLocation(adapter.getSceneCenter(canvas?.scene))
            .size({ width: dims.width / dims.size, height: dims.height / dims.size }, { gridUnits: true })
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY })
            .duration(3000)
            .fadeIn(500)
            .fadeOut(1000)
            .belowTokens();
    }

    const { widthUnits: tokenWidth } = adapter.getTokenDimensions(token);
    const scaleX = token.document.texture.scaleX;

    sequence.effect()
        .file(closest(`jb2a.particles.outward.red.01.03`))
        .attachTo(token, { offset: { y: 0.1 }, gridUnits: true, bindRotation: false })
        .size(0.5 * tokenWidth, { gridUnits: true })
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty('sprite', 'width', { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty('sprite', 'height', { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.6, duration: 1000, gridUnits: true })
        .filter("ColorMatrix", { saturate: 1, hue: 20 })
        .zIndex(0.3);

    sequence.effect()
        .file(closest("jb2a.flames.04.complete.purple"))
        .attachTo(token, { offset: { y: -0.35 }, gridUnits: true, bindRotation: true })
        .scaleToObject(1.5 * scaleX)
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
        .scaleToObject(1.5 * scaleX)
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
        const { widthUnits: targetWidth } = adapter.getTokenDimensions(target);

        sequence.effect()
            .file(closest("jb2a.toll_the_dead.red.skull_smoke"))
            .attachTo(target)
            .scaleToObject(1.65, { considerTokenScale: true })
            .filter("ColorMatrix", { saturate: 0.25, hue: -2 })
            .zIndex(1);

        sequence.motion(target)
            .noise({ strength: 0.05, frequency: 55, duration: 3000, gridUnits: true });

        sequence.effect()
            .file(closest(`jb2a.particles.outward.red.01.03`))
            .attachTo(target, { offset: { y: 0.1 }, gridUnits: true, bindRotation: false })
            .size(1 * targetWidth, { gridUnits: true })
            .duration(1000)
            .fadeOut(800)
            .scaleIn(0, 1000, { ease: "easeOutCubic" })
            .animateProperty('sprite', 'width', { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
            .animateProperty('sprite', 'height', { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.6, duration: 1000, gridUnits: true })
            .filter("ColorMatrix", { saturate: 1, hue: 20 })
            .zIndex(0.3);
    });

    return sequence;
}

async function play(token: Token, targets: Token[], config: any = {}) {
    const sequence = await create(token, targets, config);
    if (sequence) { return sequence.play(); }
}

export const channelDivinityDreadAspect = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
