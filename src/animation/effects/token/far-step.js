/**
 * Original Author: EskieMoh#2969
 * Update Author: bakanabaka
 */

import { file } from '../../../lib/filemanager.js';

const DEFAULT_CONFIG = {
    id: 'farStep',
};

async function create(token, position, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;

    let seq = new Sequence();
    seq = seq
        .effect()
        .name(id)
        .file(file("jb2a.explosion.07.bluewhite"))
        .atLocation(token)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .fadeOut(1000)
        .scale({ x: token.document.width / 4, y: token.document.height / 4 });

    seq = seq
        .animation()
        .on(token)
        .opacity(0);

    seq = seq
        .effect()
        .name(id)
        .file(file("jb2a.energy_strands.range.standard.blue.04"))
        .atLocation(token)
        .stretchTo(position)
        .waitUntilFinished(-2000)
        .playbackRate(1.25);

    seq = seq
        .effect()
        .name(id)
        .file(file("jb2a.explosion.07.bluewhite"))
        .atLocation(position)
        .scale({ x: token.document.width / 4, y: token.document.height / 4 })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .fadeOut(1000)

    seq = seq
        .animation()
        .on(token)
        .teleportTo(position)
        .snapToGrid()
        .offset({ x: -1, y: -1 })
        .waitUntilFinished();

    seq = seq
        .effect()
        .name(`${id}-con`) // Unique name for the persistent condition effect
        .file(file("jb2a.token_border.circle.spinning.blue.001"))
        .scaleIn(0, 1000, { ease: "easeOutElastic" })
        .duration(1000)
        .scaleOut(0, 500, { ease: "easeOutElastic" }) // This scaleOut seems contradictory with persist() but it was in the original, might need review.
        .atLocation(token)
        .attachTo(token, { bindAlpha: false })
        .scaleToObject(2)
        .waitUntilFinished();

    seq = seq
        .animation()
        .on(token)
        .opacity(1)

    return seq;
}

async function play(token, position, config = {}) {
    if (!position) {
        // Sequencer Crosshairs options
        const crosshairOptions = {
            size: token.document.width,
            icon: 'icons/magic/movement/trail-streak-zigzag-teal.webp',
            label: 'Far Step',
            tag: 'Step',
            drawIcon: true,
            drawOutline: true,
            interval: token.document.width % 2 === 0 ? 1 : -1,
            rememberControlled: true,
            lock: token.document // Lock to token movement
        };

        position = await Sequencer.Crosshair.show(crosshairOptions);
        if (position.cancelled) return;
    }

    let seq = await create(token, position, config);
    if (seq) { await seq.play(); }
}

async function stop(token, config = {}) {
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    Sequencer.EffectManager.endEffects({ name: `${id}-con`, object: token }); // Stop the persistent condition effect
}

export const farStep = {
    create,
    play,
    stop,
};