// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { file } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'TeleportOut',
};

function create(token, targets, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    const maxDistance = Math.max(...targets.map(target => 3 * Math.max(Math.abs(target.x - token.x), Math.abs(target.y - token.y)) / canvas.dimensions.size + 1));

    let sequence = new Sequence();
    sequence = sequence.effect()
        .file(file("jb2a.particles.outward.blue.01.05"))
        .atLocation(token)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .scaleToObject(1.7)
        .fadeIn(3000, { ease: "easeInExpo" })
        .duration(5500);

    sequence = sequence.effect()
        .file(file("jb2a.particles.outward.blue.01.05"))
        .atLocation(token)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .scaleToObject(4)
        .belowTokens()
        .fadeIn(3000, { ease: "easeInExpo" })
        .duration(5500);

    sequence = sequence.effect()
        .file(file("jb2a.magic_signs.circle.02.conjuration.intro.blue"))
        .atLocation(token)
        .belowTokens()
        .scaleToObject(maxDistance)
        .filter("ColorMatrix", { saturate: -0.25, brightness: 1 })
        .opacity(0.8)
        .waitUntilFinished(-1000);

    sequence = sequence.effect()
        .file(file("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
        .atLocation(token)
        .filter("ColorMatrix", { saturate: -0.5, brightness: 1.5 })
        .opacity(0.65)
        .belowTokens()
        .scaleToObject(maxDistance)
        .duration(2500);

    sequence = sequence.animation()
        .on(token)
        .delay(2000)
        .opacity(0);

    targets.forEach(target => {
        sequence = sequence.animation()
            .on(target)
            .delay(2000)
            .opacity(0);
    });

    return sequence;
}

async function play(token, targets, config = {}) {
    const sequence = create(token, targets, config);
    if (sequence) { return sequence.play(); }
}

export const teleportOut = {
    create,
    play,
};
