//Last Updated: 12/15/2025
//Author: .eskie
//Integration: bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

const DEFAULT_CONFIG = {
    id: "hide",
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: Record<string, any> = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    const seq = new Sequence();
    applySound(seq, sound);

    // Black smoke burst
    seq.effect()
        .file(closest("eskie.smoke.03.black"))
        .attachTo(token)
        .scaleToObject(1.75)
        .opacity(1)
        .randomRotation()
        .fadeOut(1000)
        .zIndex(2)
        .tint("#696969");

    // Stealth fade motion via Sequencer 4.3.0+ sequence.motion(token)
    seq.motion(token)
        .fadeTo(0.25, { duration: 500 })
        .tintTo("#696969", { duration: 500 });

    return seq;
}

async function play(token: Token, config: Record<string, any> = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token: Token, _config: Record<string, any> = {}) {
    return new Sequence()
        .motion(token)
        .fadeTo(1, { duration: 500 })
        .tintTo("#FFFFFF", { duration: 500 })
        .play();
}

export const hide = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("hide", "effect", "eskie.effect.hide", DEFAULT_CONFIG, "0.0.3", "Hide");