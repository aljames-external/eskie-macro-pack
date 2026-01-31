import { autoanimations } from "../../../../integration/autoanimations.js";

import { rageV1 as v1, DEFAULT_CONFIG as config_v1} from "./rage_v1.js";
import { electric as v2, DEFAULT_CONFIG as config_v2} from "./rage-electric.js";
import { superSaiyan as v3, DEFAULT_CONFIG as config_v3} from "./rage-super-saiyan.js";
import { rageV2 as v4, DEFAULT_CONFIG as config_v4} from "./rage_v2.js";
import { rageTotem as v5, DEFAULT_CONFIG as config_v5} from "./rage_totem.js";

const DEFAULT_CONFIG = {
    version: 4,
    config_v1,
    config_v2,
    config_v3,
    config_v4,
    config_v5,
};

function getVersion(config = {}) {
    const { version } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    // Merge the DEFAULT_CONFIG with our possibly modified input config
    const map = [ 
        {fn: v1, cfg: foundry.utils.mergeObject(config_v1, config.config_v1 ?? {}, {inplace:false})},
        {fn: v2, cfg: foundry.utils.mergeObject(config_v2, config.config_v2 ?? {}, {inplace:false})},
        {fn: v3, cfg: foundry.utils.mergeObject(config_v3, config.config_v3 ?? {}, {inplace:false})},
        {fn: v4, cfg: foundry.utils.mergeObject(config_v4, config.config_v4 ?? {}, {inplace:false})},
        {fn: v5, cfg: foundry.utils.mergeObject(config_v5, config.config_v5 ?? {}, {inplace:false})},
    ];
    
    if ( version > map.length || version <= 0 ) return;
    return map[version - 1];
}

function create(token, config = {}) {
    const version = getVersion(config);
    if (!version) return;
    return version.fn.create(token, version.cfg);
}

async function play(token, config = {}) {
    const version = getVersion(config);
    if (!version) return;
    return version.fn.play(token, version.cfg);
}

async function stop(token, config = {}) {
    const version = getVersion(config);
    if (!version) return;
    return version.fn.stop(token, version.cfg);
}

async function clean(token, config = {}) {
    const version = getVersion(config);
    if (!version) return;
    return version.fn.clean(token, version.cfg);
}

export const rage = {
    create,
    play,
    stop,
    clean,

    v1,
    v2,
    v3,
    v4,
    v5,
};

autoanimations.register("Rage", "effect", "eskie.effect.rage", DEFAULT_CONFIG, '1.0.0');