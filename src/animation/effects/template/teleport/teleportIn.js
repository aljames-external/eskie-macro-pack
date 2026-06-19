// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'TeleportIn',
};

function create(token, targets, config = {}) {
    const { id, position } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const maxDistance = Math.max(...targets.map(target => 3 * Math.max(Math.abs(target.x - token.x), Math.abs(target.y - token.y)) / canvas.dimensions.size + 1));
    const {x, y} = token.center;

    let sequence = new Sequence();
    sequence = sequence.animation()
        .on(token)
        .teleportTo(position, { offset: { x: -1, y: -1 } })
        .snapToGrid();
    targets.forEach(target => {
        let targetX = position.x + (target.center.x - x);
        let targetY = position.y + (target.center.y - y);
        sequence = sequence.animation()
            .on(target)
            .teleportTo({ x: targetX, y: targetY }, { offset: { x: -1, y: -1 } })
            .snapToGrid()
    });

    sequence = sequence.effect()
        .file(closest("jb2a.magic_signs.circle.02.conjuration.intro.blue"))
        .atLocation(token)
        .belowTokens()
        .scaleToObject(maxDistance)
        .filter("ColorMatrix", { saturate: -0.25, brightness: 1 })
        .opacity(0.8)
        .waitUntilFinished(-500);
    sequence = sequence.effect()
        .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
        .atLocation(token)
        .filter("ColorMatrix", { saturate: -0.5, brightness: 1.5 })
        .opacity(0.65)
        .belowTokens()
        .scaleToObject(maxDistance)
        .duration(2500)
        .waitUntilFinished(-1500);

    sequence = sequence.effect()
        .copySprite(token)
        .atLocation(token)
        .scaleToObject(1.1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .animateProperty("spriteContainer", "position.y", { from: -1000, to: 0, duration: 500, ease: "easeOutCubic" })
        .duration(500)
        .attachTo(token, { bindAlpha: false });
    targets.forEach(target => {
        sequence = sequence.effect()
            .copySprite(target)
            .atLocation(target)
            .scaleToObject(1.1, { considerTokenScale: true })
            .filter("ColorMatrix", { saturate: -1, brightness: 10 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .animateProperty("spriteContainer", "position.y", { from: -1000, to: 0, duration: 500, ease: "easeOutCubic" })
            .duration(500)
            .attachTo(target, { bindAlpha: false });
    });

    sequence = sequence.waitUntilFinished()
    sequence = sequence.animation()
        .on(token)
        .opacity(1.0)
        .show();
    targets.forEach(target => {
        sequence = sequence.animation()
            .on(target)
            .opacity(1.0)
            .show()
    });
    
    return sequence;
}

async function play(token, targets, config = {}) {
    const sequence = create(token, targets, config);
    if (sequence) { return sequence.play(); }
}

export const teleportIn = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
