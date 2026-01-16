// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { file } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    position: undefined,
};

async function create(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    let sequence = new Sequence();

    // Vortex out
    sequence = sequence.effect()
        .file(file("jb2a.portals.horizontal.vortex.purple"))
        .atLocation(target)
        .scaleToObject(2.5)
        .rotateIn(-360, 500, { ease: "easeOutCubic" })
        .rotateOut(360, 500, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeInOutCirc" })
        .scaleOut(0, 600, { ease: "easeOutCubic" })
        .opacity(1)
        .duration(2000)
        .belowTokens()
        .waitUntilFinished(-500);

    sequence = sequence.effect()
        .copySprite(target)
        .duration(500)
        .scaleOut(0, 500, { ease: "easeInOutElastic" })
        .rotateOut(180, 300, { ease: "easeOutCubic" });
    sequence = sequence.animation()
        .on(target)
        .opacity(0);

    sequence = sequence.animation()
        .on(target)
        .teleportTo(config.position)
        .snapToGrid()
        .offset({ x: -1, y: -1 });

    // Vortex in
    sequence = sequence.effect()
        .file(file("jb2a.portals.horizontal.vortex.purple"))
        .atLocation(config.position)
        .scaleToObject(2.5)
        .rotateIn(-360, 500, { ease: "easeOutCubic" })
        .rotateOut(360, 500, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeInOutCirc" })
        .scaleOut(0, 600, { ease: "easeOutCubic" })
        .opacity(1)
        .duration(2000)
        .waitUntilFinished(-500)
    
    sequence = sequence.effect()
        .copySprite(target)
        .scaleOut(0, 500, { ease: "easeInOutElastic" })
        .rotateIn(180, 300, { ease: "easeOutCubic" })
        .duration(500)
        .waitUntilFinished(-250);

    sequence = sequence.animation()
        .on(target)
        .opacity(1);

    return sequence;
}

async function play(target, config = {}) {
    const mConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { position } = mConfig;
    const crosshairConfig = {
        size: target.w / canvas.grid.size,
        icon: 'icons/magic/air/wind-vortex-swirl-blue.webp',
        label: 'Vortex Warp',
        tag: 'Vortex Warp',
        drawIcon: true,
        drawOutline: true,
        interval: target.document.width % 2 === 0 ? 1 : -1,
    };

    if (!position) {
        mConfig.position = await Sequencer.Crosshair.show(crosshairConfig);
        if (!mConfig.position.x) return;
    }

    const sequence = await create(target, mConfig);
    if (sequence) { return sequence.play(); }
}

export const vortexWarp = {
    create,
    play,
};
