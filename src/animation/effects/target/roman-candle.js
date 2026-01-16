// Original Author: Unknown
// Modular Conversion: bakanabaka

import { file } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: "romanCandle",
    position: undefined,
    shots: 3,
}

async function create(token, config = {}) {
    var items = Sequencer.Database.getPathsUnder('jb2a.bolt.fire');
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    let { shots, position } = mConfig;
    if (!position) {
        const crosshairConfig = {
            size: 2,
            icon: 'icons/magic/fire/projectile-meteor-salvo-heavy-blue.webp',
            label: 'Roman Candle',
            drawIcon: true,
            drawOutline: true,
            interval: 0,
            rememberControlled: true
        };
        position = await Sequencer.Crosshair.show(crosshairConfig);
        if (position.cancelled) return undefined;
    }

    let seq = new Sequence();
    seq = seq.effect()
        .file(file("jb2a.impact.005.white"))
        .scale(0.5)
        .atLocation(token)
        .anchor({ x: 0.42 })
        .rotateTowards(position)
        .animateProperty("sprite", "rotation", { from: -45, to: -45, duration: 10 })
        .zIndex(2)
        .duration(10000)
        .belowTokens()
        .playbackRate(2)
        .attachTo(token, { bindVisibility: false });

    seq = seq.effect()
        .file(file("jb2a.impact.005.yellow"))
        .scale(0.5)
        .atLocation(token)
        .anchor({ x: 0.42 })
        .rotateTowards(position)
        .animateProperty("sprite", "rotation", { from: -45, to: -45, duration: 10 })
        .zIndex(2)
        .delay(250)
        .duration(10000)
        .belowTokens()
        .playbackRate(2)
        .attachTo(token, { bindVisibility: false });

    for (let i = 0; i < shots; i++){
        let effectColor = items[Math.floor(Math.random() * items.length)];
        seq = seq.effect()
            .file(file(`jb2a.impact.005.${effectColor}`))
            .scale(0.5)
            .atLocation(token)
            .anchor({ x: 0.42 })
            .rotateTowards(position)
            .animateProperty("sprite", "rotation", { from: -45, to: -45, duration: 10 })
            .delay(500)
            .duration(10000)
            .belowTokens()
            .playbackRate(2)
            .attachTo(token, { bindVisibility: false });

        seq = seq.effect()
            .file(file("jb2a.bolt.physical.white"))
            .scale(2)
            .atLocation(token)
            .stretchTo(position)
            .loopProperty("sprite", "position.y", { from: -25, to: 25, duration: 1000, pingPong: true })
            .filter("ColorMatrix", { saturate: -1, brightness: 1 })
            .zIndex(2)
            .filter("Blur", { blurX: 5, blurY: 10 })
            .startTime(1000)
            .delay(1000);

        seq = seq.effect()
            .file(file(`jb2a.bolt.fire.${effectColor}`))
            .atLocation(token)
            .scale(2)
            .loopProperty("sprite", "position.y", { from: -25, to: 25, duration: 1000, pingPong: true })
            .stretchTo(position)
            .startTime(1000)
            .delay(1000)
            .waitUntilFinished();
    }

    return seq;
}

async function play(token, config) {
    const seq = await create(token, config);
    if (seq) { seq.play(); }
}

export const romanCandle = {
    create,
    play,
};
