// Original Author: EskieMoh#2969
// Updater: bakanabaka

import { file } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'elementalBlast.air',
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
    if (gridDistance >= 85){

    projHeight = canvas.grid.size/200;
    projX = true;

    } else if (gridDistance >= 55) {

    projHeight = canvas.grid.size/250;
    projX = true;

    } else if (gridDistance > 30) {

    projHeight = canvas.grid.size/300;
    projX = true;
    } else  {

    projHeight = 1;
    projX = false;

    }

    console.log(distance);

    let sequence = new Sequence()

    .effect()
    .file(file("animated-spell-effects-cartoon.smoke.17"))
    .atLocation(token,{offset:{x:-0, y: -0}, gridUnits:true, local:false})
    .rotateTowards(targetCenter, {local: true})
    .spriteOffset({x: -1.0+ranOffset, y:-1.2- (token.document.width-1)/2}, {gridUnits:true})
    .scaleToObject(2)
    .rotate(-90)
    .zIndex(1)

    .effect()
    .delay(0)
    .file(file("animated-spell-effects-cartoon.air.bolt.ray"))
    .atLocation(token,{offset:{x:0.5* token.document.width, y: ranOffset}, gridUnits:true, local:true})
    .stretchTo(target, {onlyX: projX})
    .scale(projHeight)
    .waitUntilFinished(-2000)

    .effect()
    .file(file("jb2a.impact.007.white"))
    .atLocation(target,{offset:{x:0, y:0}, gridUnits:true})
    .scale(0.6)
    .filter("ColorMatrix", { hue: 150 })

    .effect()
    .file(file("animated-spell-effects-cartoon.smoke.43"))
    .atLocation(target,{offset:{x:0, y:0}, gridUnits:true})
    .scale(0.3)
    .filter("ColorMatrix", { hue: 150 })
    .randomRotation()
    .zIndex(1)
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

export const airBlast = {
    create,
    play,
    stop
};
