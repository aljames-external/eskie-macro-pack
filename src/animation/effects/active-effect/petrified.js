/* **
    Last Updated: 7/12/2022
    Author: EskieMoh#2969
    Updated: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'Petrified'
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;

    let sequence = new Sequence()
        .effect()
            .name(id)
            .copySprite(token)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .mask(token)
            .opacity(0.4)
            .filter("ColorMatrix", { contrast: 1, saturate: -1 })
            .filter("Glow", { color: 0x000000, distance: 3, outerStrength: 4 })
            .attachTo(token)
            .fadeIn(3000)
            .duration(5000)
            .zIndex(1)
            .persist()

        .effect()
            .file(closest("https://i.imgur.com/4P2tITB.png"))
            .name(id)
            .atLocation(token)
            .mask(token)
            .opacity(1)
            .filter("Glow", { color: 0x000000, distance: 3, outerStrength: 4 })
            .zIndex(0)
            .fadeIn(3000)
            .duration(5000)
            .attachTo(token)
            .persist();

    return sequence;
}

async function play(token, config = {}) {
    let seq = await create(token, config);
    if (seq) await seq.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    let sequence =  new Sequence()
        .effect()
            .file(closest("animated-spell-effects-cartoon.earth.explosion.02"))
            .atLocation(token)
            .filter("ColorMatrix", { saturate: -1 })
            .scaleToObject(2)
            .randomRotation()
            .animation()
            .on(token)
            .opacity(1)
            .thenDo(() => { Sequencer.EffectManager.endEffects({ name: id, object: token }); });
    await sequence.play();
}

export const petrified = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Petrified", "effect", "eskie.effect.petrified", DEFAULT_CONFIG);