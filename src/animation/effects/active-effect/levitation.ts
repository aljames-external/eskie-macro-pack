// Original Author: Mia Del'Mori
// Updated By: Eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'levitation',
    tint: '#00b3ff',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, tint, sound } = mConfig;
    const label = `${id} - ${token.id}`;

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Levitating token hover motion via Sequencer 4.3.0+ .motion() API
    sequence
        .motion(token)
        .name(label)
        .moveTo({ y: -0.6 }, { gridUnits: true, duration: 2000, ease: "easeOutCubic" })
        .oscillate()
        .persist();

    // Bless loop effect
    sequence
        .effect()
        .name(label)
        .atLocation(token)
        .attachTo(token, { bindAlpha: false })
        .file(closest("jb2a.bless.200px.loop.blue"))
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(2)
        .tint(tint)
        .persist();

    // Wind stream effect
    sequence
        .effect()
        .name(label)
        .atLocation(token)
        .attachTo(token, { bindAlpha: false })
        .file(closest("jb2a.wind_stream.200.white"))
        .fadeIn(500)
        .fadeOut(500)
        .rotate(90)
        .tint(tint)
        .scaleToObject(1)
        .belowTokens()
        .persist();

    // Levitating token border
    sequence
        .effect()
        .name(label)
        .attachTo(token, { bindAlpha: false })
        .file(closest("jb2a.token_border.circle.static.blue.012"))
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(2)
        .belowTokens()
        .zIndex(1)
        .persist();

    return sequence;
}

async function play(token: Token, config: any = {}) {
    const sequence = create(token, config);
    if (sequence) return sequence.play();
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    return Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const levitation = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("levitating", "effect", "eskie.effect.levitation", DEFAULT_CONFIG, "0.0.2", "Levitating");

