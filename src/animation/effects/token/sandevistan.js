// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { dependency } from "../../../lib/dependency.js";
import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'Sandevistan',
};

async function create(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    dependency.required({ id: "fxmaster", ref: "Gambit's FXMaster" });

    const sequence = new Sequence();
    await FXMASTER.filters.switch("SandyfilterID", "color", {
        color: { value: "#76feb1", apply: true },
        gamma: 1.0,
        contrast: 0.9,
        brightness: 1.0,
        saturation: 0.2,
        skipFading: true,
    });

    sequence.wait(1000);

    sequence.effect()
        .atLocation(token)
        .name("Sandevistan")
        .persist()
        .copySprite(token)
        .aboveLighting()
        .attachTo(token)
        .extraEndDuration(2000)
        .zIndex(1);

    sequence.effect()
        .atLocation(token)
        .file(closest("jb2a.token_stage.round.green.02.02"))
        .scaleToObject(1.2)
        .filter("ColorMatrix", { hue: 50 })
        .playbackRate(2)
        .duration(3000)
        .attachTo(token)
        .aboveLighting()
        .zIndex(2);

    sequence.effect()
        .delay(250)
        .atLocation(token)
        .file(closest("jb2a.token_stage.round.green.02.02"))
        .scaleToObject(1.2)
        .filter("ColorMatrix", { hue: 25 })
        .filter("Blur", { blurX: 30, blurY: 0 })
        .aboveLighting()
        .attachTo(token)
        .duration(2750)
        .playbackRate(2)
        .zIndex(1);

    await sequence.play();
    await Sequencer.Helpers.wait(500);

    const afterImageSequence = new Sequence();

    for (let i = 0; i < 500; i++) {
        afterImageSequence.effect()
            .atLocation(token)
            .name("Sandevistan")
            .persist()
            .delay(300)
            .copySprite(token)
            .belowTokens()
            .opacity(1)
            .tint("#30FF58")
            .extraEndDuration(5 * i)
            .filter("ColorMatrix", { hue: 1.5 * i })
            .zIndex(0);
    }
    return afterImageSequence;
}

async function play(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    const sequence = await create(token);
    if (sequence) { return sequence.play(); }
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    const endSequence = new Sequence();
    endSequence.effect()
        .atLocation(token)
        .file(closest("jb2a.token_stage.round.green.02.02"))
        .scaleToObject(1.2)
        .filter("ColorMatrix", { hue: 50 })
        .playbackRate(2)
        .attachTo(token)
        .duration(3000)
        .aboveLighting()
        .zIndex(2);

    endSequence.effect()
        .delay(250)
        .atLocation(token)
        .file(closest("jb2a.token_stage.round.green.02.02"))
        .scaleToObject(1.2)
        .filter("ColorMatrix", { hue: 25 })
        .filter("Blur", { blurX: 30, blurY: 0 })
        .aboveLighting()
        .attachTo(token)
        .duration(2750)
        .playbackRate(2)
        .zIndex(1);

    endSequence.thenDo(() => {
        Sequencer.EffectManager.endEffects({ name: id });
        FXMASTER.filters.switch("SandyfilterID", "color", {
            color: { value: "#76feb1", apply: true },
            gamma: 1.0,
            contrast: 0.9,
            brightness: 1.0,
            saturation: 0.2,
            skipFading: true,
        });
    });
    await endSequence.play();
}

export const sandevistan = {
    create,
    play,
    stop,
};
