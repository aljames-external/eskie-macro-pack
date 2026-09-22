
// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { matt } from '../../utils/matt-tiles.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';

export const DEFAULT_CONFIG = {
    id: 'Grapple Latch',
    follow: true,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

function create(token: Token, target: Token, config: Record<string, any> = {}) {
    config = settingsOverride(config);
    const { id, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const label = `${id} - ${token.id}`;

    let sequenceOn = new Sequence();
    applySound(sequenceOn, sound);
    sequenceOn = sequenceOn
        .effect()
            .name(label)
            .file(closest("eskie.objects.biological.hand.spectral_hand.ranged.01.generic.latch.blue.05ft"))
            .attachTo(token)
            .stretchTo(target, {attachTo: true, offset: {x: 0.5}, gridUnits: true, local: true})
            .spriteOffset({x: -0.1}, { gridUnits: true })
            .spriteScale(3)
            .persist()
            .timeRange(1000, 1500)
            .filter("ColorMatrix", {hue: 75})
        .effect()
            .file(closest("eskie.smoke.03.tan"))
            .attachTo(target, {bindAlpha:false, bindRotation:false})
            .scaleToObject(1.75, {considerTokenScale: true})
            .belowTokens()
            .opacity(0.6)
            .waitUntilFinished();
    
    return sequenceOn;
}

async function play(token: Token, target: Token, config: Record<string, any> = {}) {
    const targetuuid = target.document.uuid;
    const mergedConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const effectFunction = `eskie.effect.grapple.macro.movement`;
    const code = `${effectFunction}(token.object, "${targetuuid}", tile)`;
    await matt.movement.start(token, code, mergedConfig);
    const sequence = create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token: Token, target?: Token, config: Record<string, any> = {}) {
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const label = matt.getLabel(id, token);
    await matt.movement.stop(token, label);
    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

async function movement(token: Token, targetuuid: string, tile: Tile, config: Record<string, any> = {}) {
    const targetDoc = await adapter.fromUuid(targetuuid);
    const target = targetDoc?.object;
    if (!target) return;
    function travelSequence(config: Record<string, any> = {}) {
        const {rotation, travelTime, label, delta: {x: dx, y: dy}} = config;
        const repetitions = Math.floor(travelTime / 100);
        
        let SequenceMATT = new Sequence();
    
        if (config.follow) {
            SequenceMATT.motion(target)
                .moveTo({ x: target.x - dx, y: target.y - dy })
                .duration(travelTime);
        }
            
        SequenceMATT = SequenceMATT
            .effect()
                .name(label)
                .file(closest("eskie.smoke.03.tan"))
                .atLocation(target, { randomOffset: 0.25, gridUnits:true})
                .scaleToObject(1, {considerTokenScale: true})
                .opacity(0.6)
                .belowTokens()
                .randomRotation()
                .repeats(repetitions, 100, 100)
                .playbackRate(1.35)
                .zIndex(1)

            .effect()
                .delay(50)
                .name(label)
                .file(closest("eskie.smoke.03.tan"))
                .atLocation(target, {randomOffset: 0.75, gridUnits:true})
                .scaleToObject(0.8, {considerTokenScale: true})
                .opacity(0.6)
                .belowTokens()
                .randomRotation()
                .repeats(repetitions, 100, 100)
                .playbackRate(1.35)
                .zIndex(1)

            .effect()
                .delay(50)
                .name(label)
                .file(closest("eskie.sound.roar.02"))
                .attachTo(target)
                .scaleToObject(2)
                .randomRotation()
                .belowTokens()
                .repeats(repetitions/4-1, 200, 200)
                .zIndex(1.1)


        .wait(Math.max(travelTime - 250, 250))

        .thenDo(async () => {
            Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
        });
        
        return SequenceMATT;
    }

    const mergedConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const {rotation, travelTime, label, delta: {x: dx, y: dy}} = await matt.movement.configure(token, tile, mergedConfig);
    return travelSequence({tile, rotation, travelTime, label, delta: {x: dx, y: dy}, follow: mergedConfig.follow}).play();
}

export const grapple = {
    create,
    play,
    stop,
    macro: {
        movement,
    },
    default_config: DEFAULT_CONFIG,
};