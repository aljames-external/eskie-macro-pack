/**
 * Original Author: EskieMoh#2969
 * Update Author: bakanabaka
 */

import { file } from '../../../../lib/filemanager.js';
import { autoanimations } from '../../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'hex',
    duration: 10000
};

async function create(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, duration } = mConfig;

    let seq = new Sequence()
        .effect()
        .name(id)
        .file(file(`jb2a.particles.outward.purple.01.03`))
        .attachTo(target)
        .scale(0.15)
        .playbackRate(1)
        .duration(1000)
        .fadeOut(500)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { hue: 0 })
        .animateProperty("sprite", "width", { from: 0, to: 0.5, duration: 500, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("sprite", "height", { from: 0, to: 1.5, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true })
        .zIndex(0.2)

        .effect()
        .name(id)
        .file(file("animated-spell-effects-cartoon.misc.all seeing eye"))
        .attachTo(target)
        .filter("ColorMatrix", { hue: 182 })
        .scaleToObject(0.75)
        .scaleIn(0, 250, { ease: "easeOutCubic" })
        .zIndex(0.1)

        .effect()
        .name(id)
        .file(file("animated-spell-effects-cartoon.simple.27"))
        .attachTo(target)
        .scaleToObject(4)
        .spriteOffset({ x: 0.1, y: -0.45 }, { gridUnits: true })
        .filter("ColorMatrix", { brightness: -1 })

        .effect()
        .name(id)
        .file(file("jb2a.ward.rune.dark_purple.01"))
        .attachTo(target)
        .scaleToObject(1.85)
        .fadeOut(3000);
    seq = (duration > 0) ? seq.duration(duration) : seq.persist();
    seq = seq
        .opacity(1)
        .belowTokens()
        .scaleIn(0, 250, { ease: "easeOutCubic" })

        .effect()
        .name(id)
        .file(file("jb2a.extras.tmfx.outflow.circle.04"))
        .attachTo(target)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .opacity(2)
        .scaleToObject(1.35)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .fadeOut(500);

    return seq;
}

async function play(target, config = {}) {
    let seq = await create(target, config);
    if (seq) { await seq.play(); }
}

async function stop(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: id, object: target });
}

export const hexCast = {
    create,
    play,
    stop,
};

autoanimations.register("Hexed", "effect", "eskie.effect.hex.cast", DEFAULT_CONFIG);