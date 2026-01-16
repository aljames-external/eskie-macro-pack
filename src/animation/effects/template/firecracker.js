/**
 * Original Author: EskieMoh#2969
 * Update Author: bakanabaka
 */

import { file } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'firecracker',
    deleteTemplate: true,
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, template } = mConfig;

    let position;
    if (template) {
        position = { x: template.x, y: template.y };    // Decouple from the template so when it is deleted we don't crash
    } else {
        position = await Sequencer.Crosshair.show();
        if (position.cancelled) { return; }
    }
    if (!position) { return; }

    let seq = new Sequence();
    seq = seq
        .effect()
        .name(id)
        .repeats(10, 50, 50)
        .file(file("jb2a.impact.yellow.0"))
        .atLocation(position, { randomOffset: 1 })
        .size(0.8, { gridUnits: true })
        .randomRotation()
        .delay(500);

    seq = seq
        .effect()
        .name(id)
        .repeats(5, 50, 50)
        .file(file("jb2a.impact.yellow.0"))
        .atLocation(position, { randomOffset: 1 })
        //.offset({ x: 100 })
        .size(0.8, { gridUnits: true })
        .randomRotation()
        .delay(1000);

    seq = seq
        .effect()
        .name(id)
        .repeats(5, 50, 50)
        .file(file("jb2a.impact.yellow.0"))
        .atLocation(position, { randomOffset: 1 })
        //.offset({ x: -100 })
        .size(0.8, { gridUnits: true })
        .randomRotation()
        .delay(500);

    seq = seq
        .effect()
        .name(id)
        .file(file("jb2a.particles.outward.orange.02.03"))
        .atLocation(position)
        .duration(5000)
        .fadeOut(1500)
        .scale(0.5)
        .randomRotation()
        .delay(500);

    return seq;
}

async function play(position, config = {}) {
    let seq = await create(position, config);
    if (seq) { await seq.play(); }
}

export const firecracker = {
    create,
    play,
};

autoanimations.register("Firecracker", "template", "eskie.effect.firecracker", DEFAULT_CONFIG);