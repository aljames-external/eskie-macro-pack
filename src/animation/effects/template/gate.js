/* **
    Original Author: EskieMoh#2969
    Last Updated: 02/18/23
    Author: Carnage Asada#3647
    Updated: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';
import { templates } from '../../../lib/templates.js';
import { autoanimations, CONCENTRATING } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: `gate`,
    destination: "Menu Prompt",
    destinationList: [
        { label: 'First World', value: 'First World' },
        { label: 'Astral Plane', value: 'Astral Plane' },
        { label: 'Ethereal Plane', value: 'Ethereal Plane' },
        { label: 'Shadow Plane', value: 'Shadow Plane' },
        { label: 'Plane of Air', value: 'Plane of Air' },
        { label: 'Plane of Earth', value: 'Plane of Earth' },
        { label: 'Plane of Fire', value: 'Plane of Fire' },
        { label: 'Plane of Water', value: 'Plane of Water' },
        { label: 'Negative Energy Plane', value: 'Negative Energy Plane' },
        { label: 'Positive Energy Plane', value: 'Positive Energy Plane' },
        { label: 'Heaven', value: 'Heaven' },
        { label: 'Nirvana', value: 'Nirvana' },
        { label: 'Elysium', value: 'Elysium' },
        { label: 'Axis', value: 'Axis' },
        { label: 'Boneyard', value: 'Boneyard' },
        { label: 'Maelstrom', value: 'Maelstrom' },
        { label: 'Hell', value: 'Hell' },
        { label: 'Abaddon', value: 'Abaddon' },
        { label: 'Abyss', value: 'Abyss' }
    ]
};

async function _getDestination(destinations) {
    return new Promise((resolve) => {
        let content = `
            <div class="form-group">
                <label>Destination:</label>
                <select id="destination-select">`;
        for (const dest of destinations) {
            content += `<option value="${dest.value}">${dest.label}</option>`;
        }
        content += `
                </select>
            </div>`;

        new Dialog({
            title: 'Select a Destination',
            content: content,
            buttons: {
                ok: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'OK',
                    callback: (html) => {
                        const selected = html.find('#destination-select').val();
                        resolve(selected);
                    },
                },
            },
            default: 'ok',
            close: () => {
                resolve(null);
            },
        }).render(true);
    });
}

function _getPlaneConfig(destination) {
    const planeConfigs = {
        'First World': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/nilqRZB.png', pulseColor: 'green', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#feb4fb' } } }, filter: { type: 'color', options: { color: { value: '#cf8ee6' }, saturation: 1.1, contrast: 1.1 } } },
        'Astral Plane': { portalColor: 'purple', circleColor: 'purple', castColor: 'purple', planeImage: 'https://i.imgur.com/iqkmZHK.png', pulseColor: 'purple', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#feb4fb' } } }, filter: { type: 'color', options: { color: { value: '#cf8ee6' }, saturation: 1.1, contrast: 1.1 } } },
        'Ethereal Plane': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/xhjyhbf.png', pulseColor: 'green', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#b4fede' } } }, filter: { type: 'color', options: { color: { value: '#b1f2d9' }, saturation: 1.1, contrast: 1.1 } } },
        'Shadow Plane': { portalColor: 'purple', circleColor: 'purple', castColor: 'purple', planeImage: 'https://i.imgur.com/TjMKbrj.png', pulseColor: 'purple', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#000000' } } }, filter: { type: 'color', options: { color: { value: '#b5b5b5' }, saturation: 1.1, contrast: 1.1 } } },
        'Plane of Air': { portalColor: 'purple', circleColor: 'purple', castColor: 'purple', planeImage: 'https://i.imgur.com/aiXrfBa.png', pulseColor: 'blue', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#ffffff' } } }, filter: { type: 'color', options: { color: { value: '#beebee' }, saturation: 1.1, contrast: 1, brightness: 1.2 } } },
        'Plane of Earth': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/sOEc80k.png', pulseColor: 'green', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#3ac200' } } }, filter: { type: 'color', options: { color: { value: '#bce788' }, saturation: 1.1, contrast: 1 } } },
        'Plane of Fire': { portalColor: 'orange', circleColor: 'yellow', castColor: 'yellow', planeImage: 'https://i.imgur.com/uCSWfpK.png', pulseColor: 'yellow', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#ff9500' } } }, filter: { type: 'color', options: { color: { value: '#e3bc68' }, saturation: 1.1, contrast: 1, brightness: 1.1 } } },
        'Plane of Water': { portalColor: 'blue', circleColor: 'blue', castColor: 'blue', planeImage: 'https://i.imgur.com/M7ge7ba.png', pulseColor: 'blue', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#00d5ff' } } }, filter: { type: 'color', options: { color: { value: '#687de3' }, saturation: 1.1, contrast: 1 } } },
        'Negative Energy Plane': { portalColor: 'purple', circleColor: 'dark_purple', castColor: 'purple', planeImage: 'https://i.imgur.com/vbHQrhx.png', pulseColor: 'purple', saturation: -1, hue: 0, weather: { type: 'stars', options: { tint: { value: '#bfbfbf' } } }, filter: { type: 'color', options: { color: { value: '#b5b5b5' }, saturation: 1.1, contrast: 1.1 } } },
        'Positive Energy Plane': { portalColor: 'yellow', circleColor: 'dark_yellow', castColor: 'yellow', planeImage: 'https://i.imgur.com/jAPMC6E.png', pulseColor: 'yellow', saturation: -0.25, hue: 0, weather: { type: 'stars', options: { tint: { value: '#ffffff' } } }, filter: { type: 'color', options: { color: { value: '#ffffff' }, saturation: 1.1, contrast: 1.1, brightness: 1.2 } } },
        'Heaven': { portalColor: 'yellow', circleColor: 'yellow', castColor: 'yellow', planeImage: 'https://i.imgur.com/CPmQviZ.png', pulseColor: 'yellow', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#fbc41e' } } }, filter: { type: 'bloom', options: { blur: 1, bloomScale: 0.2, threshold: 0.5 } } },
        'Nirvana': { portalColor: 'red', circleColor: 'red', castColor: 'white', planeImage: 'https://i.imgur.com/6fOXEiB.png', pulseColor: 'red', saturation: -0.45, hue: -20, weather: { type: 'stars', options: { tint: { value: '#febebe' } } }, filter: { type: 'bloom', options: { blur: 1, bloomScale: 0.1, threshold: 0.5 } } },
        'Elysium': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/sQE9mdV.png', pulseColor: 'green', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#febebe' } } }, filter: { type: 'bloom', options: { blur: 1, bloomScale: 0.1, threshold: 0.5 } } },
        'Axis': { portalColor: 'yellow', circleColor: 'yellow', castColor: 'yellow', planeImage: 'https://i.imgur.com/9659xZV.png', pulseColor: 'yellow', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#fbf050' } } }, filter: { type: 'color', options: { color: { value: '#e8bf5e' }, saturation: 1.1, contrast: 1.1 } } },
        'Boneyard': { portalColor: 'blue', circleColor: 'blue', castColor: 'blue', planeImage: 'https://i.imgur.com/Mp620An.png', pulseColor: 'blue', saturation: -0.5, hue: 0, weather: { type: 'stars', options: { tint: { value: '#c2b7fb' } } }, filter: { type: 'color', options: { color: { value: '#78aee8' }, saturation: 0.9, contrast: 1.1 } } },
        'Maelstrom': { portalColor: 'blue', circleColor: 'blue', castColor: 'blue', planeImage: 'https://i.imgur.com/xjcZLpj.png', pulseColor: 'blue', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#50d1fb' } } }, filter: { type: 'color', options: { color: { value: '#955ee8' }, saturation: 1.1, contrast: 1.1 } } },
        'Hell': { portalColor: 'red', circleColor: 'red', castColor: 'yellow', planeImage: 'https://i.imgur.com/7IFdFh6.png', pulseColor: 'red', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#000000' } } }, filter: { type: 'color', options: { color: { value: '#da7272' }, saturation: 1.1, contrast: 1.1 } } },
        'Abaddon': { portalColor: 'green', circleColor: 'green', castColor: 'green', planeImage: 'https://i.imgur.com/J8QPuFk.png', pulseColor: 'green', saturation: -0.5, hue: 0, weather: { type: 'stars', options: { tint: { value: '#000000' } } }, filter: { type: 'color', options: { color: { value: '#72dab7' }, saturation: 1.1, contrast: 1.1 } } },
        'Abyss': { portalColor: 'purple', circleColor: 'purple', castColor: 'purple', planeImage: 'https://i.imgur.com/fBApWFK.png', pulseColor: 'purple', saturation: 0, hue: 0, weather: { type: 'stars', options: { tint: { value: '#000000' } } }, filter: { type: 'color', options: { color: { value: '#d372da' }, saturation: 1.1, contrast: 1.1 } } },
    };
    return planeConfigs[destination];
}


async function create(token, config) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    mConfig.id = `${token.id} - ${mConfig.id}`;
    const { id, destination, destinationList, template } = mConfig;

    const cfg = { 
        radius: 10,
        max: 60,
        icon: 'modules/jb2a_patreon/Library/Generic/Portals/Portal_Bright_Purple_V_400x250.webm', 
        label: 'Gate'
    };
    let position = await templates.getPosition(template, cfg);
    if (!position) { return; }

    let destPlane = destination;
    if (typeof destPlane !== "string" || destPlane === "Menu Prompt") {
        destPlane = await _getDestination(destinationList);
        if (!destPlane) { return; }
    }

    const planeConfig = _getPlaneConfig(destPlane);
    if (!planeConfig) {
        ui.notifications.warn(`No configuration found for destination: ${destPlane}`);
        return;
    }

    const diameter = (template?.distance) ? (template.distance / canvas.grid.distance) : 20;
    const portalSize = diameter / canvas.grid.distance;
    const [width, height] = [portalSize, portalSize];

    const { portalColor, circleColor, castColor, planeImage, pulseColor, saturation, hue, weather, filter } = planeConfig;

    // TODO: Figure out how to apply weather and filters with Sequencer/Foundry API without FXMaster
    // For now, these are commented out.
    // if (weather) {
    //     sequencer.weather.play(weather.type, weather.options);
    // }
    // if (filter) {
    //     // This applies filter to the scene, need to confirm this is the desired effect
    //     canvas.scene.update({ "filters": { [filter.type]: filter.options } });
    // }

    let seq = new Sequence()
        .effect()
        .name(id)
        .file(closest(`jb2a.magic_signs.circle.02.conjuration.loop.${circleColor}`))
        .atLocation(position)
        .opacity(0.35)
        .size({ width: width, height: height }, { gridUnits: true })
        .fadeIn(5000, { ease: "easeInExpo" })
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 180000 })
        .filter("ColorMatrix", { saturate: saturation })
        .belowTokens()
        .persist()

        .effect()
        .file(closest(`jb2a.sacred_flame.source.${castColor}`))
        .atLocation(position)
        .anchor({ x: 0.5, y: 0.6 })
        .scale(1.2)
        .fadeOut(2000, { ease: "easeInBack" })
        .filter("ColorMatrix", { saturate: saturation })
        .waitUntilFinished(-1500)

        .effect()
        .file(closest(`animated-spell-effects-cartoon.energy.pulse.${pulseColor}`))
        .atLocation(position)
        .opacity(0.6)
        .scale(2)

        .effect()
        .name(id)
        .file(closest(`jb2a.portals.vertical.vortex_masked.${portalColor}`))
        .atLocation(position)
        .persist()
        .anchor({ x: 0.5, y: 0.57 })
        .rotateTowards(token)
        .size({ width: width - 1, height: height - 1 }, { gridUnits: true })
        .animateProperty("sprite", "scale.x", { from: 0, to: 5.25, duration: 750, delay: 100, ease: "easeOutExpo" })
        .animateProperty("sprite", "scale.y", { from: 6, to: 5.25, duration: 50, delay: 100, ease: "easeOutExpo" })
        .filter("ColorMatrix", { hue: hue, saturate: saturation })
        .rotate(90)
        .zIndex(2)

        .effect()
        .name(id)
        .file(closest(`jb2a.wall_of_force.sphere.${portalColor}`))
        .atLocation(position)
        .persist()
        .anchor({ x: 0.5, y: 0.6 })
        .rotateTowards(token)
        .size({ width: width, height: height }, { gridUnits: true })
        .animateProperty("sprite", "scale.x", { from: 0, to: 3, duration: 750, delay: 100, ease: "easeOutExpo" })
        .animateProperty("sprite", "scale.y", { from: 1.5, to: 0.87, duration: 50, delay: 100, ease: "easeOutExpo" })
        .filter("ColorMatrix", { hue: hue, saturate: saturation })
        .rotate(90)
        .zIndex(1)

        .effect()
        .name(id)
        .file(planeImage) // This is an external URL, so no img() helper
        .atLocation(position)
        .persist()
        .anchor({ x: 0.5, y: 0.6 })
        .rotateTowards(token)
        .opacity(1)
        .delay(50)
        .size({ width: width, height: height }, { gridUnits: true })
        .animateProperty("sprite", "scale.x", { from: 0, to: 1.8, duration: 750, delay: 200, ease: "easeOutExpo" })
        .animateProperty("sprite", "scale.y", { from: 1.5, to: 0.75, duration: 50, delay: 200, ease: "easeOutExpo" })
        .rotate(90)
        .zIndex(0);

    return seq;
}

async function play(token, config = {}, options = {}) {
    /*       Don't parse for active effects        *
     * We only care about removing when it expires */
    if (options.type == "aefx") return;
    let seq = await create(token, config);
    if (seq) { await seq.play(); }
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config);
    mConfig.id = `${token.id} - ${mConfig.id}`;
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: id });
    // This stops scene-wide filters, might need a more robust way to handle this
    // For now, assuming we want to clear all filters.
    // canvas.scene.update({ "filters": {} }); 
}

export const gate = {
    create,
    play,
    stop,
};

autoanimations.register("Gate", "template", "eskie.effect.gate", DEFAULT_CONFIG);
autoanimations.register(CONCENTRATING("Gate"), "effect", "eskie.effect.gate", DEFAULT_CONFIG);