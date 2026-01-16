import { file } from "../../../lib/filemanager.js";

/* **
   Originally Published: 4/14/2023
   Author: EskieMoh#2969 
   Update Author: bakanabaka
** */

/**
 * Creates a soulsucked emote effect on a token.
 *
 * @param {Token} token The token to play the effect on.
 * 
 * @param {object} [config={}] Options for the effect.
 * @param {string} [config.id='soulsucked'] The id of the effect.
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
async function create(token, config = {}) {
    const defaultConfig = {
        id: 'soulsucked',
        duration: 0,
        facing: 'left',
        effect: [
            {
                img: 'eskie.emote.soul_sucked.01',
                x: -0.45,
                y: -0.25,
                scale: 0.7
            }
        ]
    };
    // TODO(bakanabaka): Utilizes old mergeObject
    let { id, duration, effect } = foundry.utils.mergeObject(defaultConfig, config, {inplace:false});
    const facing = config.facing ?? defaultConfig.facing;

    const tokenWidth = token.document.width;
    const mirrorFace = facing === 'right';
    const facingFactor = mirrorFace ? -1 : 1;

    let soulSuckedEffect = new Sequence()
        .effect()
        .name(id)
        .file(file(effect[0].img))
        .atLocation(token)
        .scaleIn(0, 1000, { ease: "easeOutElastic" })
        .scaleOut(0, 1000, { ease: "easeOutExpo" })
        .spriteOffset({ x: (effect[0].x * tokenWidth) * facingFactor, y: (effect[0].y * tokenWidth) }, { gridUnits: true, local: true })
        .scaleToObject(effect[0].scale)
        .mirrorX(mirrorFace)
        .loopProperty("sprite", "position.y", { from: -0.05, to: 0.05, duration: 3000, gridUnits: true, pingPong: true })
        .attachTo(token, { bindAlpha: false })
        .waitUntilFinished();

    soulSuckedEffect = (duration > 0) ? soulSuckedEffect.duration(duration) : soulSuckedEffect.persist();
    return soulSuckedEffect;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token, {id = 'soulsucked'} = {}) {
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const soulsucked = {
    create,
    play,
    stop,
};
