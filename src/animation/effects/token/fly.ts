// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: "fly",
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;
    const label = `${id} - ${token.id}`;

    const seq = new Sequence();
    applySound(seq, sound);
    seq.effect()
        .file(closest("jb2a.misty_step.01.blue"))
        .atLocation(token)
        .scaleToObject(1.75)
        .belowTokens();

    seq.motion(token)
        .name(label)
        .moveTo({ y: -0.5 }, { gridUnits: true })
        .oscillate()
        .persist();

    seq.effect()
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .name(label)
        .atLocation(token, { ignoreMotion: true })
        .scaleToObject(0.9, { considerTokenScale: true })
        .duration(1000)
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .attachTo(token, { bindAlpha: false, ignoreMotion: true })
        .zIndex(1)
        .persist();

    return seq;
}

async function play(token: Token, config: any = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    return Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const fly = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

