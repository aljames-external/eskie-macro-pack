import { file } from "../../../lib/filemanager.js";
import { utils } from "../../utils/utils.js"

/* **
   Originally Published: 5/1/2023
   Author: EskieMoh#2969 
   Update Author: bakanabaka
** */

/**
 * Creates a slap emote effect at a specified location.
 *
 * @param {object} location The location to play the effect at.
 * @param {object} [config={}] Options for the effect.
 * @param {string} [config.id='slap'] The id of the effect.
 * @param {number} [config.duration=0] The duration of the effect in milliseconds. A duration of 0 will make the effect persist.
 * @param {object[]} [config.effect] An array of effect objects to display. Partial objects will be merged with default values.
 * @param {string} [config.effect.img] The image file to use for the effect.
 * @param {number} [config.effect.x] The x offset of the effect in grid units.
 * @param {number} [config.effect.y] The y offset of the effect in grid units.
 * @param {number} [config.effect.size] The size of the effect in grid units.
 * @param {number} [config.effect.rotation] The rotation of the effect.
 * 
 * @returns {Promise<void>} A promise that resolves when the effect is finished.
 */
async function create(location, config = {}) {
    const defaultConfig = {
        id: 'slap',
        duration: 5000,
        effect: [
            { // impact
                img: 'eskie.sound.roar',
                x: 0.1,
                y: -0.1,
                scale: 1.7
            },
            { // slap image
                img: "https://i.imgur.com/9tLjNHH.png",
                scale: 0.55,
                rotation: -45
            },
            { // slap image shadow
                img: "https://i.imgur.com/9tLjNHH.png",
                scale: 0.55,
                rotation: -45
            }
        ]
    };
    let { id, duration, effect } = utils.mergeObject(defaultConfig, config);

    let slapEffect = new Sequence()
        .effect()
        .name(id)
        .atLocation(location, { offset: { x: effect[0].x, y: effect[0].y }, gridUnits: true })
        .file(file(effect[0].img))
        .size(effect[0].scale, { gridUnits: true })

        .effect()
        .name(id)
        .atLocation(location)
        .file(effect[1].img)
        .size(effect[1].scale, { gridUnits: true })
        .rotate(effect[1].rotation)
        .fadeOut(250)
        .duration(1000)
        .delay(50)
        .zIndex(1)

        .effect()
        .name(id)
        .atLocation(location)
        .file(effect[2].img)
        .filter("ColorMatrix", { brightness: -1 })
        .opacity(0.5)
        .duration(6000)
        .fadeOut(1000)
        .rotate(effect[2].rotation)
        .size(effect[2].scale, { gridUnits: true })
        .delay(50)
        .zIndex(0);

    slapEffect = (duration > 0) ? slapEffect.duration(duration) : slapEffect.persist();
    return slapEffect;
}

async function play(config = {}, crosshairOptions = undefined) {
    let crosshairConfig = {
        size:0.5,
        icon: img('eskie.crosshair', 'circle', 'fantasy_01') ?? 'icons/svg/circle.svg',
        label: 'slap',
        tag: 'Spray',
        drawIcon: false,
        drawOutline: true,
        interval:0,
        fillAlpha: 0.25,
        fillColor: '#FF0000',
        rememberControlled: true,
        cancelled: false
    };

    let location = await Sequencer.Crosshair.show(crosshairOptions ?? crosshairConfig);
    if (location.cancelled) return;

    const seq = await create(location, config);
    if (seq) { await seq.play(); }
}

async function stop({id = 'slap'} = {}) {
    return Sequencer.EffectManager.endEffects({ name: id });
}

export const slap = {
    create,
    play,
    stop,
};
