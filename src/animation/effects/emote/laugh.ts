import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
/* **
   Originally Published: 6/5/2023
   Author: EskieMoh#2969 
   Update Author: bakanabaka
** */

const DEFAULT_CONFIG = {
    id: 'laugh',
    duration: 0,
    facing: 'left',
    effect: [
        { // laughing face
            img: 'eskie.emote.laugh.01.yellow',
            x: 0.3,
            y: -0.3,
            scale: 0.9
        },
        {} // token shake
    ],
    sound: { ...DEFAULT_SOUND_CONFIG }
};

/**
 * Creates a laugh emote effect on a token.
 *
 * @param {Token} token The token to play the effect on.
 * 
 * @param {object} [config={}] Configuration for the effect.
 * @param {string} [config.id='laugh'] The id of the effect.
 * @param {number} [config.duration=0] The duration of the effect in milliseconds. A duration of 0 will make the effect persist.
 * @param {string} [config.facing='left'] The direction the token is facing. Can be 'left' or 'right'.
 * @param {object[]} [config.effect] An array of effect objects to display. Partial objects will be merged with default values.
 * @param {string} [config.effect.img] The image file to use for the effect.
 * @param {number} [config.effect.x] The x offset of the effect in grid units.
 * @param {number} [config.effect.y] The y offset of the effect in grid units.
 * @param {number} [config.effect.scale] The scale of the effect.
 * 
 * @returns {Promise<void>} A promise that resolves when the effect is finished.
 */
async function create(token: Token, config: any = {}) {
    // TODO(bakanabaka): Utilizes old [] -> {}
    let { id, duration, effect, facing , sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const mirrorFace = facing === 'right';
    const facingFactor = mirrorFace ? -1 : 1;

    let laughEffect = new Sequence();
    applySound(laughEffect, sound);
    laughEffect = laughEffect
        .effect()
        .name(id)
        .file(closest(effect[0].img))
        .atLocation(token, { offset: { x: (effect[0].x * tokenWidth * facingFactor), y: effect[0].y * tokenWidth }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .loopProperty('sprite', "rotation", { from: 0, to: -15 * facingFactor, duration: 250, ease: "easeOutCubic" })
        .loopProperty('spriteContainer', 'position.y', { from: 0, to: -0.025, duration: 250, gridUnits: true, pingPong: false })
        .scaleToObject(effect[0].scale)
        .mirrorX(mirrorFace)
        .private();
    laughEffect = (duration > 0) ? laughEffect.duration(duration) : laughEffect.persist();

    laughEffect = laughEffect
        .motion(token)
        .name(id)
        .noise()
        .waitUntilFinished(-200);
    laughEffect = (duration > 0) ? laughEffect.duration(duration) : laughEffect.persist();

    return laughEffect;
}

async function play(token: Token, config: any = {}) {
    const seq = await create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    return Sequencer.EffectManager.endEffects({ name: mConfig.id, object: token });
}

export const laugh = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
