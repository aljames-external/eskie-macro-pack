import { detectUtil } from './detectUtil.js'
import { dependency } from '../../../../lib/dependency.js';

/*
    Originally Published: 8/21/2023
    Original Author: EskieMoh#2969 for Divine Sense
    Modified by Tyreal2012
    Update Author: bakanabaka
*/

const defaultDetectionConfig = {
    abjuration: 'jb2a.magic_signs.rune.abjuration.complete.red',
    conjuration: 'jb2a.magic_signs.rune.conjuration.complete.pink',
    divination: 'jb2a.magic_signs.rune.divination.complete.blue',
    enchantment: 'jb2a.magic_signs.rune.enchantment.complete.purple',
    illusion: 'jb2a.magic_signs.rune.illusion.complete.yellow',
    necromancy: 'jb2a.magic_signs.rune.necromancy.complete.green',
};

const defaultValidator = async function (target, tags) {
    dependency.required({id: "tagger", ref: "Tagger"});
    return Tagger.hasTags(target, tags);
}

const DEFAULT_CONFIG = {
    distance: 30,
    effect: {
        pulse: {
            img: 'jb2a.detect_magic.circle.purple',
        },
    },
    detection: defaultDetectionConfig,
    validator: defaultValidator,
}

async function create(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    return detectUtil.create(token, mConfig);
}

async function play(token, config) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

export const magic = {
    create,
    play,
};