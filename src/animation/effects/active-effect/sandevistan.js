// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { time } from "../../../lib/time.js";
import { matt } from '../../utils/matt-tiles.js';
import { closest } from '../../../lib/filemanager.js';
import { dependency } from "../../../lib/dependency.js";
import { socket } from '../../../integration/socketlib.js';
import { autoanimations } from '../../../integration/autoanimations.js';
import { MODULE_ID } from "../../../lib/constants.js";

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
    const { id, imageDuration } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = matt.getLabel(id, token);
    const tiles = Tagger.getByTag(label);

    const endSequence = new Sequence();
    endSequence.thenDo(async () => {
        Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
        if (imageDuration <= 0) {
            function imagesRemoved() { return  Sequencer.EffectManager.getEffects({ name: `${label} - Trail` }).length === 0; }
            await time.waitUntil(imagesRemoved, {timeout: 5000});
        }
        tiles.forEach(async (tile) => { await socket.tile.destroy(tile.id); });
        Sequencer.EffectManager.endEffects({ name: label, object: token });
        FXMASTER.filters.switch("SandyfilterID", "color", {
            color: { value: "#76feb1", apply: false },
        });
    });
    await endSequence.play();
}

async function movement(token, tile) {
    const config = tile.getFlag(MODULE_ID, 'config') ?? {};
    function travelSequence(config = {}) {
        const { travelTime, label, msPerImage, imageDuration } = config;
        const priorIterations = config.i ?? 0;

        let seq = new Sequence();
        const repeats = Math.floor(travelTime / msPerImage);
        config.i = priorIterations + repeats;
        /* await */ tile.setFlag(MODULE_ID, 'config', config);

        for (let i = 0; i < repeats; i++) {
            seq = seq.effect()
                .atLocation(token)
                .name(`${label} - Trail`);
            if (imageDuration > 0) seq = seq.duration(imageDuration);
            else seq = seq.persist();
            seq = seq.delay(msPerImage * i)
                .copySprite(token)
                .belowTokens()
                .opacity(1)
                .tint("#30FF58")
                .extraEndDuration(500)
                .filter("ColorMatrix", { hue: 1.5 * (i + priorIterations) })
                .zIndex(0);
        }
        return seq;
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
