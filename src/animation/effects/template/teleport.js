// Original Author: Unknown (from discord)
// Modular Conversion: bakanabaka

import { templates } from '../../../lib/templates.js';
import { teleportIn } from "./teleport/teleportIn.js";
import { teleportOut } from "./teleport/teleportOut.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'Teleportation',
};

async function create(token, config = {}) {
    const { id, template, targets } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    const cfg = { 
        radius: 1,
        max: 500,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: 'Teleportation Destination',
    };
    [config.position, _] = await templates.getPosition(template, cfg);
    if (!config.position) { return; }

    let [tOut, tIn] = await Promise.all([
        teleportOut.create(token, targets, config),
        teleportIn.create(token, targets, config),
    ]);

    return new Sequence()
        .addSequence(tOut)
        .addSequence(tIn);
}

async function play(token, config = {}) {
    let seq = await create(token, config);
    if (seq) return seq.play();
}

export const teleport = {
    play,
    create,
    in: teleportIn,
    out: teleportOut,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Teleport", "template", "eskie.effect.teleport", DEFAULT_CONFIG);