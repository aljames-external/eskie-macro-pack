// Original Author: EskieMoh#2969
// Updater: @bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'elementalBlast.metal',
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

    projHeight = canvas.grid.size/150;
    projX = true;
    impactSize = 1.75;

    } else if (gridDistance >= 55) {

    projHeight = canvas.grid.size/225;
    projX = true;
    impactSize = 1.5*2;

    } else if (gridDistance > 30) {

    projHeight = canvas.grid.size/300;
    projX = true;
    impactSize = 1.25*2;
    } else  {

    projHeight = 1;
    projX = false;
    impactSize = 1*2;

    }

    console.log(distance);

    let sequence = new Sequence()

    .effect()
    .file(closest("animated-spell-effects-cartoon.electricity.35"))
    .atLocation(token,{offset:{x:-0, y: -0}, gridUnits:true, local:false})
    .rotateTowards(targetCenter, {local: true})
    .spriteOffset({x: -0.75*token.document.width, y:-0.5- (token.document.width-1)/2}, {gridUnits:true})
    .size({width: token.document.width*1.5, height: token.document.width*0.75}, {gridUnits:true, uniform: false})
    .filter("ColorMatrix", {saturate: -1, hue: 50 })
    .playbackRate(1.75)
    .rotate(-90)

    .effect()
    .delay(200)
    .opacity(0.1)
    .file(closest("jb2a.chakram.01.throw"))
    .atLocation(token,{offset:{x:0* token.document.width, y: 0.5}, gridUnits:true, local:true})
    .startTime(650)
    .stretchTo(target, {onlyX: false})
    .playbackRate(0.8)
    .tint("#78e4ff")
    .filter("ColorMatrix", { hue: 0, saturate: -1, brightness: 2 })
    .filter("Glow", { color: 0x000000 , innerStrength: 3, outerStrength:0})

    .effect()
    .delay(100)
    .opacity(0.25)
    .file(closest("jb2a.chakram.01.throw"))
    .atLocation(token,{offset:{x:0* token.document.width, y: 0.5}, gridUnits:true, local:true})
    .startTime(650)
    .stretchTo(target, {onlyX: false})
    .playbackRate(0.8)
    .tint("#78e4ff")
    .filter("ColorMatrix", { hue: 0, saturate: -1, brightness: 2 })
    .filter("Glow", { color: 0x000000 , innerStrength: 3, outerStrength:0})

    .effect()
    .delay(0)
    .file(closest("jb2a.chakram.01.throw"))
    .atLocation(token,{offset:{x:0* token.document.width, y: 0.5}, gridUnits:true, local:true})
    .startTime(650)
    .stretchTo(target, {onlyX: false})
    .playbackRate(0.8)
    .tint("#78e4ff")
    .filter("ColorMatrix", { hue: 0, saturate: -1, brightness: 2 })
    .filter("Glow", { color: 0x000000 , innerStrength: 3, outerStrength:0})
    .waitUntilFinished(-1750)

    .effect()
    .file(closest("jb2a.side_impact.part.fast.ice_shard.blue"))
    .atLocation(target,{offset:{x:0, y:0}, gridUnits:true})
    .size(impactSize, {gridUnits:true})
    .rotateTowards(token)
    .rotate(180)
    .spriteOffset({x: 0-impactSize/4, y:-0- (token.document.width-1)/2}, {gridUnits:true})
    .tint("#78e4ff")
    .filter("ColorMatrix", { hue: 0, saturate: -1, brightness: 2 })
    .filter("Glow", { color: 0x000000 , innerStrength: 3, outerStrength:0})
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

export const metalBlast = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
