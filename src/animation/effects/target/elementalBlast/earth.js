// Original Author: EskieMoh#2969
// Updater: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'elementalBlast.earth',
};

/**
 *
 * @param {object} token
 * @param {object} target
 * @param {object} config
 * @returns {Sequence}
 */
async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    let ranOffset = (Math.random() * (0.4 + 0.4) - 0.4);

    const targetCenter = {
        x: target.x + canvas.grid.size * target.document.width / 2,
        y: target.y + canvas.grid.size * target.document.width / 2,
    };

    const tokenCenter = {
        x: token.x + canvas.grid.size * token.document.width / 2,
        y: token.y + canvas.grid.size * token.document.width / 2,
    };

    const distance = Math.sqrt(
        Math.pow(targetCenter.x - tokenCenter.x, 2) + Math.pow(targetCenter.y - tokenCenter.y, 2)
    );

    const gridDistance = (distance / canvas.grid.size) * 5

    let projHeight = [];
    let projX = [];
    let impactSize = [];
    if (gridDistance >= 85) {

        projHeight = canvas.grid.size / 150;
        projX = true;
        impactSize = 1.75;

    } else if (gridDistance >= 55) {

        projHeight = canvas.grid.size / 225;
        projX = true;
        impactSize = 1.5;

    } else if (gridDistance > 30) {

        projHeight = canvas.grid.size / 300;
        projX = true;
        impactSize = 1.25;
    } else {

        projHeight = 1;
        projX = false;
        impactSize = 1;

    }

    console.log(distance);

    let sequence = new Sequence()

        .effect()
        .file(closest("eskie.pulse.energy.01.yellow.yellow"))
        .atLocation(token, { offset: { x: -0, y: -0 }, gridUnits: true, local: false })
        .rotateTowards(targetCenter, { local: true })
        .spriteOffset({ x: -0.5 + ranOffset, y: -0.7 - (token.document.width - 1) / 2 }, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 0.25, hue: -20 })
        .belowTokens()
        .scale(0.2)
        .rotate(-90)

        .effect()
        .file(closest("animated-spell-effects-cartoon.earth.debris.03"))
        .atLocation(token, { offset: { x: -0, y: -0 }, gridUnits: true, local: false })
        .rotateTowards(targetCenter, { local: true })
        .spriteOffset({ x: -1.5 + ranOffset, y: -0.75 - (token.document.width - 1) / 2 }, { gridUnits: true })
        .scale(0.35)
        .rotate(-90)

        .effect()
        .delay(0)
        .file(closest("jb2a.boulder.toss.02"))
        .atLocation(token, { offset: { x: 0.5 * token.document.width, y: ranOffset }, gridUnits: true, local: true })
        .stretchTo(target, { onlyX: false })
        .playbackRate(1)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .zIndex(1)
        .waitUntilFinished(-900)
    return sequence;
}
/**
 *
 * @param {object} token
 * @param {object} target
 * @param {object} config
 */
async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    sequence.play();
}

function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const earthBlast = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};