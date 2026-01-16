//Last Updated: 12/22/2025
//Author: .eskie

import { tokens } from '../../../lib/tokens.js';
import { file } from '../../../lib/filemanager.js';
import { settingsOverride } from "../../../lib/settings.js";
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: "Rapid Strike",
    type: "slashing",   //Set Attack type (slashing, piercing, bludgeoning)
    weight: "heavy",    //Set Attack Weight (light,medium, or heavy)
    color: "red",   //Set Attack Color
    attacks: 12,     //Set Attack Number
    sound: {
        enabled: true,
        volume: 0.5
    }
}

function create(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { type, weight, color, attacks, sound } = mConfig;

    //Determine Attack Size
    const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight];
    let effectSize = 2 + (0.25 * weightIndex);
    let effectOffset = -0.75 - (0.25 * weightIndex);
    let targetSquare = tokens.getNearestSquareCenter(token, target);

    function attackAnimation(token, target, config) {
        const seq = new Sequence();
            if ( sound.enabled ) {
                seq.sound()
                    .file(file(`psfx.impacts.${type}`))
                    .volume(sound.volume);
            }

            seq.effect()
                .file(file(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow`))
                .atLocation(token)
                .rotateTowards(targetSquare,{randomOffset:0.25})
                .scaleToObject(effectSize)
                .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
                .randomizeMirrorY()
                .fadeOut(750, {ease:"easeOutQuint"})
                .zIndex(1)

            .effect()
                .delay(150)
                .file(file("jb2a.impact.003.yellow"))
                .size(1.75 * token.document.width, { gridUnits: true })
                .atLocation(targetSquare)
                .randomRotation()
                .playbackRate(1)
                .spriteScale({x:1, y:1}, {gridUnits:true})
                .zIndex(0.1)

            .effect()
                .delay(150)
                .file(file(`jb2a.impact.008.${color}`))
                .size(0.75 * token.document.width, { gridUnits: true })
                .atLocation(targetSquare)
                .randomRotation()
                .playbackRate(1.25)
                .zIndex(0.1)

            .effect()
                .delay(150)
                .file(file(`eskie.slice.01.color.${color}`))
                .size(1.25 * token.document.width, { gridUnits: true })
                .atLocation(targetSquare)
                .randomRotation()
                .playbackRate(1)
                .spriteScale({x:4, y:1}, {gridUnits:true})
                .zIndex(0.15)

            .effect()
                .delay(150)
                .file(file("eskie.slice.01.black.colorless"))
                .size(1.25 * token.document.width, { gridUnits: true })
                .atLocation(targetSquare)
                .randomRotation()
                .playbackRate(1)
                .spriteScale({x:16, y:1}, {gridUnits:true})
                .belowTokens()
                .opacity(0.15)
                .zIndex(0.15)

            .effect()
                .delay(150)
                .copySprite(target)
                .attachTo(target)
                .scaleToObject(1,{considerTokenScale:true})
                .spriteRotation(-target.document.rotation)
                .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
                .opacity(0.25)
                .duration(1000)
                .fadeOut(750)
                .tint("#FF0000")

            .wait(150);

        return seq;
    }

    const seq = new Sequence();
    for(let i = 1; i <= attacks; i++){    
        seq.addSequence(attackAnimation(token, target, config));
    };

    return seq;
}

async function play(token, target, config = {}) {
    config = settingsOverride(config);
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
}

export const rapidStrike = { 
    create,
    play,
};

autoanimations.register("Rapid Strike", "melee-target", "eskie.effect.rapidStrike", DEFAULT_CONFIG);