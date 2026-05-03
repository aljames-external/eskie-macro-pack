import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

/* **
   Originally Published: 4/14/2023
   Author: EskieMoh#2969 
   Update Author: bakanabaka
** */

const DEFAULT_CONFIG = {
    id: 'angry',
    duration: 0,
    scale: 0.85,
    file: 'eskie.emote.angry.02'
};

async function create(token, config = {}) {
    const { id, duration, scale, file } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const tokenHeight = token.document.height;
    const tokenWidth = token.document.width;

    let angryEffect = new Sequence()
        .effect()
            .name(id)
            .file(closest(file))
            .atLocation(token)
            .scaleIn(0, 1000, {ease: "easeOutElastic"})
            .scaleOut(0, 1000, {ease: "easeOutExpo"})
            .spriteOffset({ x: 0.3 * tokenWidth, y: -0.4 * tokenHeight }, { gridUnits: true, local: true })
            .scaleToObject(scale * 0.8)
        angryEffect = (duration > 0) ? angryEffect.duration(duration) : angryEffect.persist();    
        angryEffect = angryEffect.duration(duration)
            .attachTo(token, { bindAlpha: false })
            .loopProperty("alphaFilter", "alpha", { values: [...new Array(8).fill(1), ...new Array(8).fill(-1)], duration: 25, pingPong: false })
            .private()

        .effect()
            .name(id)
            .file(closest(file))
            .atLocation(token)
            .scaleIn(0, 1000, {ease: "easeOutElastic"})
            .scaleOut(0, 1000, {ease: "easeOutExpo"})
            .spriteOffset({ x: 0.3 * tokenWidth, y: -0.4 * tokenHeight }, { gridUnits: true, local: true })
            .scaleToObject(scale);
        angryEffect = (duration > 0) ? angryEffect.duration(duration) : angryEffect.persist();
        angryEffect = angryEffect
            .attachTo(token, {bindAlpha: false})
            .loopProperty("alphaFilter", "alpha", { values: [...new Array(8).fill(-1), ...new Array(8).fill(1)], duration: 25, pingPong: false })
            .waitUntilFinished();

    return angryEffect;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token, {id = 'angry'} = {}) {
    return Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const angry = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Angry", "effect", "eskie.effect.emote.angry", DEFAULT_CONFIG);