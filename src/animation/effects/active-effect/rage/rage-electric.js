/**
 * Original Author: EskieMoh#2969
 * Update Author: bakanabaka
 */

import { closest } from '../../../../lib/filemanager.js';
import { util } from './rage-util.js';

export const DEFAULT_CONFIG = {
    id: 'ElectricRage',
    color: 'purple',
};

function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, color } = mConfig;
    const label = `${id} - ${token.id}`;

    let seq = new Sequence();
    seq = seq
        .effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.outpulse.circle.02.normal"))
        .atLocation(token)
        .size(4, { gridUnits: true })
        .opacity(0.25);

    seq = seq
        .effect()
        .name(label)
        .file(closest(`jb2a.impact.ground_crack.${color}.02`))
        .atLocation(token)
        .belowTokens()
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(1);

    seq = seq
        .effect()
        .name(`${label} - ground-crack`)
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(token)
        .belowTokens()
        .fadeIn(1000)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .persist()
        .zIndex(0);

    seq = seq
        .effect()
        .name(label)
        .file(closest(`jb2a.static_electricity.03.${color}`))
        .atLocation(token)
        .size(3, { gridUnits: true })
        .rotate(90)
        .randomRotation()
        .opacity(0.75)
        .belowTokens()
        .duration(8000)
        .fadeOut(3000);

    seq = seq
        .effect()
        .name(label)
        .file(closest(`jb2a.particles.outward.${color}.01.03`))
        .atLocation(token)
        .scaleToObject(2.5)
        .opacity(1)
        .fadeIn(200)
        .fadeOut(3000)
        .loopProperty("sprite", "position.x", { from: -5, to: 5, duration: 50, pingPong: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -100, duration: 6000, pingPong: true, delay: 2000 })
        .duration(8000);

    seq = seq
        .effect()
        .name(label)
        .file(closest(`jb2a.static_electricity.03.${color}`))
        .atLocation(token)
        .attachTo(token)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .persist()
        .private();

    seq = seq
        .effect()
        .name(label)
        .file(closest(`jb2a.token_border.circle.static.${color}.009`))
        .atLocation(token)
        .attachTo(token)
        .belowTokens()
        .opacity(1)
        .scaleToObject(2.025)
        .persist()
        .zIndex(5);

    return seq;
}

async function play(token, config) {
    let seq = create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    return util.stop(token, mConfig);
}

async function clean(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    return util.clean(token, mConfig);
}

export const electric = {
    create,
    play,
    stop,
    clean
};