//Last Updated: 1/27/2025
//Author: .eskie

import { closest } from "../../../../../lib/filemanager.js";
import { matt } from "../../../../utils/matt-tiles.js";

import { adapter } from "../../../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'Elk Totemic Attunement',
    color: 'red',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function pronePlay(token: Token, target: Token, config: any = {}) {
    const seq = await proneCreate(token, target, config);
    if (seq) { await seq.play(); }
}

function proneCreate(token: Token, target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, sound } = mConfig;
    const label = `${id} - ${token.id}`;

    const targetRotation = adapter.getTokenRotation(target);
    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const gridSize = adapter.getGridSize();

    const pushDistance = 10;
    const dx = targetCenter.x - tokenCenter.x;
    const dy = targetCenter.y - tokenCenter.y;
    const dist = Math.hypot(dx, dy) || 1;

    const pushOffset = {
        x: (dx / dist) * (gridSize * (pushDistance / 5)),
        y: (dy / dist) * (gridSize * (pushDistance / 5)),
    };

    const seq = new Sequence();
    applySound(seq, sound);
    seq
        .effect()
            .delay(100)
            .file(closest(`eskie.damage.bludgeoning.01.${color}`))
            .attachTo(target, { bindAlpha: false, bindRotation: false })
            .scaleToObject(1.5)
            .opacity(1)
            .zIndex(1)
            .belowTokens()
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.5, duration: 500, ease: 'easeOutCubic', gridUnits: true })
            .filter('ColorMatrix', { saturate: 1 })

        .motion(target)
            .rotateTo(targetRotation + 90, { duration: 300 })
            .moveBy(pushOffset, { duration: 500, ease: 'easeOutCubic' })

        .effect()
            .file(closest('eskie.smoke.03.tan'))
            .attachTo(target, { bindAlpha: false, bindRotation: false })
            .scaleToObject(2)
            .opacity(0.8)
            .belowTokens();

    return seq;
}

function chargeCreate(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, sound } = mConfig;
    const label = matt.getLabel(id, token);

    const sequenceOn = new Sequence();
    applySound(sequenceOn, sound);
    sequenceOn
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

async function chargePlay(token: Token, config: any = {}) {
    const mergedConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const effectFunction = `eskie.effect.totemicAttunement.elk.charge.macro.movement`;
    const code = `${effectFunction}(token.object, tile)`;
    await matt.movement.start(token, code, mergedConfig);
    const sequence = chargeCreate(token, config);
    if (sequence) return sequence.play();
}

async function chargeStop(token: Token, config: any = {}) {
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const label = matt.getLabel(id, token);
    await matt.movement.stop(token, label);
    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

async function chargeMovement(token: Token, tile: Tile, config: any = {}) {
    function travelSequence(config: any = {}) {
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

    const mergedConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const {rotation, travelTime, label} = await matt.movement.configure(token, tile, mergedConfig);
    return travelSequence({tile, rotation, travelTime, label}).play();
}

export const elkAttunement = {
    play: chargePlay,
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
    },
    default_config: DEFAULT_CONFIG,
};