// Original Author: eskiemoh#2969
// Modularized: bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    darkMap: true,
};

async function createMelee(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { darkMap } = mConfig;

    const sequence = new Sequence();
    for (let i = 0; i < 4; i++) {
        const offset = [
            { x: 0.3 * token.document.width, y: -0.85 * token.document.width },
            { x: 0.25 * token.document.width, y: -0.45 * token.document.width },
            { x: -0.2 * token.document.width, y: -0.4 * token.document.width },
            { x: -0.05 * token.document.width, y: -0 * token.document.width },
        ];

        sequence.effect()
            .name(`DivineStrike`)
            .delay(10 + 50 * i)
            .file(closest("jb2a.twinkling_stars.points04.white"))
            .atLocation(target)
            .rotateTowards(token)
            .scaleToObject(0.4, { gridUnits: true })
            .scaleIn(0, 500, { ease: "easeOutBack" })
            .scaleOut(0, 250, { ease: "easeOutCubic" })
            .duration(1000 - (10 + 50 * i))
            .spriteOffset(offset[i], { gridUnits: true })
            .zIndex(2);

        sequence.effect()
            .name(`point`)
            .delay(10 + 50 * i)
            .file(closest("animated-spell-effects-cartoon.energy.pulse.yellow"))
            .atLocation(target)
            .rotateTowards(token)
            .scaleToObject(0.4, { gridUnits: true })
            .spriteOffset(offset[i], { gridUnits: true })
            .filter("ColorMatrix", { saturate: -1 })
            .zIndex(2);
    }
    if (darkMap && canvas?.scene?.background?.src) {
        sequence.effect()
            .file(closest(canvas.scene.background.src))
            .filter("ColorMatrix", { brightness: 0.5 })
            .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .spriteOffset({ x: -0 }, { gridUnits: true })
            .duration(2500)
            .fadeIn(250)
            .fadeOut(500)
            .belowTokens();
    }
    sequence.wait(500)
        .canvasPan()
        .delay(300)
        .shake({ duration: 1000, strength: 1, rotation: false, fadeOutDuration: 1000 });

    sequence.effect()
        .delay(300)
        .file(closest("jb2a.impact.ground_crack.01.purple"))
        .atLocation(target)
        .size(2.3 * token.document.width, { gridUnits: true })
        .filter("ColorMatrix", { saturate: -0, brightness: 0 })
        .belowTokens()
        .playbackRate(0.85)
        .randomRotation();

    sequence.effect()
        .delay(300)
        .file(closest("jb2a.particles.outward.white.02.03"))
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .fadeOut(1500)
        .atLocation(target)
        .duration(1500)
        .size(2.15, { gridUnits: true })
        .zIndex(5);

    sequence.effect()
        .delay(300)
        .file(closest("animated-spell-effects-cartoon.energy.pulse.yellow"))
        .atLocation(target)
        .scaleToObject(1.75)
        .filter("ColorMatrix", { saturate: -1 })
        .zIndex(1.1);

    sequence.effect()
        .file(closest("jb2a.divine_smite.target.yellowwhite"))
        .attachTo(target, { bindScale: false })
        .rotateTowards(token)
        .scaleToObject(2)
        .spriteOffset({ x: -1.0 * token.document.width, y: -0 * token.document.width }, { gridUnits: true })
        .mirrorY()
        .rotate(90)
        .filter("ColorMatrix", { saturate: -0.35, hue: 150 })
        .zIndex(1);

    sequence.wait(250);

    return sequence;
}

async function playMelee(token, target, config = {}) {
    const sequence = await createMelee(token, target, config);
    if (sequence) { return sequence.play(); }
}

async function createRanged(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { darkMap } = mConfig;

    const sequence = new Sequence();
    const distance = {
        x: (token.center.x - target.center.x),
        y: (token.center.y - target.center.y),
    };

    const midpoint = {
        x: (token.center.x + target.center.x) / 2,
        y: (token.center.y + target.center.y) / 2,
    };
    let randomOffset;

    if (Math.abs(distance.x) > Math.abs(distance.y)) {

        randomOffset = [
            { x: -0, y: 0.2 },
            { x: 0, y: -0.35 },
            { x: -0, y: 0.35 },
            { x: 0, y: -0.2 },
        ];

    } else {

        randomOffset = [
            { x: -0.2, y: 0 },
            { x: 0.35, y: -0 },
            { x: -0.35, y: 0 },
            { x: 0.2, y: -0 },
        ];
    }
    for (let i = 0; i < 4; i++) {

        const offset = [
            { x: distance.x / 4, y: distance.y / 4 },
            { x: distance.x / 12, y: distance.y / 12 },
            { x: -distance.x / 12, y: -distance.y / 12 },
            { x: -distance.x / 4, y: -distance.y / 4 },
        ];

        sequence.effect()
            .name(`DivineStrike`)
            .delay(10 + 50 * i)
            .file(closest("jb2a.twinkling_stars.points04.white"))
            .atLocation(midpoint, { offset: randomOffset[i], gridUnits: true })
            .scaleToObject(0.5, { gridUnits: true })
            .scaleIn(0, 500, { ease: "easeOutBack" })
            .scaleOut(0, 250, { ease: "easeOutCubic" })
            .duration(1000 - (10 + 50 * i))
            .spriteOffset(offset[i], { gridUnits: false })
            .zIndex(2)

        sequence.effect()
            .name(`point`)
            .delay(10 + 50 * i)
            .file(closest("animated-spell-effects-cartoon.energy.pulse.yellow"))
            .atLocation(midpoint, { offset: randomOffset[i], gridUnits: true })
            .scaleToObject(0.5, { gridUnits: true })
            .spriteOffset(offset[i], { gridUnits: false })
            .filter("ColorMatrix", { saturate: -1 })
            .zIndex(2)
    }

    if (darkMap && canvas?.scene?.background?.src) {
        sequence.effect()
            .file(closest(canvas.scene.background.src))
            .filter("ColorMatrix", { brightness: 0.5 })
            .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .spriteOffset({ x: -0 }, { gridUnits: true })
            .duration(2000)
            .fadeIn(250)
            .fadeOut(500)
            .belowTokens()
    }
    sequence.wait(500);

    sequence.effect()
        .file(closest("jb2a.ranged.02.projectile.01.yellow"))
        .atLocation(token)
        .stretchTo(target)
        .opacity(1)
        .playbackRate(1.5)
        .filter("ColorMatrix", { saturate: 0.25 })
        .randomizeMirrorY()
        .filter("ColorMatrix", { saturate: -1, hue: 150 })
        .zIndex(0.2);

    sequence.effect()
        .file(closest("jb2a.ranged.03.projectile.01.pinkpurple"))
        .atLocation(token)
        .stretchTo(target)
        .opacity(1)
        .playbackRate(1.5)
        .randomizeMirrorY()
        .filter("ColorMatrix", { brightness: 0 })
        .zIndex(0.1);

    return sequence;
}

async function playRanged(token, target, config = {}) {
    const sequence = await createRanged(token, target, config);
    if (sequence) { return sequence.play(); }
}

export const divineStrike = {
    melee: {
        create: createMelee,
        play: playMelee,
        default_config: DEFAULT_CONFIG,
    },
    ranged: {
        create: createRanged,
        play: playRanged,
        default_config: DEFAULT_CONFIG,
    },
    default_config: DEFAULT_CONFIG,
};
