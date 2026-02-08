import { detectUtil } from './detectUtil.js'

const defaultDetectionConfig = {
    aberration: 'jb2a.condition.curse.01.006.blue',
    celestial: 'jb2a.condition.curse.01.002.blue',
    elemental: 'jb2a.condition.curse.01.001.red',
    fey: 'jb2a.condition.curse.01.020.purple',
    fiend: 'jb2a.condition.curse.01.024.red',
    undead : 'jb2a.condition.curse.01.021.purple',
    consecrated : 'jb2a.magic_signs.rune.02.complete.04.yellow',
    descecrated : 'jb2a.magic_signs.rune.02.complete.04.grey',
};

const defaultValidator = async function (target, tags) {
    const targetRace = target?.actor.system.details.type.value;
    return (targetRace && tags.includes(targetRace)) || Tagger?.hasTags(target, tags);
}

const DEFAULT_CONFIG = {
    distance: 30,
    effect: {
        pulse: {
            img: 'jb2a.detect_magic.circle.grey',
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

export const goodevil = {
    create,
    play,
};