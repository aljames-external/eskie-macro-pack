import { autoanimations } from '../../../integration/autoanimations.js';
import { socket } from '../../../integration/socketlib.js';
import { closest } from '../../../lib/filemanager.js'
import { matt } from '../../utils/matt-tiles.js';

export const DEFAULT_CONFIG = {
    id: 'Cunning Action'
};

function create(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} - ${token.id}`;

    const sequenceOn = new Sequence()
        .effect()
            .name(label)
            .file(closest("eskie.smoke.03.black"))
            .attachTo(token)
            .scaleToObject(2)
            .belowTokens()
            .opacity(0.5)
            .tint("#696969")
        .effect()
            .name(label)
            .file(closest("eskie.buff.one_shot.simple.blue"))
            .attachTo(token)
            .scaleToObject(1)
            .filter("ColorMatrix", { saturate: -1, brightness: 2 })
            .opacity(1)
        .wait(200)
        .effect()
            .name(label)
            .file(closest("jb2a.wind_stream.200.white"))
            .attachTo(token)
            .scaleToObject(1.15, { considerTokenScale: true })
            .fadeIn(500)
            .fadeOut(500)
            .mask()
            .playbackRate(1.5)
            .rotate(90)
            .persist()
            .opacity(0.5)
            .waitUntilFinished();
    
    return sequenceOn;
}

async function play(token, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const effectFunction = `eskie.effect.dash.macro.movement`;
    const code = `${effectFunction}(token.object, tile)`;
    await matt.movement.initialize(token, code, mergedConfig);    
    const sequence = create(token, config);
    return sequence?.play();
}

async function stop(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = matt.getLabel(id, token);
    const tiles = Tagger.getByTag(label);

    tiles.forEach(async (tile) => { await socket.tile.destroy(tile.id); });
    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

async function movement(token, tile, config = {}) {
    function travelSequence(config = {}) {
        const { rotation, travelTime, label } = config;
        
        const SequenceMATT = new Sequence()
        .effect()
            .file(closest("eskie.smoke.01.black"))
            .atLocation(token)
            .spriteRotation(rotation)
            .scaleToObject(1.75, {considerTokenScale: true})
            .belowTokens()
            .opacity(0.5)
            .tint("#696969")

        .effect()
            .file(closest("eskie.particle.04.white"))
            .atLocation(token)
            .spriteRotation(rotation)
            .scaleToObject(1.35, {considerTokenScale: true})
            .playbackRate(1.5)
            .zIndex(1)
            .playIf(travelTime > 250)

        .effect()
            .name(`${label} - Trail`)
            .file(closest("eskie.trail.token.generic.02.black"))
            .attachTo(token)
            .rotateTowards(tile, {attachTo: false})
            .scaleToObject(1.5, {considerTokenScale: true})
            .spriteOffset({x: -(1.5 * token.document.width)}, {gridUnits:true})
            .opacity(1)
            .persist()
            .timeRange(250, 750)
            .fadeOut(500, {ease:"easeOutQuint"})
            .filter("ColorMatrix", {saturate:3})
            .playIf(travelTime > 250)

        .wait(Math.max(travelTime - 250, 250))

        .thenDo(async () => {
            Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
        });
        
        return SequenceMATT;
    }

    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {rotation, travelTime, label} = await matt.movement.configuration(token, tile, mergedConfig);
    return travelSequence({tile, rotation, travelTime, label}).play();
}


export const dash = {
    create,
    play,
    stop,
    macro: {
        movement
    },
};

autoanimations.register("Dash", "effect", "eskie.effect.dash", DEFAULT_CONFIG);