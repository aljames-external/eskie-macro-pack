// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';

const DEFAULT_CONFIG = {
    id: 'MistyStep',
    size: 1, // Default size for crosshair, will be updated by token.document.width
    icon: 'icons/magic/movement/trail-streak-impact-blue.webp',
    label: 'Misty Step',
    tag: 'Misty Step',
    drawIcon: true,
    drawOutline: true,
    interval: -1, // Default, will be updated by token.document.width
    rememberControlled: true,
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id, size, icon, label, tag, drawIcon, drawOutline, interval, rememberControlled } = mConfig;

    const crosshairConfig = {
        size: token.document.width,
        icon: icon,
        label: label,
        tag: tag,
        drawIcon: drawIcon,
        drawOutline: drawOutline,
        interval: token.document.width % 2 === 0 ? 1 : -1,
        rememberControlled: rememberControlled,
    };

    let position = await Sequencer.Crosshair.show(crosshairConfig);

    if (!position.cancelled) {
        let sequence = new Sequence()
            .animation()
                .delay(800)
                .on(token)
                .fadeOut(200)

            .effect()
                .file(closest("jb2a.misty_step.01.blue"))
                .atLocation(token)
                .scaleToObject(2)
                .waitUntilFinished(-2000)

            .animation()
                .on(token)
                .teleportTo(position)
                .snapToGrid()
                .offset({ x: -1, y: -1 })
                .waitUntilFinished(200)

            .effect()
                .file(closest("jb2a.misty_step.02.blue"))
                .atLocation(token)
                .scaleToObject(2)

            .animation()
                .delay(1400)
                .on(token)
                .fadeIn(200);

        return sequence;
    }
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) {  sequence.play(); }
}

function stop(token, config = {}) {
    // Sequencer effects are generally transient for teleportation, no persistent effect to stop
}

export const mistyStep = {
    create,
    play,
    stop,
};
