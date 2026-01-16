// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { autoanimations } from "../../../integration/autoanimations.js";

const DEFAULT_CONFIG = {
    id: 'FireShield',
};

async function create(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} - ${token.id}`;

    const sequence = new Sequence();
    sequence.effect()
        .file(closest("jb2a.impact.ground_crack.orange.01"))
        .atLocation(token)
        .belowTokens()
        .scaleToObject(3);

    sequence.effect()
        .file(closest("jb2a.particles.outward.orange.01.03"))
        .atLocation(token)
        .delay(200)
        .scaleIn(0.5, 250)
        .fadeOut(3000)
        .duration(15000)
        .scaleToObject(2.75)
        .playbackRate(1)
        .zIndex(2)
        .name(label);

    sequence.effect()
        .file(closest("jb2a.energy_strands.in.yellow.01.2"))
        .atLocation(token)
        .delay(200)
        .scaleIn(0.5, 250)
        .duration(2000)
        .belowTokens()
        .scaleToObject(2.75)
        .playbackRate(1)
        .zIndex(1)
        .name(label);

    sequence.effect()
        .file(closest("jb2a.token_border.circle.spinning.orange.004"))
        .atLocation(token)
        .scaleToObject(2.2)
        .playbackRate(1)
        .attachTo(token)
        .persist()
        .name(label);

    sequence.effect()
        .file(closest("jb2a.shield_themed.below.fire.03.orange"))
        .atLocation(token)
        .delay(1000)
        .persist()
        .fadeIn(500)
        .attachTo(token)
        .fadeOut(200)
        .belowTokens()
        .scaleToObject(1.7)
        .playbackRate(1)
        .name(label);

    sequence.effect()
        .file(closest("jb2a.shield_themed.above.fire.03.orange"))
        .atLocation(token)
        .persist()
        .fadeIn(3500)
        .attachTo(token)
        .fadeOut(200)
        .scaleToObject(1.7)
        .zIndex(0)
        .playbackRate(1)
        .name(label);

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) {
        sequence.play();
    }
}

function stop(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = `${id} - ${token.id}`;
    Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const fireShield = {
    create,
    play,
    stop,
};

autoanimations.register("Fire Shield", "effect", "eskie.effect.fireShield", DEFAULT_CONFIG);