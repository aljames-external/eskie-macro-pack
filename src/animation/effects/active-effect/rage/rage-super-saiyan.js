/**
 * Original Author: EskieMoh#2969
 * Update Author: bakanabaka
 */

import { closest } from '../../../../lib/filemanager.js';
import { util } from './rage-util.js';

export const DEFAULT_CONFIG = {
    id: 'SSJRage',
    color: 'orange'
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
        .filter("ColorMatrix", { hue: 20, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(1);

    seq = seq
        .effect()
        .name(`${label} - ground-crack`)
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(token)
        .belowTokens()
        .fadeIn(2000)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .persist()
        .zIndex(0);

    seq = seq
        .effect()
        .name(label)
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token, { offset: { y: 75 } })
        .size(1.75, { gridUnits: true })
        .rotate(90)
        .opacity(1)
        .loopProperty("sprite", "position.y", { from: -5, to: 5, duration: 50, pingPong: true })
        .duration(8000)
        .fadeOut(3000)
        .tint(util.hexValue(color));

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
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token)
        .attachTo(token)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .filter("ColorMatrix", { saturate: 1 })
        .tint(util.hexValue(color))
        .persist()
        .private();

    seq = seq
        .effect()
        .name(label)
        .file(closest(`jb2a.token_border.circle.static.${color}.012`))
        .atLocation(token)
        .attachTo(token)
        .opacity(0.7)
        .scaleToObject(1.9)
        .filter("ColorMatrix", { hue: 30, saturate: 1, contrast: 0, brightness: 1 })
        .persist();

    return seq;
}

async function play(token, config) {
    let seq = await create(token, config);
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

export const superSaiyan = {
    create,
    play,
    stop,
    clean,
};