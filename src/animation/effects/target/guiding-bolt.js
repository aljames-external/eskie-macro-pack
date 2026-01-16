// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { file } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'GuidingBolt',
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;

    sequence.effect()
        .atLocation(token)
        .file(file(`jb2a.markers.light.complete.yellow`))
        .scaleToObject(2)
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .belowTokens()
        .fadeOut(2000)
        .duration(5000)
        .zIndex(0);

    sequence.wait(250);

    sequence.effect()
        .atLocation(token)
        .file(file(`jb2a.magic_signs.circle.02.evocation.loop.yellow`))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens()
        .fadeOut(2000)
        .filter("ColorMatrix", { hue: 5, saturate: 0, brightness: 1.2 })
        .zIndex(0);

    sequence.effect()
        .atLocation(token)
        .file(file(`jb2a.magic_signs.circle.02.evocation.loop.yellow`))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens(true)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(0.1)
        .duration(1200)
        .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
        .fadeOut(300, { ease: "linear" });

    sequence.wait(250);

    sequence.effect()
        .file(file("jb2a.guiding_bolt.01.yellow"))
        .attachTo(token)
        .stretchTo(target, { attachTo: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .zIndex(2)
        .waitUntilFinished(-2000);

    sequence.effect()
        .file(file("jb2a.extras.tmfx.border.circle.outpulse.02.normal"))
        .attachTo(target)
        .fadeIn(250)
        .fadeOut(500)
        .scaleToObject(1.075 * target.document.texture.scaleX)
        .tint(0xfbd328)
        .belowTokens()
        .zIndex(1)
        .persist()
        .name(id);

    sequence.effect()
        .copySprite(target)
        .atLocation(target)
        .loopProperty("sprite", "position.x", { from: -0.025, to: 0.025, duration: 75, pingPong: true, gridUnits: true })
        .fadeIn(100)
        .fadeOut(400)
        .duration(500)
        .scaleToObject(target.document.texture.scaleX)
        .opacity(0.5);

    sequence.effect()
        .file(file("jb2a.extras.tmfx.border.circle.outpulse.02.normal"))
        .attachTo(target)
        .fadeIn(250)
        .fadeOut(500)
        .scaleToObject(target.document.texture.scaleX)
        .tint(0xfbd328)
        .zIndex(1)
        .persist()
        .name(id)
        .mask();

    sequence.effect()
        .file(file("jb2a.particles.outward.orange.02.03"))
        .attachTo(target)
        .fadeIn(1000)
        .scaleToObject(target.document.texture.scaleX * 1.5)
        .scaleIn(0, 500, { ease: "easeOutCirc" })
        .zIndex(1)
        .filter("ColorMatrix", { hue: -5, saturate: -0.2, brightness: 1.2 })
        .persist()
        .randomRotation()
        .name(id)
        .mask(target);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) { return sequence.play(); }
}

function stop(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: id, object: target });
}

export const guidingBolt = {
    create,
    play,
    stop,
};