// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'elementalBlast.electricity',
};

/**
 *
 * @param {object} token
 * @param {object} target
 * @param {object} config
 * @returns {Sequence}
 */
async function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let ranOffset = (Math.random() * (0.4 +0.4)  -0.4);

    const targetCenter = {
    x: target.x+canvas.grid.size*target.document.width/2,
    y: target.y+canvas.grid.size*target.document.width/2,
    };

    const tokenCenter = {
      x: token.x + canvas.grid.size * token.document.width / 2,
      y: token.y + canvas.grid.size * token.document.width / 2,
    };

    const distance = Math.sqrt(
      Math.pow(targetCenter.x - tokenCenter.x, 2) + Math.pow(targetCenter.y - tokenCenter.y, 2)
    );

    const gridDistance = (distance/canvas.grid.size)*5

    let projHeight = [];
    let projX = [];
    let impactSize = [];
    if (gridDistance >= 85){

    projHeight = canvas.grid.size/100;
    projX = true;
    impactSize = 1.5;

    } else if (gridDistance >= 55) {

    projHeight = canvas.grid.size/125;
    projX = true;
    impactSize = 1.25;

    } else if (gridDistance > 30) {

    projHeight = canvas.grid.size/150;
    projX = true;
    impactSize = 1;
    } else  {

    projHeight = 1;
    projX = false;
    impactSize = 1;

    }

    console.log(distance);

    let sequence = new Sequence()

    .effect()
    .file(closest("animated-spell-effects-cartoon.smoke.17"))
    .atLocation(token,{offset:{x:-0, y: -0}, gridUnits:true, local:false})
    .rotateTowards(targetCenter, {local: true})
    .spriteOffset({x: -1.0+ranOffset, y:-1.2- (token.document.width-1)/2}, {gridUnits:true})
    .scaleToObject(2)
    .rotate(-90)
    .zIndex(1)

    .effect()
    .delay(0)
    .file(closest("animated-spell-effects-cartoon.electricity.blast.03"))
    .atLocation(token,{offset:{x:0.5* token.document.width, y: ranOffset}, gridUnits:true, local:true})
    .stretchTo(target, {onlyX: projX})
    .playbackRate(1.5)
    .scale(projHeight)
    .filter("ColorMatrix", {saturate: 1, hue: -20 })
    .waitUntilFinished(-600)

    .effect()
    .file(closest("jb2a.impact.011.blue"))
    .atLocation(target,{offset:{x:0, y:0}, gridUnits:true})
    .scale(impactSize/2)
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
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const electricityBlast = {
    create,
    play,
    stop
};
