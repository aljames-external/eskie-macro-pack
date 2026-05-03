import { detectUtil } from './detectUtil.js'

const defaultDetectionConfig = {
    celestial: 'jb2a.condition.curse.01.002.blue',
    fiend: 'jb2a.condition.curse.01.024.red',
    undead : 'jb2a.condition.curse.01.021.purple',
};

const defaultValidator = async function (target, tags) {
    const targetRace = target?.actor.system.details.type.value;
    return (targetRace && tags.includes(targetRace)) || Tagger?.hasTags(target, tags);
}

const DEFAULT_CONFIG = {
    distance: 60,
    effect: {
        pulse: {
            img: 'jb2a.detect_magic.circle.yellow',
        },
    },
    detection: defaultDetectionConfig,
    validator: defaultValidator,
}

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    return detectUtil.create(token, mConfig);
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

export const divineSense = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};