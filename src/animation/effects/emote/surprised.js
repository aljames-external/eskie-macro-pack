import { closest } from "../../../lib/filemanager.js";

/* **
   Originally Published: 4/14/2023
   Author: EskieMoh#2969 
   Update Author: bakanabaka
** */

/**
 * Creates a surprised emote effect on a token.
 *
 * @param {Token} token The token to play the effect on.
 * 
 * @param {object} [config={}] Options for the effect.
 * @param {string} [config.id='surprised'] The id of the effect.
 * @param {number} [config.duration=0] The duration of the effect in milliseconds. A duration of 0 will make the effect persist.
 * @param {object[]} [config.effect] An array of effect objects to display. Partial objects will be merged with default values.
 * @param {string} [config.effect.img] The image file to use for the effect.
 * @param {number} [config.effect.scale] The scale of the effect.
 * @param {object} [config.effect.anchor] The anchor point of the effect.
 * 
 * @returns {Promise<void>} A promise that resolves when the effect is finished.
 */
async function create(token, config = {}) {
    const defaultConfig = {
        id: 'surprised',
        duration: 0,
        effect: [
            {   // !! } surprised icon
                img: 'eskie.emote.surprised.01',
                scale: 1.2,
                anchor: { x: -0.3, y: 1.25 },
                x: -0.8,
                y: 0.5
            }
        ]
    };
    // TODO(bakanabaka): Utilizes old mergeObject
    let { id, duration, effect } = foundry.utils.mergeObject(defaultConfig, config, {inplace:false});

    const tokenWidth = token.document.width;

    let surprisedEffect = new Sequence()
        .effect()
        .name(id)
        .file(closest(effect[0].img))
        .atLocation(token)
        .anchor(effect[0].anchor)
        .spriteOffset({ x: effect[0].x * tokenWidth, y: effect[0].y * tokenWidth }, { gridUnits: true, local: true })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .scaleOut(0, 500, { ease: "easeOutExpo" })
        .loopProperty("sprite", "position.y", { from: 0, to: -15, duration: 750, pingPong: true })
        .scaleToObject(effect[0].scale)
        .attachTo(token, { bindAlpha: false })
        .waitUntilFinished();

    surprisedEffect = (duration > 0) ? surprisedEffect.duration(duration) : surprisedEffect.persist();
    return surprisedEffect;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token, {id = 'surprised'} = {}) {
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

async function exclaim(token, {id = 'surprised', duration = 0, anchor = { x: 0.5, y: 1.55 }} = {}) {
    let seq = new Sequence()
        .effect()
        .name(id)
        .file("https://i.imgur.com/8Yr9fMC.png")
        .atLocation(token)
        .anchor(anchor)
        .scaleIn(0, 500, {ease: "easeOutElastic"})
        .scaleOut(0, 500, {ease: "easeOutExpo"})
        .loopProperty("sprite", "position.y", { from: 0, to: -15, duration: 750, pingPong: true})
        .scaleToObject(0.6)
        .attachTo(token, {bindAlpha: false});
    seq = (duration > 0) ? seq.duration(duration) : seq.persist();
    return seq;
}

export const surprised = {
    create,
    play,
    stop,
    exclaim,
};
