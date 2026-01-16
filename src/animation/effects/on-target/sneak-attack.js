//Last Updated: 12/15/2025
//Author: .eskie
//Update: bakanabaka

import { tokens } from '../../../lib/tokens.js';
import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG_MELEE = {
    id: "sneakAttackMelee",
    color: {
        attack: "redblack",
        impact: "red",
        damage: "red",
    },
    type: "slashing",
    weight: "medium",
}

async function createMelee(token, target, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG_MELEE, config, {inplace:false});
    const { id, color, type, weight } = mConfig;

    //Determine Attack Size
    const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight];

    let effectSize = 2 + (0.25 * weightIndex);
    let effectOffset = -0.75 - (0.25 * weightIndex);

    //Determine nearest targetSquare
    let targetSquare = tokens.getNearestSquareCenter(token, target);

    let seq = new Sequence()

    .effect()
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color.attack}.slow`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize)
        .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
        .randomizeMirrorY()
        .zIndex(1)

    .effect()
        .delay(150)
        .file(closest(`jb2a.impact.007.${color.impact}`))
        .size(1.25 * token.document.width, { gridUnits: true })
        .atLocation(targetSquare)
        .randomRotation()
        .playbackRate(0.9)
        .zIndex(0.1)

    .effect()
        .delay(150)
        .file(closest(`jb2a.liquid.splash_side02.${color.damage}`))
        .atLocation(targetSquare)
        .size(1.5 * token.document.width, { gridUnits: true })
        .rotateTowards(token)
        .spriteOffset({ x: -1.15 * token.document.width }, { gridUnits: true })
        .spriteRotation(180)
        .zIndex(0)

    .effect()
        .delay(150)
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1,{considerTokenScale:true})
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .opacity(0.25)
        .duration(1000)
        .fadeOut(750)
        .tint("#FF0000")

    return seq;
}

async function playMelee(token, target, config) {
    const seq = await createMelee(token, target, config);
    if (seq) { return seq.play(); }
}

const melee = {
    create: createMelee,
    play: playMelee,
}

const DEFAULT_CONFIG_RANGED = {
    id: "sneakAttackRanged",
    color: {
        attack: "red",
        impact: "red",
        damage: "red",
    }
};

function createRanged(token, target, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG_RANGED, config, {inplace:false});
    const { id, color } = mConfig;

    let seq = new Sequence()
        .effect()
            .file(closest(`eskie.slice.01_ranged.black.${color.attack}`))
            .atLocation(token)
            .stretchTo(target)
            .spriteOffset({ x: token.document.width / 2 }, { gridUnits: true })
            .zIndex(1)

        .effect()
            .delay(150)
            .file(closest(`jb2a.impact.007.${color.impact}`))
            .size(1.25 * token.document.width, { gridUnits: true })
            .atLocation(target)
            .randomRotation()
            .playbackRate(0.9)
            .zIndex(0.1)

        .effect()
            .delay(150)
            .file(closest(`jb2a.liquid.splash_side02.${color.damage}`))
            .atLocation(target)
            .size(1.5 * token.document.width, { gridUnits: true })
            .rotateTowards(token)
            .spriteOffset({ x: -1.15 * token.document.width }, { gridUnits: true })
            .spriteRotation(180)
            .zIndex(0)

        .effect()
            .delay(150)
            .copySprite(target)
            .attachTo(target)
            .scaleToObject(1,{considerTokenScale:true})
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
            .opacity(0.25)
            .duration(1000)
            .fadeOut(750)
            .tint("#FF0000");
    return seq;
}

async function playRanged(token, target, config) {
    const seq = await createRanged(token, target, config);
    if (seq) { return seq.play(); }
}

const ranged = {
    create: createRanged,
    play: playRanged,
}

const DEFAULT_CONFIG = {
    melee: DEFAULT_CONFIG_MELEE,
    ranged: DEFAULT_CONFIG_RANGED,
}

export const sneakAttack = {
    melee,
    ranged,
}

autoanimations.register("Sneak Attack", "ranged-target", "eskie.effect.sneakAttack", DEFAULT_CONFIG);
autoanimations.register("Sneak Attack", "melee-target", "eskie.effect.sneakAttack", DEFAULT_CONFIG);