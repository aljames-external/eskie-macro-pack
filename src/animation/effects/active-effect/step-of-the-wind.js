// Author: .eskie
// Modular Conversion: bakanabaka

import { img, snd } from '../../../lib/filemanager.js'
import { socket } from '../../../integration/socketlib.js';
import { autoanimations } from '../../../integration/autoanimations.js';
import { tiles } from '../../utils/tiles.js';

export const DEFAULT_CONFIG = {
    id: 'step-of-the-wind'
};

function create(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = tiles.getLabel(id, token);

    const sequenceOn = new Sequence()

    .effect()
        .name(label)
        .file(img("eskie.smoke.03.white"))
        .attachTo(token)
        .scaleToObject(2)
        .belowTokens()
        .opacity(0.8)

    .effect()
        .name(label)
        .file(img("eskie.buff.one_shot.simple.blue"))
        .attachTo(token)
        .scaleToObject(1)
        .filter("ColorMatrix", { saturate:-1, brightness:2 })
        .opacity(1)

    .wait(200)

    .effect()
        .name(label)
        .file(img("jb2a.wind_stream.200.white"))
        .attachTo(token)
        .scaleToObject(1.15, {considerTokenScale:true})
        .fadeIn(500)
        .fadeOut(500)
        .mask()
        .playbackRate(1.5)
        .rotate(90)
        .persist()
        .opacity(0.5)

    .effect()
        .name(label)
        .file(img("eskie.nature.flower.particle.01.blue"))
        .attachTo(token)
        .scaleToObject(1.5)
        .playbackRate(2)
        .fadeIn(1000)
        .fadeOut(250)
        .persist()
        .rotate(-45)
        .zIndex(1)
        .waitUntilFinished();

    return sequenceOn;
}

async function play(token, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    await tiles.initialize(token, mergedConfig);    
    const sequence = create(token, config);
    return sequence?.play();
}

async function stop(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = tiles.getLabel(id, token);
    const taggerTiles = Tagger.getByTag(label);

    taggerTiles.forEach(async (tile) => { await socket.tile.destroy(tile.id); });
    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

async function movement(token, tile, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    function travelSequence(config = {}) {
        const { tile, rotation, travelTime, label } = config;
        const particleRepeats = travelTime / 250;
        const tilePosition = tiles.getCenter(tile);
        
        //Play MATT Sequence
        const SequenceMATT = new Sequence()
        .effect()
            .file(img("eskie.nature.flower.particle.01.blue"))
            .atLocation(token)
            .spriteRotation(rotation+135)
            .scaleToObject(1.5)
            .playbackRate(2)
            .duration(1500)
            .fadeOut(500)
            .repeats(particleRepeats, 250, 250)

        .effect()
            .file(img("eskie.smoke.01.white"))
            .atLocation(token)
            .spriteRotation(rotation)
            .scaleToObject(1.75,{considerTokenScale: true})
            .belowTokens()

        .effect()
            .name(`${label} - Trail`)
            .file(img("eskie.trail.token.generic.01.white"))
            .attachTo(token)
            .rotateTowards(tile, {attachTo: false})
            .scaleToObject(1.5, {considerTokenScale: true})
            .spriteOffset({x:-0.75-0.75},{gridUnits:true})
            .opacity(1)
            .persist()
            .timeRange(250, 750)
            .fadeOut(500, {ease:"easeOutQuint"})
            .filter("ColorMatrix", { saturate:3})
            .playIf(travelTime >= 500)

        .effect()
            .file(img("eskie.trail.token.generic.01.white"))
            .attachTo(token)
            .rotateTowards(tilePosition)
            .scaleToObject(1.5, {considerTokenScale: true})
            .spriteOffset({x:-0.75-0.75},{gridUnits:true})
            .opacity(1)
            .filter("ColorMatrix", { saturate:3})
            .startTime(750)
            .playIf(travelTime < 500)   

        .animation()
            .delay(travelTime + 1000)
            .on(tile)
            .teleportTo(tilePosition, {relativeToCenter: true})

        .wait(Math.max(travelTime - 250, 250))
        
        .thenDo(async () => {
            Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
        });
        
        return SequenceMATT;
    }

    return tiles.movement(token, tile, travelSequence, {id});
}


export const stepOfTheWindMove = {
    create,
    play,
    stop,
    macro: {
        movement
    },
};

autoanimations.register("Step of the Wind", "effect", "eskie.effect.stepOfTheWind.move", DEFAULT_CONFIG);
