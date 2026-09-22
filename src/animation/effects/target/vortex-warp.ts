// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    position: undefined,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(target: Token, config: Record<string, any> = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    let sequence = new Sequence();
    applySound(sequence, mConfig.sound);

    // Vortex out
    sequence = sequence.effect()
        .file(closest("jb2a.portals.horizontal.vortex.purple"))
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

    sequence = sequence.motion(target)
        .moveTo(mConfig.position);

    // Vortex in
    sequence = sequence.effect()
        .file(closest("jb2a.portals.horizontal.vortex.purple"))
        .atLocation(mConfig.position)
        .scaleToObject(2.5)
        .rotateIn(-360, 500, { ease: "easeOutCubic" })
        .rotateOut(360, 500, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeInOutCirc" })
        .scaleOut(0, 600, { ease: "easeOutCubic" })
        .opacity(1)
        .duration(2000)
        .waitUntilFinished(-500);

    return sequence;
}

async function play(target: Token, config: Record<string, any> = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { position } = mConfig;
    const { widthUnits: targetWidth } = adapter.getTokenDimensions(target);
    const crosshairConfig = {
        size: targetWidth,
        icon: 'icons/magic/air/wind-vortex-swirl-blue.webp',
        label: 'Vortex Warp',
        tag: 'Vortex Warp',
        drawIcon: true,
        drawOutline: true,
        interval: targetWidth % 2 === 0 ? 1 : -1,
    };

    if (!position) {
        mConfig.position = await Sequencer.Crosshair.show(crosshairConfig);
        if (!mConfig.position?.x) return;
    }

    const sequence = await create(target, mConfig);
    if (sequence) { return sequence.play(); }
}

function stop() {
    // Transient animation
}

export const vortexWarp = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

