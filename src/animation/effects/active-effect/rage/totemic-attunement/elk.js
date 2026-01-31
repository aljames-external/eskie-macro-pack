//Last Updated: 1/27/2025
//Author: .eskie

import { closest } from "../../../../../lib/filemanager.js";
import { matt } from "../../../../utils/matt-tiles.js";

const DEFAULT_CONFIG = {
    id: 'Elk Totemic Attunement',
    color: 'red',
};

async function pronePlay(token, target, config = {}) {
    const seq = await proneCreate(token, target, config);
    if (seq) { await seq.play(); }
}

function proneCreate(token, target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, color } = mConfig;
    const label = `${id} - ${token.id}`;

    const seq = new Sequence()
        .animation()
            .delay(100)
            .on(target)
            .opacity(0)

        .effect()
            .copySprite(target)
            .attachTo(target, {bindAlpha:false, bindRotation:false,local:false})
            .scaleToObject(0.9)
            .zIndex(0.1)
            .belowTokens()
            .filter("ColorMatrix", { brightness:0 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.65)
            .duration(1200)

        .effect()
            .delay(100)
            .file(closest(`eskie.damage.bludgeoning.01.${color}`))
            .attachTo(target,{bindAlpha:false,bindRotation:false})
            .scaleToObject(1.5)
            .opacity(1)
            .zIndex(1)
            .belowTokens()
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", gridUnits: true })
            .filter("ColorMatrix", { saturate:1 })
        
        .effect()
            .copySprite(target)
            .attachTo(target, {bindAlpha:false, bindRotation:false,local:false})
            .scaleToObject(1)
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", delay:100, gridUnits: true })
            .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.5, duration: 250, ease: "easeOutCubic", delay:600, gridUnits: true })
            .animateProperty("sprite", "rotation", { from: 0, to: 90, duration: 250, ease: "easeOutCubic", delay:100 })  
            .duration(1200)
            .waitUntilFinished(-500)

        .effect()
            .file(closest("eskie.smoke.03.tan"))
            .attachTo(target,{bindAlpha:false,bindRotation:false})
            .scaleToObject(2)
            .opacity(0.8)
            .belowTokens()

        .animation()
            .delay(300)
            .on(target)
            .opacity(1)
            .rotate(target.document.rotation+90)
    return seq;
}

function chargeCreate(token, config = {}) {
    const { id, color } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = matt.getLabel(id, token);

    const sequenceOn = new Sequence()
      .effect()
        .file(closest("eskie.smoke.03.tan"))
        .attachTo(token,{bindAlpha:false,bindRotation:false})
        .scaleToObject(2)
        .opacity(0.6)
        .belowTokens()
      
      .effect()
        .name(label)
        .file(closest(`eskie.nature.flower.particle.01.${color}`))
        .attachTo(token)
        .scaleToObject(1.5)
        .fadeIn(1000)
        .fadeOut(250)
        .persist()
        .zIndex(1)
        .waitUntilFinished();

    return sequenceOn;
}

async function chargePlay(token, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const effectFunction = `eskie.effect.totemicAttunement.elk.charge.macro.movement`;
    const code = `${effectFunction}(token.object, tile)`;
    await matt.movement.initialize(token, code, mergedConfig);    
    const sequence = chargeCreate(token, config);
    if (sequence) return sequence.play();
}

async function chargeStop(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = matt.getLabel(id, token);
    const tiles = Tagger.getByTag(label);

    tiles.forEach(async (tile) => { await socket.tile.destroy(tile.id); });
    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

async function chargeMovement(token, tile, config = {}) {
    function travelSequence(config = {}) {
        const { rotation, travelTime, label } = config;
        const particleRepeats = travelTime / 100;
        
        //Play MATT Sequence
        const SequenceMATT = new Sequence()
            .effect()
                .name(label)
                .file(closest("eskie.smoke.03.tan"))
                .atLocation(token, { randomOffset:0.25, gridUnits:true})
                .scaleToObject(1,{considerTokenScale: true})
                .opacity(0.6)
                .belowTokens()
                .randomRotation()
                .repeats(particleRepeats, 100, 100)
                .playbackRate(1.35)
                .zIndex(1)

            .effect()
                .delay(50)
                .name(label)
                .file(closest("eskie.smoke.03.tan"))
                .atLocation(token, {randomOffset:0.75, gridUnits:true})
                .scaleToObject(0.8, {considerTokenScale: true})
                .opacity(0.6)
                .belowTokens()
                .randomRotation()
                .repeats(Math.round(Math.max((travelTime-50)/100, 0)), 100, 100)
                .playbackRate(1.35)
                .zIndex(1)

            .effect()
                .delay(50)
                .name(label)
                .file(closest("eskie.sound.roar.02"))
                .attachTo(token)
                .scaleToObject(3)
                .randomRotation()
                .belowTokens()
                .repeats(Math.round(Math.max((travelTime-50)/400 - 1, 0)), 400, 400)
                .zIndex(1.1)

        .wait(travelTime)
        
        .thenDo(async () => {
            Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
        });
        
        return SequenceMATT;
    }

    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {rotation, travelTime, label} = await matt.movement.configuration(token, tile, mergedConfig);
    return travelSequence({tile, rotation, travelTime, label}).play();
}

export const elkAttunement = {
    prone: {
        create: proneCreate,
        play: pronePlay,
    },
    charge: {
        create: chargeCreate,
        play: chargePlay,
        stop: chargeStop,
        macro: {
            movement: chargeMovement,
        },
    }
};