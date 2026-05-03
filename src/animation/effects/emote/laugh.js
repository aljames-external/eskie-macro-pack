import { closest } from "../../../lib/filemanager.js";

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
    ]
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
async function create(token, config = {}) {
    // TODO(bakanabaka): Utilizes old [] -> {}
    let { id, duration, effect, facing } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    const tokenWidth = token.document.width;
    const mirrorFace = facing === 'right';
    const facingFactor = mirrorFace ? -1 : 1;

    let laughEffect = new Sequence()
        .animation()
        .on(token)
        .opacity(0)

        .effect()
        .name(id)
        .file(closest(effect[0].img))
        .atLocation(token, { offset: { x: (effect[0].x * tokenWidth * facingFactor), y: effect[0].y * tokenWidth }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .loopProperty("sprite", "rotation", { from: 0, to: -15 * facingFactor, duration: 250, ease: "easeOutCubic" })
        .loopProperty("sprite", "position.y", { from: 0, to: -0.025, duration: 250, gridUnits: true, pingPong: false })
        .scaleToObject(effect[0].scale)
        .mirrorX(mirrorFace)
        .private();
    laughEffect = (duration > 0) ? laughEffect.duration(duration) : laughEffect.persist();

    laughEffect = laughEffect
        .effect()
        .name(id)
        .copySprite(token)
        .scaleToObject(1, { considerTokenScale: true })
        .atLocation(token)
        .attachTo(token, { bindAlpha: false })
        .loopProperty("sprite", "position.y", { from: 0, to: -0.01, duration: 150, gridUnits: true, pingPong: true, ease: "easeOutQuad" })
        .loopProperty("sprite", "width", { from: 0, to: 0.015, duration: 150, gridUnits: true, pingPong: true, ease: "easeOutQuad" })
        .loopProperty("sprite", "height", { from: 0, to: 0.015, duration: 150, gridUnits: true, pingPong: true, ease: "easeOutQuad" })
        .mirrorY(token.document.mirrorX)
        .waitUntilFinished(-200)
    laughEffect = (duration > 0) ? laughEffect.duration(duration) : laughEffect.persist();

    laughEffect = laughEffect
        .animation()
        .on(token)
        .opacity(1);

    return laughEffect;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return Sequencer.EffectManager.endEffects({ name: mConfig.id, object: token });
}

export const laugh = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
