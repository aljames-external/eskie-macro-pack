/**
* Last Updated: 01/06/2026
* Author: .Doomrule
* Modular Update: Bakana
**/

import { file } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'Benign Transportation',
    animations: {
        out: {
            file: 'jb2a.misty_step.01.blue',
            until: -2000,
        },
        in: {
            file: 'jb2a.misty_step.02.blue',
            until: -3500,
        }
    },
    sound: {
        enabled: true,
        volume: 0.5,
        file: `psfx.2nd-level-spells.misty-step.v1.outro.fire`,
    },
    teleport: true
}

async function create(token, targets, config = {}) {
    config = settingsOverride(config);
    const { id, animations, sound, teleport } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    if (!Array.isArray(targets)) targets = [targets];
    const A = targets[0];
    const B = (targets.length > 1) ? targets[1] : token;

    const seq = new Sequence();
        
        if (sound.enabled) {
            seq.sound()
                .file(file(sound.file))
                .volume(sound.volume)
        }

        seq.effect()
            .file(file(animations.out.file))
            .atLocation(A)
            .scaleToObject(2)
        .effect()
            .file(file(animations.out.file))
            .atLocation(B)
            .scaleToObject(2)
            .waitUntilFinished(animations.out.until)

        .animation()
            .on(A)
            .opacity(0)
        .animation()
            .on(B)
            .opacity(0)

        if (teleport) {
            seq.animation()
                .on(A)
                .teleportTo(B.center)
                .snapToGrid()
            .animation()
                .on(B)
                .teleportTo(A.center)
                .snapToGrid()
        }

        seq.effect()
            .file(file(animations.in.file))
            .atLocation(A)
            .scaleToObject(2)
        .effect()
            .file(file(animations.in.file))
            .atLocation(B)
            .scaleToObject(2)
            .waitUntilFinished(animations.in.until)

        .animation()
            .on(A)
            .opacity(1)
        .animation()
            .on(B)
            .opacity(1)
        
        return seq;
}

async function play(token, targets, config = {}) {
    let seq = await create(token, targets, config);
    if (seq) { await seq.play(); }
}

export const benignTransportation = {
    create,
    play,
};

autoanimations.register("Benign Transportation", "ranged-target", "eskie.effect.benignTransportation", DEFAULT_CONFIG);