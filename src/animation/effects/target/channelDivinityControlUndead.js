// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'Control Undead',
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    const sequence = new Sequence();

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
        .file(closest("jb2a.magic_signs.rune.necromancy.intro.red"))
        .attachTo(target)
        .scaleToObject(0.5)
        .scaleOut(0, 1000, { ease: "easeInBack" })
        .fadeOut(500, { ease: "easeInCubic" })
        .zIndex(1);

    sequence.effect()
        .file(closest("jb2a.markers.02.red"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.2 }, { gridUnits: true })
        .spriteScale({ x: 0.8, y: 1 })
        .filter("ColorMatrix", { saturate: 0.5, hue: -2 })
        .rotate(0)
        .scaleToObject(1)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.x", { from: -0.5, to: 0.05, duration: 1000, gridUnits: true, ease: "easeOutBack", delay: 0 })
        .animateProperty("sprite", "width", { from: 0.8, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack", delay: 1500 })
        .animateProperty("sprite", "height", { from: 1, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack", delay: 1500 })
        .filter("Glow", { color: 0x000000 })
        .fadeOut(1000)
        .zIndex(1);

    sequence.effect()
        .file(closest("jb2a.particle_burst.01.circle.bluepurple"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.2 }, { gridUnits: true })
        .spriteScale({ x: 0.8, y: 1 })
        .filter("ColorMatrix", { saturate: 0.5, hue: -2 })
        .rotate(0)
        .scaleToObject(1)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .animateProperty("spriteContainer", "position.x", { from: -0.5, to: 0.05, duration: 1000, gridUnits: true, ease: "easeOutBack", delay: 0 })
        .tint("#e51e19")
        .zIndex(0);

    sequence.effect()
        .file(closest("jb2a.particle_burst.01.circle.bluepurple"))
        .attachTo(target)
        .scaleToObject(1.5)
        .filter("ColorMatrix", { saturate: 0.5, hue: -2 })
        .tint("#e51e19")
        .belowTokens()
        .zIndex(0);

    sequence.effect()
        .delay(550)
        .file(closest("jb2a.smoke.puff.centered.dark_black"))
        .attachTo(target)
        .scaleToObject(1.8)
        .scaleOut(0, 1000, { ease: "easeInBack" })
        .randomRotation()
        .belowTokens();

    sequence.effect()
        .delay(750)
        .file(closest("jb2a.particles.outward.red.01.03"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.5, y: -0.1 }, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 1, hue: -2 })
        .spriteScale({ x: 0.8, y: 1 })
        .scaleToObject(2.5)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .tint("#e51e19")
        .duration(1500)
        .fadeOut(1500)
        .waitUntilFinished(-1500);

    sequence.effect()
        .name(`${id} ${token.document.name}`)
        .copySprite(target)
        .attachTo(target, { bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.75)
        .mirrorX(token.document.mirrorX)
        .tint("#e51e19")
        .fadeIn(500)
        .fadeOut(500)
        .duration(1000);

    sequence.effect()
        .delay(100)
        .file(closest(`jb2a.particles.outward.white.01.03`))
        .attachTo(target, { offset: { y: 0.2 }, gridUnits: true, bindRotation: false })
        .scaleToObject()
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: -0, to: -0.6, duration: 1000, gridUnits: true })
        .tint("#e51e19")
        .filter("Blur", { blurX: 0, blurY: 5 })
        .opacity(0.8)
        .zIndex(0.3);

    sequence.effect()
        .delay(750)
        .file(closest("jb2a.static_electricity.03.dark_red"))
        .atLocation(target)
        .size(1.25, { gridUnits: true })
        .opacity(1)
        .playbackRate(1)
        .randomRotation()
        .zIndex(0.3);

    sequence.effect()
        .delay(500)
        .name(`${id} ${token.document.name}`)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(target, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .fadeIn(1000)
        .fadeOut(500)
        .belowTokens()
        .opacity(0.45)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("ColorMatrix", { brightness: 0 })
        .persist();

    sequence.effect()
        .delay(500)
        .name(`${id} ${token.document.name}`)
        .copySprite(target)
        .attachTo(target, { bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .belowTokens()
        .mirrorX(token.document.mirrorX)
        .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
        .filter("Glow", { color: 0xe51e19, distance: 5, outerStrength: 4, innerStrength: 0 })
        .fadeIn(1000)
        .fadeOut(500)
        .persist()
        .zIndex(0.1);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) { return sequence.play(); }
}

function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id} ${token.document.name}` });
}

export const channelDivinityControlUndead = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
