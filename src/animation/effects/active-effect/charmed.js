/**
 * Original Author: EskieMoh#2969
 * Update Author: bakanabaka
 */

import { closest } from '../../../lib/filemanager.js';
import { autoanimations } from '../../../integration/autoanimations.js';

const DEFAULT_CONFIG = {
    id: 'charmed',
};

function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    const label = `${id}-${token.id}`;

    let seq = new Sequence();
    seq.effect()
        .file(closest("jb2a.template_circle.symbol.out_flow.heart.pink"))
        .scaleIn(0, 1000, { ease: "easeOutQuint" })
        .fadeOut(2000)
        .atLocation(token)
        .belowTokens()
        .duration(3000)
        .scaleToObject(3);

    seq.effect()
        .file(closest("jb2a.icon.heart.pink"))
        .atLocation(token)
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .fadeOut(1000)
        .scaleToObject(1)
        .duration(2000)
        .attachTo(token)
        .playbackRate(1);

    seq.effect()
        .file(closest("jb2a.icon.heart.pink"))
        .atLocation(token)
        .scaleToObject(3)
        .anchor({ y: 0.45 })
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .fadeOut(1000)
        .duration(1000)
        .attachTo(token)
        .playbackRate(1)
        .opacity(0.5);

    seq.effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .scaleToObject(2);

    seq.effect()
        .name(label)
        .file(closest("jb2a.markers.heart.pink.03"))
        .atLocation(token)
        .scaleToObject(2)
        .delay(500)
        .center()
        .fadeIn(1000)
        .playbackRate(1)
        .attachTo(token)
        .persist();

    return seq;
}

async function play(token, config = {}) {
    let seq = await create(token, config);
    if (seq) await seq.play();
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const { id } = mConfig;
    const label = `${id}-${token.id}`;

    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const charmed = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autoanimations.register("Charmed", "effect", "eskie.effect.charmed", DEFAULT_CONFIG);
