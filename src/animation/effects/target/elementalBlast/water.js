// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'elementalBlast.water',
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

    projHeight = 2.5;
    projX = true;
    impactSize = 1.5*4;

    } else if (gridDistance >= 55) {

    projHeight = 2;
    projX = true;
    impactSize = 1.25*4;

    } else if (gridDistance > 30) {

    projHeight = 1.5;
    projX = true;
    impactSize = 1*4;
    } else  {

    projHeight = 1;
    projX = false;
    impactSize = 0.75*4;

    }

    console.log(distance);

    let sequence = new Sequence()

    .effect()
    .file(closest("animated-spell-effects-cartoon.water.11"))
    .atLocation(token,{offset:{x:-0, y: -0}, gridUnits:true, local:false})
    .rotateTowards(targetCenter, {local: true})
    .spriteOffset({x: -1.0+ranOffset, y:-0.65- (token.document.width-1)/2}, {gridUnits:true})
    .scaleToObject(2)
    .rotate(-90)

    .effect()
    .delay(0)
    .file(closest("animated-spell-effects-cartoon.water.71"))
    .atLocation(token,{offset:{x:0*token.document.width, y: ranOffset}, gridUnits:true, local:true})
    .rotateTowards(target)
    .spriteRotation(90)
    .playbackRate(1.5)
    .size({width:(gridDistance/5),height:gridDistance/5}, {gridUnits:true})
    .zIndex(1)
    .waitUntilFinished(-1000)

    .effect()
    .file(closest("jb2a.impact.007.yellow"))
    .atLocation(target,{offset:{x:0, y:0}, gridUnits:true})
    .size(impactSize/2, {gridUnits:true})
    .filter("ColorMatrix", {saturate: -1, hue: -20 })

    .effect()
    .file(closest("animated-spell-effects-cartoon.water.23"))
    .atLocation(target,{offset:{x:0, y:0}, gridUnits:true})
    .size(impactSize, {gridUnits:true})
    .rotateTowards(token)
    .rotate(90)
    .spriteOffset({x: -1.5*projHeight  , y:-0.5- (token.document.width-1)/2}, {gridUnits:true})
    .zIndex(1.1)
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

export const waterBlast = {
    create,
    play,
    stop
};
