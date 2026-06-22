import { autoanimations } from '../../../integration/autoanimations.js';
import { socket } from '../../../integration/socketlib.js';
import { closest } from '../../../lib/filemanager.js'
import { matt } from '../../utils/matt-tiles.js';

export const DEFAULT_CONFIG = {
    id: 'Grapple Latch',
    follow: true,
};

function create(token, target, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} - ${token.id}`;

    const sequenceOn = new Sequence()
        .effect()
            .name(label)
            .file("modules/eskie-effects/assets/Objects/Biological/Hand/Spectral_Hand/Ranged/01/Objects_Biological_Hand_Spectral_Hand_Ranged_01_Generic_Latch_Blue_05ft.webm")
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
            .waitUntilFinished()
    
    return sequenceOn;
}

async function play(token, target, config = {}) {
    const targetuuid = target.document.uuid;
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const effectFunction = `eskie.effect.grapple.macro.movement`;
    const code = `${effectFunction}(token.object, "${targetuuid}", tile)`;
    await matt.movement.start(token, code, mergedConfig);
    const sequence = create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token, target, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = matt.getLabel(id, token);
    await matt.movement.stop(token, label);
    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

async function movement(token, targetuuid, tile, config = {}) {
    const targetDoc = await fromUuid(targetuuid);
    const target = targetDoc.object;
    function travelSequence(config = {}) {
        const {rotation, travelTime, label, delta: {x: dx, y: dy}} = config;
        const repetitions = Math.floor(travelTime / 100);
        
        let SequenceMATT = new Sequence();
    
        if (config.follow) {
            SequenceMATT = SequenceMATT
                .animation()
                    .on(target)
                    .moveTowards({x: target.x - dx, y: target.y - dy})
                    .duration(travelTime)
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

    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {rotation, travelTime, label, delta: {x: dx, y: dy}} = await matt.movement.configure(token, tile, mergedConfig);
    return travelSequence({tile, rotation, travelTime, label, delta: {x: dx, y: dy}, follow: config.follow}).play();
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