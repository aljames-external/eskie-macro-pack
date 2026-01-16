// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    darkMap: true,
};

async function create(token, targets, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { darkMap } = mConfig;

    let sequence = new Sequence();

    if (darkMap && canvas.scene.background.src) {
        sequence.effect()
            .file(canvas.scene.background.src)
            .filter("ColorMatrix", { brightness: 0.5 })
            .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .spriteOffset({ x: -0 }, { gridUnits: true })
            .duration(2500)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens()
    }

    sequence.wait(250)
        .effect()
        .file(closest("jb2a.healing_generic.03.burst.bluepurple"))
        .attachTo(token)
        .scaleToObject(2.2, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .startTime(1000)
        .filter("ColorMatrix", { saturate: -0.5, hue: -50 })
        .zIndex(1)
        
        .effect()
        .file(closest("animated-spell-effects-cartoon.misc.all seeing eye"))
        .attachTo(token)
        .scaleToObject(0.6, { gridUnits: true })
        .filter("ColorMatrix", { saturate: -1, hue: 105 })
        .scaleIn(0, 500, { ease: "easeOutBack" })
        .scaleOut(0, 500, { ease: "easeOutCubic" })
        .duration(2500)
        .zIndex(0.1)

        .effect()
        .file(closest("jb2a.twinkling_stars.points08.white"))
        .attachTo(token)
        .scaleToObject(0.75, { gridUnits: true })
        .scaleIn(0, 500, { ease: "easeOutBack" })
        .scaleOut(0, 500, { ease: "easeOutCubic" })
        .duration(2500)
        .zIndex(1)

        .effect()
        .file(closest("animated-spell-effects-cartoon.energy.pulse.yellow"))
        .attachTo(token, { offset: { x: 0 }, gridUnits: true })
        .scaleToObject(0.7, { gridUnits: true })
        .filter("ColorMatrix", { saturate: -1 })
        .zIndex(1);

    return sequence;
}

async function play(token, targets, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { darkMap } = mConfig;
    const sequence = await create(token, targets, mConfig);
    await sequence.play();

    let targetOrder = [token];
    let targetOffsetX = [0];
    let targetOffsetY = [0];

    function calculateDistance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    function generateRandomOffset() {
        return (Math.random() - 0.5) * 0.6;
    }

    targets.sort((a, b) => calculateDistance(token, a) - calculateDistance(token, b));

    for (let i = 0; i < targets.length; i++) {
        let lastAdded = targetOrder[targetOrder.length - 1];
        let closestDistance = Infinity;
        let closestIndex = -1;
        for (let j = 0; j < targets.length; j++) {
            if (targetOrder.includes(targets[j])) continue;
            let distance = calculateDistance(lastAdded, targets[j]);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = j;
            }
        }
        if (closestIndex !== -1) {
            targetOrder.push(targets[closestIndex]);
            targetOffsetX.push(generateRandomOffset());
            targetOffsetY.push(generateRandomOffset());
        }
    }

    for (let u = 0; u < targetOrder.length; u++) {
        if (u + 1 < targetOrder.length) {
            new Sequence()
                .wait(500 + 100 * u)
                .effect()
                .file(closest("jb2a.energy_beam.normal.yellow.03"))
                .atLocation(targetOrder[u], { offset: { x: targetOffsetX[u], y: targetOffsetY[u] }, gridUnits: true })
                .stretchTo(targetOrder[u + 1], { offset: { x: targetOffsetX[u + 1], y: targetOffsetY[u + 1] }, gridUnits: true, onlyX: true })
                .scale(0.1)
                .duration(2000)
                .fadeIn(500)
                .fadeOut(500)
                .filter("ColorMatrix", { saturate: -1, brightness: 1.1 })
                .opacity(1)

                .effect()
                .delay(10 + 100 * u)
                .file(closest(`jb2a.twinkling_stars.points04.white`))
                .attachTo(targetOrder[u + 1], { offset: { x: targetOffsetX[u + 1], y: targetOffsetY[u + 1] }, gridUnits: true })
                .scaleToObject(0.65, { gridUnits: true })
                .scaleIn(0, 500, { ease: "easeOutBack" })
                .scaleOut(0, 500, { ease: "easeOutCubic" })
                .duration(2000)
                .zIndex(1)

                .effect()
                .delay(10 + 100 * u)
                .file(closest("animated-spell-effects-cartoon.energy.pulse.yellow"))
                .attachTo(targetOrder[u + 1], { offset: { x: targetOffsetX[u + 1], y: targetOffsetY[u + 1] }, gridUnits: true })
                .scaleToObject(0.6, { gridUnits: true })
                .filter("ColorMatrix", { saturate: -1 })
                .zIndex(1)

                .effect()
                .delay(10 + 100 * u)
                .file(closest("jb2a.healing_generic.03.burst.bluepurple"))
                .attachTo(targetOrder[u + 1])
                .scaleToObject(2.2, { considerTokenScale: true })
                .fadeIn(500)
                .fadeOut(1000)
                .opacity(1)
                .belowTokens()
                .startTime(1000)
                .filter("ColorMatrix", { saturate: -0.5, hue: -50 })
                .zIndex(1)
                .play()
        }
    }
}

function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const eyesOfNight = {
    create,
    play,
    stop
};
