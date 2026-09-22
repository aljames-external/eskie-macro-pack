/* **
    Last Updated: 7/12/2022
    Author: EskieMoh#2969
    Updated: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'Petrified',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;

    let sequence = new Sequence();
    applySound(sequence, sound);
    sequence = sequence
        .motion(token)
        .noise({ strength: 0.05, speed: 75, gridUnits: true })
        .duration(5000)

        .effect()
        .file("https://i.imgur.com/4P2tITB.png")
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

async function play(token: Token, config: any = {}) {
    let seq = await create(token, config);
    if (seq) await seq.play();
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;
    let sequence = new Sequence();
    applySound(sequence, sound);
    sequence = sequence
        .effect()
        .file(closest("jb2a.impact.earth.01.browngreen"))
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

adapter.autorec.register("petrified", "effect", "eskie.effect.petrified", DEFAULT_CONFIG, "0.0.2", "Petrified");