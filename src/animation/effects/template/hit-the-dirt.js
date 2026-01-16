import { utils } from '../../utils/utils.js';
import { file } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

//Last Updated: 4/30/2024
//Author: EskieMoh#2969

const DEFAULT_CONFIG = {
    id: 'hitTheDirt',
    label: 'Hit the Dirt',
}

async function create(token, config, options) {
    if (options.type == 'aefx') return;
    const { id, template } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    const cfg = { 
        radius: 1, 
        icon: 'icons/magic/control/silhouette-fall-slip-prone.webp', 
        label: 'Hit The Dirt!'
    };
    let position = await utils.getPosition(template, cfg);
    if (!position) { return; }

    let seq = new Sequence()
        .animation()
            .delay(100)
            .on(token)
            .opacity(0)

        .effect()
            .delay(100)
            .file(file("animated-spell-effects-cartoon.air.puff.01"))
            .atLocation(token)
            .scaleToObject(1.1)
            .belowTokens()
            .playbackRate(1.5)
            .opacity(0.5)

        .effect()
            .copySprite(token)
            .atLocation(token)
            .scaleToObject(0.85, {considerTokenScale:true})
            .moveTowards(position, {delay: 100, rotate: false, ease: "easeOutQuint"})
            .duration(1600)
            .belowTokens()
            .filter("ColorMatrix", { saturate: -1, brightness:0 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.5)

        .effect()
            .delay(900)
            .file(file("animated-spell-effects-cartoon.smoke.99"))
            .atLocation(position)
            .rotateTowards(token)
            .scaleToObject(1.5)
            .belowTokens()
            .spriteOffset({x:-1.25}, {gridUnits:true})
            .spriteRotation(-90)
            .opacity(0.5)

        .effect()
            .delay(900)
            .file(file("animated-spell-effects-cartoon.earth.debris.04"))
            .atLocation(position)
            .rotateTowards(token)
            .scaleToObject(1.5)
            .belowTokens()
            .spriteOffset({x:-1.25}, {gridUnits:true})
            .spriteRotation(90)
            .zIndex(0)

        // Animate the token jumping
        .effect()
            .copySprite(token)
            .atLocation(token)
            .scaleToObject(1, {considerTokenScale:true})
            .moveTowards(position, {delay: 100, rotate: false, ease: "easeOutQuint"})    // Horizontal Movement
            .duration(1300)
            .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.8, duration: 550, delay: 100, gridUnits:true, ease:"easeOutQuint"})
            .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.8, duration: 550, delay: 650, gridUnits:true, ease:"easeOutQuad"})
            .animateProperty("sprite", "rotation", { from: 0, to: 90, duration: 500,delay: 100,ease:"easeOutCubic"})
            .waitUntilFinished(-200)

        // Update the actual token
        .animation()
            .on(token)
            .teleportTo(adjust(position))
            .rotate(token.document.rotation+90)
            .opacity(1);
    return seq;
}

// Hacky fix for teleportTo -- Crosshair.show gives .center, but teleportTo expects the top-left corner
function adjust(position) {
    return {x: position.x - canvas.grid.size / 2, y: position.y - canvas.grid.size / 2};
}

async function play(token, config) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

function destroy(token, config) {
    let seq = new Sequence()
        .animation()
            .on(token)
            .rotate(token.document.rotation-90);
    return seq;
}

async function stop(token, config) {
    const seq = destroy(token, config);
    if (seq) return seq.play();
}

export const hitTheDirt = {
    create,
    play,
    destroy,
    stop,
};

autoanimations.register('Hit the Dirt', 'template', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG);
autoanimations.register('Hit the Dirt', 'effect', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG);