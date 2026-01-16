// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { file } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'elementalBlast.vitality',
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
    impactSize = 1.5;

    } else if (gridDistance >= 55) {

    projHeight = 2;
    projX = true;
    impactSize = 1.25;

    } else if (gridDistance > 30) {

    projHeight = 1.5;
    projX = true;
    impactSize = 1;
    } else  {

    projHeight = 1;
    projX = false;
    impactSize = 0.75;

    }

    console.log(distance);

    let sequence = new Sequence()

    .effect()
    .file(file("jb2a.swirling_leaves.outburst.01.greenorange"))
    .atLocation(token,{offset:{x:-0, y: -0}, gridUnits:true, local:false})
    .rotateTowards(targetCenter, {local: true})
    .spriteOffset({x: (-1.0+ranOffset)*token.document.width, y:-0.4- (token.document.width-1)/2}, {gridUnits:true})
    .size({width: token.document.width*2, height: token.document.width*1.25}, {gridUnits:true, uniform: false})
    .rotate(-90)

    .effect()
    .file(file("jb2a.swirling_leaves.ranged.greenorange"))
    .atLocation(token, {offset:{x:0 , y: 0+ranOffset},local: true, gridUnits:true})
    .stretchTo(target)
    .playbackRate(2.1)
    .fadeIn(500, {delay: (gridDistance/5*100)/2})
    .scale(0.85)

    .effect()
    .delay(0)
    .file(file("jb2a.energy_strands.range.standard.dark_green.{{num}}"))
    .atLocation(token, {offset:{x:0.15* token.document.width, y: 0+ranOffset},local: true, gridUnits:true})
    .stretchTo(target)
    .playbackRate(1)
    .zIndex(1)
    .fadeIn(100)
    .filter("ColorMatrix", {saturate: 0, brightness:1.25, hue:-50 })
    .setMustache({
    "num": ()=> {
    const nums = [`01`,`02`,`03`];
    return nums[Math.floor(Math.random()*nums.length)];
    }
    })
    .repeats(3, 50,50)
    .opacity(0.8)
    .randomizeMirrorY()
    .waitUntilFinished(-1500)

    .effect()
    .file(file("jb2a.healing_generic.400px.green"))
    .atLocation(target)
    .scale(0.5)
    .filter("ColorMatrix", {saturate: 0, brightness:1.25, hue:-50 })
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

export const vitalityBlast = {
    create,
    play,
    stop
};
