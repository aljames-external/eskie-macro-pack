// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'elementalBlast.wood',
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
    .file(closest("jb2a.swirling_leaves.outburst.01.greenorange"))
    .atLocation(token,{offset:{x:-0, y: -0}, gridUnits:true, local:false})
    .rotateTowards(targetCenter, {local: true})
    .spriteOffset({x: -1.0*token.document.width, y:-0.4- (token.document.width-1)/2}, {gridUnits:true})
    .size({width: token.document.width*2, height: token.document.width*1.25}, {gridUnits:true, uniform: false})
    .rotate(-90)

    .effect()
    .file(closest("jb2a.swirling_leaves.ranged.greenorange"))
    .atLocation(token)
    .stretchTo(target)
    .playbackRate(2.1)
    .fadeIn(250, {delay: (gridDistance/5*100)/2})
    .scale(0.85)
    .zIndex(0.1)

    .effect()
    .delay(0)
    .file(closest("animated-spell-effects-cartoon.fire.04"))
    .atLocation(token)
    .moveTowards(target, {local: true, ease:"easeInCubic"})
    .spriteOffset({x:0.75* token.document.width, y: 0},{gridUnits:true})
    .playbackRate(2)
    .scale(0.25)
    .duration(350)
    .zIndex(1)
    .loopOptions({ loops: 1 })
    .filter("ColorMatrix", {saturate: -1, brightness: 0  })
    .filter("Blur", {blurX: 5, blurY:10 })
    .opacity(0.5)
    .scaleIn(0, 500, {ease: "easeOutCubic"})
    .belowTokens()

    .effect()
    .delay(0)
    .file(closest("animated-spell-effects-cartoon.fire.04"))
    .atLocation(token)
    .moveTowards(target, {local: true, ease:"easeInCubic"})
    .spriteOffset({x:0.5* token.document.width, y: 0},{gridUnits:true})
    .playbackRate(2)
    .scale(0.25)
    .duration(gridDistance/5*75)
    .zIndex(1)
    .loopOptions({ loops: 1 })
    .filter("ColorMatrix", {saturate: -1, brightness:1.1, hue:35 })
    .tint("#b33e00")
    .filter("Glow", { color: 0xb2ff24 ,  distance: 1, innerStrength: 3, outerStrength:0})
    .scaleIn(0, 500, {ease: "easeOutCubic"})
    .fadeIn(100)
    .waitUntilFinished(-250)

    .effect()
    .file(closest("jb2a.impact.boulder.02"))
    .atLocation(target)
    .scale(0.3)
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

export const woodBlast = {
    create,
    play,
    stop
};
