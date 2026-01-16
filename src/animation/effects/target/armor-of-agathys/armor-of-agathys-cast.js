// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'Armor of Agathys',
};

async function create(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let sequence = new Sequence();

    sequence = sequence.effect()
        .file(closest("jb2a.ward.rune.dark_purple.01"))
        .atLocation(token)
        .scaleToObject(1.85)
        .belowTokens()
        .fadeOut(3000)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { brightness: 2, saturate: -0.75, hue: -75 });

    sequence = sequence.effect()
        .attachTo(token)
        .delay(250)
        .file(closest("jb2a.magic_signs.rune.02.complete.06.blue"))
        .scaleToObject(0.75 * token.document.texture.scaleX)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .playbackRate(2.5)
        .opacity(1)
        .zIndex(3);

    sequence = sequence.effect()
        .attachTo(token)
        .file(closest("jb2a.extras.tmfx.border.circle.inpulse.01.fast"))
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(1)
        .zIndex(3);

    sequence = sequence.effect()
        .attachTo(token)
        .name(`${token.name} Armor of Agathys`)
        .file(closest("jb2a.extras.tmfx.inflow.circle.01"))
        .scaleToObject(1 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .opacity(0.9)
        .zIndex(2)
        .extraEndDuration(1500)
        .private()
        .persist();

    sequence = sequence.effect()
        .attachTo(token)
        .name(`${token.name} Armor of Agathys`)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .scaleToObject(1.35 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .belowTokens()
        .opacity(0.9)
        .extraEndDuration(1500)
        .zIndex(1)
        .private()
        .persist();

    sequence = sequence.effect()
        .attachTo(token)
        .name(`${token.name} Armor of Agathys`)
        .file(closest("jb2a.template_circle.symbol.normal.snowflake.blue"))
        .scaleToObject(1.35 * token.document.texture.scaleX)
        .randomRotation()
        .fadeIn(1500)
        .fadeOut(500)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .belowTokens()
        .opacity(0.75)
        .extraEndDuration(1500)
        .zIndex(2)
        .private()
        .persist();

    sequence = sequence.effect()
        .attachTo(token)
        .name(`${token.name} Armor of Agathys`)
        .file(closest("jb2a.shield.01.loop.blue"))
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(0.75)
        .fadeIn(1500)
        .fadeOut(500)
        .zIndex(1)
        .persist();

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) { return sequence.play(); }
}

async function stop(token, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mConfig;
    let sequence = new Sequence()
        .effect()
        .attachTo(token)
        .file(closest("jb2a.shield.01.outro_explode.blue"))
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(0.75)
        .fadeOut(500)
        .zIndex(1)
        .thenDo(function () {
            Sequencer.EffectManager.endEffects({ name: `${token.name} ${id}`, object: token });
        });

    await sequence.play();
}

export const armorOfAgathysCast = {
    create,
    play,
    stop,
};
