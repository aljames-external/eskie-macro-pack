// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';

const DEFAULT_CONFIG = {
    id: 'Sanctuary',
};

async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let seq = new Sequence()
        .effect()
            .atLocation(token)
            .file(closest(`jb2a.markers.light.complete.blue`))
            .scaleToObject(2)
            .scaleIn(0, 600, {ease: "easeOutCubic"})
            .belowTokens()
            .fadeOut(2000)
            .duration(5000)
            .zIndex(1)
            .filter("ColorMatrix", {saturate:-1, brightness:1.5})

        .wait(250)

        .effect()
            .atLocation(token)
            .file(closest(`jb2a.magic_signs.circle.02.abjuration.loop.blue`))
            .scaleToObject(1.25)
            .rotateIn(180, 600, {ease: "easeOutCubic"})
            .scaleIn(0, 600, {ease: "easeOutCubic"})
            .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
            .belowTokens()
            .fadeOut(2000)
            .zIndex(0)
            .filter("ColorMatrix", {hue:-5, saturate:-0.5, brightness:1.25})

        .effect()
            .atLocation(token)
            .file(closest(`jb2a.magic_signs.circle.02.abjuration.loop.blue`))
            .scaleToObject(1.25)
            .rotateIn(180, 600, {ease: "easeOutCubic"})
            .scaleIn(0, 600, {ease: "easeOutCubic"})
            .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000})
            .belowTokens(true)
            .filter("ColorMatrix", {saturate:-1, brightness:2})
            .filter("Blur", { blurX: 5, blurY: 10 })
            .zIndex(0.1)
            .duration(1200)
            .fadeIn(200, {ease: "easeOutCirc", delay: 500})
            .fadeOut(300, {ease: "linear"})

        .wait(250)

        .effect()
            .copySprite(target)
            .atLocation(target)
            .scaleToObject(1, { considerTokenScale: true })
            .duration(2000)
            .fadeIn(2000)
            .filter("ColorMatrix", {saturate:-1, brightness:10})
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.5)
            .waitUntilFinished(-1500)

        .effect()
            .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.normal"))
            .atLocation(target)
            .scaleToObject(3.25 * target.document.texture.scaleX)
            .delay(1200)

        .effect()
            .file(closest("jb2a.butterflies.single.blue"))
            .name(`${target.name} Sanctuary`)
            .scaleToObject(2 * target.document.texture.scaleX)
            .opacity(1)
            .fadeIn(2000)
            .filter("ColorMatrix", {saturate:-1, brightness:2})
            .persist()
            .private()
            .attachTo(target, {bindRotation: false})
            .fadeOut(750)
            .zIndex(3)
            .delay(1200)

        .effect()
            .file(closest("jb2a.extras.tmfx.inflow.circle.03"))
            .name(`${target.name} Sanctuary`)
            .atLocation(target)
            .scaleToObject(target.document.texture.scaleX)
            .opacity(0.75)
            .persist()
            .private()
            .attachTo(target)
            .fadeIn(1000)
            .fadeOut(500)
            .zIndex(1)
            .delay(1200)

        .effect()
            .file(closest("jb2a.extras.tmfx.outflow.circle.02"))
            .atLocation(target)
            .fadeIn(200)
            .opacity(0.25)
            .duration(10000)
            .scaleToObject(3 * target.document.texture.scaleX)
            .fadeOut(500)
            .belowTokens()
            .delay(1200)

        .effect()
            .file(closest("jb2a.particles.outward.blue.01.03"))
            .atLocation(target)
            .filter("ColorMatrix", {saturate:-1, brightness:2})
            .fadeIn(200, {ease: "easeInExpo"})
            .duration(10000)
            .opacity(0.25)
            .scaleToObject(3 * target.document.texture.scaleX)
            .fadeOut(500)
            .belowTokens()
            .delay(1200)

        .effect()
            .name(`${target.name} Sanctuary`)
            .file(closest("jb2a.bless.200px.intro.blue"))
            .atLocation(target)
            .scaleToObject(1.5 * target.document.texture.scaleX)
            .fadeIn(2000)
            .opacity(1)
            .waitUntilFinished(-500)
            .zIndex(0)

        .effect()
            .name(`${target.name} Sanctuary`)
            .file(closest("jb2a.bless.200px.loop.blue"))
            .scaleToObject(1.5 * target.document.texture.scaleX)
            .opacity(0.75)
            .fadeOut(500)
            .persist()
            .attachTo(target, {bindRotation: false})
            .zIndex(0)
            .waitUntilFinished();
            
    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) { seq.play(); }
}

function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    return Sequencer.EffectManager.endEffects({ name: `${token.name} ${id}`, object: token });
}

export const sanctuary = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
