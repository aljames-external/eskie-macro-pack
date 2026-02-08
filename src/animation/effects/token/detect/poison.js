import { detectUtil } from './detectUtil.js'

const defaultDetectionConfig = {
    poisoned: 'jb2a.magic_signs.rune.abjuration.complete.red',
    diseased: 'jb2a.magic_signs.rune.conjuration.complete.pink',
};

const defaultValidator = async function (target, tags) {
    for (let tag of tags) {
        if (target.actor.statuses.has(tag)) { return true; }
    }
    return Tagger?.hasTags(target, tags);
}

const DEFAULT_CONFIG = {
    distance: 30,
    effect: {
        pulse: {
            img: 'jb2a.detect_magic.circle.green',
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

export const poison = {
    create,
    play,
};