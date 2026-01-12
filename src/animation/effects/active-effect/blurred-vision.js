import { utils } from "../../utils/utils.js"
import { blur } from "../../scene-overlays/status-blur.js";
import { autoanimations } from "../../../integration/autoanimations.js";

/* **
   Originally Published: 1/12/2023
   Author: bakanabaka
** */

const DEFAULT_CONFIG = {
    id: 'blurred-vision',
    overlay: {
        applyPC: true,
        applyGM: false,
    },
    configs: [
        { id: 'blurred-vision', opacity: 1, blur: 3, sway: 1, durationX: 6500, durationY: 11000 },
        { id: 'blurred-vision', opacity: 0.57, blur: 3, sway: -0.9, durationX: 16500, durationY: 7000 },
        { id: 'blurred-vision', opacity: 0.47, blur: 3, sway: 1.1, durationX: 13000, durationY: 10500 },
    ]
}

function create(token, config = {}) {
    const { overlay, configs } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace: false});
    const seq = new Sequence();
    const owners = utils.owners(token, { applyPC: overlay.applyPC, applyGM: overlay.applyGM });

    for (const effectConfig of configs) {
        seq.addSequence(blur.create(owners, effectConfig));
    }

    return seq;
}

async function play(token, config = {}) {
    const seq = create(token, config);
    return seq?.play();
}

async function stop(token, config = {}) {
    const { id, overlay, configs } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace: false});
    const owners = utils.owners(token, { applyPC: overlay.applyPC, applyGM: overlay.applyGM });
    return Promise.all(configs.map( c => blur.stop(owners, c) ));
}

export const blurredVision = {
    create,
    play,
    stop,
};

autoanimations.register("Blurred Vision", "effect", "eskie.effect.blurredVision", DEFAULT_CONFIG);
