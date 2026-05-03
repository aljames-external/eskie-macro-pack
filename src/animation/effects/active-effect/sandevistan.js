// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { time } from "../../../lib/time.js";
import { matt } from '../../utils/matt-tiles.js';
import { closest } from '../../../lib/filemanager.js';
import { socket } from '../../../integration/socketlib.js';
import { autoanimations } from '../../../integration/autoanimations.js';
import { MODULE_ID } from "../../../lib/constants.js";

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        let hex = Math.round(255 * color).toString(16);
        if (hex.length < 2) {
            hex = '0' + hex;
        }
        return hex;
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export const DEFAULT_CONFIG = {
    id: 'Sandevistan',
    msPerImage: 50,
    imageDuration: 2500,
};

function create(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = matt.getLabel(id, token);

    const sequence = new Sequence();
    sequence.thenDo(async () => {
    if (typeof FXMASTER !== 'undefined')
        await FXMASTER.filters.switch("SandyfilterID", "color", {
            color: { value: "#76feb1", apply: true },
            saturation: 0.9,
            contrast: 1.3,
            brightness: 1.1,
            gamma: 0.9,
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
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const effectFunction = `eskie.effect.sandevistan.macro.movement`;
    const code = `${effectFunction}(token.object, tile)`;
    await matt.movement.initialize(token, code, mergedConfig);
    const sequence = create(token, config);
    if (sequence) return sequence.play();
}

async function stop(token, config = {}) {
    const { id, imageDuration } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = matt.getLabel(id, token);
    const tiles = Tagger.getByTag(label);

    const endSequence = new Sequence();
    endSequence.thenDo(async () => {
        Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
        if (imageDuration <= 0) {
            function imagesRemoved() { return  Sequencer.EffectManager.getEffects({ name: `${label} - Trail` }).length === 0; }
            await time.waitUntil(imagesRemoved, {timeout: 5000});
        }
        tiles.forEach(async (tile) => socket.tile.destroy(tile.id));
        Sequencer.EffectManager.endEffects({ name: label, object: token });
        if (typeof FXMASTER !== 'undefined')
            FXMASTER.filters.switch("SandyfilterID", "color", {
                color: { value: "#ffffff", apply: false },
            });
    });
    await endSequence.play();
}

async function travelSequence(token, tile, config = {}, options = {}) {
    const { travelTime, label } = options;
    const { msPerImage, imageDuration, hueIteration } = config;
    const priorIterations = hueIteration ?? 0;

    let seq = new Sequence();
    const repeats = Math.floor(travelTime / msPerImage);

    for (let i = 0; i < repeats; i++) {
        const hue = (15.5 * (i + priorIterations)) % 360;
        const color = hslToHex(hue, 100, 50);

        seq = seq.effect()
            .atLocation(token)
            .name(`${label} - Trail`);
        if (imageDuration > 0) seq = seq.duration(imageDuration);
        else seq = seq.persist();
        seq = seq.delay(msPerImage * i)
            .copySprite(token)
            .scaleToObject(1, { considerTokenScale: true })
            .belowTokens()
            .opacity(1)
            .tint(color)
            .extraEndDuration(500)
            .zIndex(0);
    }

    config.hueIteration = priorIterations + repeats;
    await tile.setFlag(MODULE_ID, 'config', config);

    return seq;
}

async function movement(token, tile) {
    const config = tile.getFlag(MODULE_ID, 'config') ?? {};
    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { travelTime, label } = await matt.movement.configuration(token, tile, mergedConfig);
    const travelSeq = await travelSequence(token, tile, mergedConfig, { travelTime, label });
    return travelSeq.play();
}


export const sandevistan = {
    create,
    play,
    stop,
    macro: {
        movement,
    },
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Sandevistan", "effect", "eskie.effect.sandevistan", DEFAULT_CONFIG);
