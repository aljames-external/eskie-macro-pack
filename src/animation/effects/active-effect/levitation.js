// Original Author: Mia Del'Mori
// Updated By: Eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'levitation',
    tint: '#00b3ff',
};

function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, tint } = mConfig;
    const label = `${id} - ${token.id}`;

    const sequence = new Sequence()
    .animation()
        .delay(75)
        .on(token)
        .opacity(0)

    // Bless loop effect
    .effect()
        .name(label)
        .atLocation(token)
        .attachTo(token, {bindAlpha: false})
        .file(closest("jb2a.bless.200px.loop.blue"))
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(2)
        .tint(tint)
        .persist()

    // Wind stream effect
    .effect()
        .name(label)
        .atLocation(token)
        .attachTo(token, {bindAlpha: false})
        .file(closest("jb2a.wind_stream.200.white"))
        .fadeIn(500)
        .fadeOut(500)
        .rotate(90)
        .tint(tint)
        .scaleToObject(1)
        .belowTokens()
        .persist()
    
    // Levitating token sprite
    .effect()
        .name(label)
        .attachTo(token, {bindAlpha: false})
        .copySprite(token)
        .fadeIn(500)
        .fadeOut(500)
        .animateProperty("sprite", "position.y", { from: 0, to: -0.6, duration: 2000, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", {from: -10, to: 10, duration: 1100, pingPong: true, ease: "easeInOutSine" })
        .loopProperty("sprite", "position.x", {from: -canvas.grid.size/9, to: canvas.grid.size/9, duration: 2000, pingPong: true, ease: "easeInOutSine" })
        .loopProperty("sprite", "position.y", {from: -canvas.grid.size/9, to: canvas.grid.size/9, duration: 3000, pingPong: true, ease: "easeInOutSine" })
        .zIndex(2)
        .persist()

    // Levitating token border
    .effect()
        .name(label)
        .attachTo(token, {bindAlpha: false})
        .file(closest("jb2a.token_border.circle.static.blue.012"))
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(2)
        .belowTokens()
        .animateProperty("sprite", "position.y", { from: 0, to: -0.6, duration: 2000, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", {from: -10, to: 10, duration: 1100, pingPong: true, ease: "easeInOutSine" })
        .loopProperty("sprite", "position.x", {from: -canvas.grid.size/9, to: canvas.grid.size/9, duration: 2000, pingPong: true, ease: "easeInOutSine" })
        .loopProperty("sprite", "position.y", {from: -canvas.grid.size/9, to: canvas.grid.size/9, duration: 3000, pingPong: true, ease: "easeInOutSine" })
        .zIndex(1)
        .persist();
    
    return sequence;
}

async function play(token, config = {}) {
    const sequence = create(token, config);
    if (sequence) { return sequence.play(); }
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const {id} = mConfig;
    const label = `${id} - ${token.id}`;

    new Sequence()
        .animation()
        .delay(75)
        .fadeIn(500)
        .fadeOut(500)
        .on(token)
        .opacity(1)
        .play();

    return Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const levitation = {
    create,
    play,
    stop
};

autoanimations.register("Levitating", "effect", "eskie.effect.levitation", DEFAULT_CONFIG);
