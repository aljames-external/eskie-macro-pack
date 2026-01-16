// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { file } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'bless',
    color: 'yellow',
};

function createCaster(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { color } = mConfig;
    let hue = -20;

    const sequence = new Sequence();
        // Effect on the caster
        sequence.effect()
            .file(file(`jb2a.bless.200px.intro.${color}`))
            .atLocation(token)
            .filter("ColorMatrix", { hue: hue });

        // Ground effects
        sequence.effect()
            .file(file("jb2a.extras.tmfx.inflow.circle.03"))
            .atLocation(token)
            .size(12.65, { gridUnits: true })
            .spriteScale({ x: 1, y: 1 })
            .belowTokens()
            .opacity(0.15)
            .duration(1800)
            .fadeIn(250)
            .fadeOut(500)
            .delay(1200)
            .zIndex(1);

        sequence.effect()
            .file(file("jb2a.particles.inward.blue.01.03"))
            .atLocation(token)
            .size(12.65, { gridUnits: true })
            .spriteScale({ x: 1, y: 1 })
            .belowTokens()
            .filter("ColorMatrix", { brightness: 5, saturate: -1 })
            .opacity(0.05)
            .duration(1800)
            .fadeIn(250)
            .fadeOut(500)
            .delay(1200)
            .zIndex(1);

        sequence.effect()
            .file(file(`jb2a.markers.light.complete.${color}`))
            .atLocation(token)
            .size(20, { gridUnits: true })
            .spriteScale({ x: 0.5, y: 1.25 })
            .belowTokens()
            .opacity(0.5)
            .duration(2800)
            .randomRotation()
            .fadeIn(500)
            .fadeOut(500)
            .shape("circle", {
                lineSize: canvas.grid.size * 5.2,
                lineColor: "#FF0000",
                radius: 8.85,
                gridUnits: true,
                name: "test",
                isMask: true
            })
            .zIndex(2)
            .filter("ColorMatrix", { hue: hue })
            .repeats(3, 150, 150);

        sequence.effect()
            .atLocation(token)
            .size(18, { gridUnits: true })
            .spriteScale({ x: 1, y: 1 })
            .belowTokens()
            .opacity(0.1)
            .duration(1500)
            .fadeIn(250)
            .fadeOut(500)
            .delay(1200)
            .shape("circle", {
                lineSize: canvas.grid.size * 0.24,
                lineColor: "#FFFFFF",
                radius: 6.175,
                gridUnits: true,
                name: "test",
                isMask: false
            })
            .filter("Blur", { blurX: 10, blurY: 10 });
    return sequence;
}

async function playCaster(token, config = {}) {
    const sequence = createCaster(token, config);
    if (sequence) { return sequence.play(); }
}

function createTarget(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, color } = mConfig;
    let hue = -20;

    const sequence = new Sequence();
            // Effects on the targets
            sequence.effect()
                .copySprite(target)
                .atLocation(target)
                .filter("ColorMatrix", { brightness: 5, saturate: -1 })
                .filter("Blur", { blurX: 10, blurY: 10 })
                .opacity(1)
                .fadeIn(250)
                .fadeOut(500)
                .duration(1000)
                .delay(1150);

            sequence.effect()
                .file(file(`jb2a.bless.200px.loop.${color}`))
                .name(`${id} - ${target.name}`)
                .attachTo(target)
                .fadeIn(500, { delay: 250 })
                .fadeOut(500)
                .delay(900)
                .filter("ColorMatrix", { hue: hue })
                .zIndex(1)
                .persist();
    return sequence;
}

async function playTarget(target, config = {}) {
    const sequence = createTarget(target, config);
    if (sequence) { return sequence.play(); }
}
async function stopTarget(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {id} = mConfig;
    return Sequencer.EffectManager.endEffects({ name: `${id} - ${target.name}`, object: target });
}

function create(token, targets, config = {}) {
    const sequence = createCaster(token, config);
    targets.forEach(target => {
        sequence.addSequence(createTarget(target, config));
    });
    return sequence;
}

async function play(token, targets, config = {}) {
    const sequence = create(token, targets, config);
    if (sequence) { return sequence.play(); }
}

export const bless = {
    create,
    play,
    cast: {
        create: createCaster,
        play: playCaster
    },
    effect: {
        create: createTarget,
        play: playTarget,
        stop: stopTarget
    }
};

autoanimations.register("Bless", "token", "eskie.effect.bless.cast", DEFAULT_CONFIG);
autoanimations.register("Bless", "effect", "eskie.effect.bless.effect", DEFAULT_CONFIG);