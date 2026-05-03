/* **
   Original Author: derkreigs
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'banish',
    color: 'yellow',
    sound: {
        enabled: true,
        volume: 0.5,
    }
};

async function createBanish(target, config = {}) {
    config = settingsOverride(config);
    const { color, sound } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // ... animation logic omitted for brevity in template, see complete file ...

    const sequence = new Sequence();
    // sequence construction...

    return sequence;
}

async function playBanish(target, config = {}) {
    const sequence = await createBanish(target, config);
    if (sequence) return sequence.play();
}

async function createReturn(target, config = {}) {
    config = settingsOverride(config);
    const { color, sound } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const sequence = new Sequence();
    // sequence construction...
    return sequence;
}

async function playReturn(target, config = {}) {
    const sequence = await createReturn(target, config);
    if (sequence) return sequence.play();
}

async function clean(target, config = {}) {
    new Sequence()
        .animation()
        .on(target)
        .opacity(1)
        .show(true)
        .play();
}

export const banishment = {
    banish: {
        create: createBanish,
        play: playBanish,
        stop: playReturn,
        clean: clean,
        default_config: DEFAULT_CONFIG,
    },
    return: {
        create: createReturn,
        play: playReturn,
        default_config: DEFAULT_CONFIG,
    },
    play: playBanish,
    stop: playReturn,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Banishment", "effect", "eskie.effect.banishment", DEFAULT_CONFIG, '0.1.0');
