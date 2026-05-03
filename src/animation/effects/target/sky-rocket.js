// Original Author: Unknown
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {};

async function create(position, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let seq = new Sequence();
    seq = seq.effect()
        .file(closest(`jb2a.firework.02.{{color}}`))
        .atLocation(position)
        .setMustache({
            "color": () => {
                const colors = ['orangeyellow.03', 'orange.02', 'greenred.01', 'bluepink.03'];
                return colors[Math.floor(Math.random() * colors.length)];
            }
        })
        .scale(1)
        .delay(500)
        .zIndex(4);

    seq = seq.effect()
        .file(closest("jb2a.particles.outward.blue.02.03"))
        .atLocation(position)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .duration(7000)
        .fadeOut(3000)
        .scale(1.5)
        .randomRotation()
        .delay(500)
        .zIndex(4);

    return seq;
}

async function play(position, config = {}) {
    if (!position) {
        const crosshairConfig = {
            size: 5,
            icon: 'icons/magic/fire/explosion-fireball-large-purple-orange.webp',
            label: 'Skyrocket',
            drawIcon: true,
            drawOutline: true,
            interval: 0,
            rememberControlled: true
        };

        position = await Sequencer.Crosshair.show(crosshairConfig);
        if (position.cancelled) return;
    }

    let seq = await create(position, config);
    if (seq) { return seq.play(); }
}

export const skyRocket = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
