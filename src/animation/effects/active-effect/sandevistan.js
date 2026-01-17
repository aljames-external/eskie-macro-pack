// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { autoanimations } from '../../../integration/autoanimations.js';
import { socket } from '../../../integration/socketlib.js';
import { closest } from '../../../lib/filemanager.js'
import { matt } from '../../utils/matt-tiles.js';
import { dependency } from "../../../lib/dependency.js";

export const DEFAULT_CONFIG = {
    id: 'Sandevistan',
    msPerImage: 50,
    imageDuration: 2500,
};

function create(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = matt.getLabel(id, token);
    dependency.required({ id: "fxmaster", ref: "Gambit's FXMaster" });

    const sequence = new Sequence();
    sequence.thenDo(async () => {
        await FXMASTER.filters.switch("SandyfilterID", "color", {
            color: { value: "#76feb1", apply: true },
            gamma: 1.0,
            contrast: 0.9,
            brightness: 1.0,
            saturation: 0.2,
            skipFading: true,
        });
    });

    sequence.wait(1000);

    sequence.effect()
        .name(label)
        .atLocation(token)
        .file(closest("jb2a.token_stage.round.green.02.02"))
        .scaleToObject(1.2)
        .filter("ColorMatrix", { hue: 50 })
        .playbackRate(2)
        .duration(3000)
        .attachTo(token)
        .aboveLighting()
        .persist()
        .zIndex(2);

    sequence.effect()
        .delay(250)
        .name(label)
        .atLocation(token)
        .file(closest("jb2a.token_stage.round.green.02.02"))
        .scaleToObject(1.2)
        .filter("ColorMatrix", { hue: 25 })
        .filter("Blur", { blurX: 30, blurY: 0 })
        .aboveLighting()
        .attachTo(token)
        .duration(2750)
        .playbackRate(2)
        .persist()
        .zIndex(1);

    return sequence;
}

async function play(token, config = {}) {
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const effectFunction = `eskie.effect.sandevistan.macro.movement`;
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

    const endSequence = new Sequence();
    endSequence.thenDo(() => {
        Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
        FXMASTER.filters.switch("SandyfilterID", "color", {
            color: { value: "#76feb1", apply: false },
        });
    });
    await endSequence.play();
}

async function movement(token, tile, config = {}) {
    function travelSequence(config = {}) {
        const { travelTime, label, msPerImage, imageDuration } = config;

        const afterImageSequence = new Sequence();
        const repeats = Math.floor(travelTime / msPerImage);

        for (let i = 0; i < repeats; i++) {
            afterImageSequence.effect()
                .atLocation(token)
                .name(`${label} - Trail`)
                .duration(imageDuration)
                .delay(msPerImage * i)
                .copySprite(token)
                .belowTokens()
                .opacity(1)
                .tint("#30FF58")
                .extraEndDuration(500)
                .filter("ColorMatrix", { hue: 1.5 * i })
                .zIndex(0);
        }
        return afterImageSequence;
    }

    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { imageDuration, msPerImage } = mergedConfig;
    const { travelTime, label } = await matt.movement.configuration(token, tile, mergedConfig);
    return travelSequence({ travelTime, label, msPerImage, imageDuration }).play();
}


export const sandevistan = {
    create,
    play,
    stop,
    macro: {
        movement
    },
};

autoanimations.register("Sandevistan", "effect", "eskie.effect.sandevistan", DEFAULT_CONFIG);
