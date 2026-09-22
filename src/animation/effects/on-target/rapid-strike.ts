// Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

import { adapter } from '../../../adapters/index.js';
import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from "../../../lib/settings.js";
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: "Rapid Strike",
    type: "slashing",   //Set Attack type (slashing, piercing, bludgeoning)
    weight: "heavy",    //Set Attack Weight (light,medium, or heavy)
    color: "red",   //Set Attack Color
    attacks: 12,     //Set Attack Number
    sound: {
        ...DEFAULT_SOUND_CONFIG,
        enable: true,
        volume: 0.5,
        file: 'psfx.impacts.slashing'
    }
};

async function create(token: Token, target: Token, config: Record<string, any> = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { type, weight, color, attacks, sound } = mConfig;

    if (!token || !target) return null;

    //Determine Attack Size
    const weightIndex = ({ light: 0, medium: 1, heavy: 2 } as Record<string, number>)[weight] ?? 2;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);
    const targetSquare = adapter.getNearestSquareCenter(token, target);
    if (!targetSquare) return null;
    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    const tokenCenter = adapter.getCenter(token);
    const baseRad = Math.atan2(targetSquare.y - tokenCenter.y, targetSquare.x - tokenCenter.x);
    const slashX = Math.cos(baseRad) * 0.35;
    const slashY = Math.sin(baseRad) * 0.35;

    function attackAnimation(token: Token, target: Token, config: Record<string, any>) {
        const seq = new Sequence();
        applySound(seq, { ...sound, file: sound.file ?? `psfx.impacts.${type}` });

        seq.motion(token)
            .moveBy({ x: slashX, y: slashY }, { duration: 80, ease: "easeOutQuad", gridUnits: true })
            .moveBy({ x: -slashX, y: -slashY }, { duration: 120, ease: "easeInQuad", gridUnits: true });

        seq.effect()
            .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow`))
            .atLocation(token)
            .rotateTowards(targetSquare, { randomOffset: 0.25 })
            .scaleToObject(effectSize)
            .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
            .randomizeMirrorY()
            .fadeOut(750, { ease: "easeOutQuint" })
            .zIndex(1)

        .effect()
            .delay(150)
            .file(closest("jb2a.impact.003.yellow"))
            .size(1.75 * tokenWidth, { gridUnits: true })
            .atLocation(targetSquare)
            .randomRotation()
            .playbackRate(1)
            .spriteScale({ x: 1, y: 1 }, { gridUnits: true })
            .zIndex(0.1)

        .effect()
            .delay(150)
            .file(closest(`jb2a.impact.008.${color}`))
            .size(0.75 * tokenWidth, { gridUnits: true })
            .atLocation(targetSquare)
            .randomRotation()
            .playbackRate(1.25)
            .zIndex(0.1)

        .effect()
            .delay(150)
            .file(closest(`eskie.slice.01.color.${color}`))
            .size(1.25 * tokenWidth, { gridUnits: true })
            .atLocation(targetSquare)
            .randomRotation()
            .playbackRate(1)
            .spriteScale({ x: 4, y: 1 }, { gridUnits: true })
            .zIndex(0.15)

        .effect()
            .delay(150)
            .file(closest("eskie.slice.01.black.colorless"))
            .size(1.25 * tokenWidth, { gridUnits: true })
            .atLocation(targetSquare)
            .randomRotation()
            .playbackRate(1)
            .spriteScale({ x: 16, y: 1 }, { gridUnits: true })
            .belowTokens()
            .opacity(0.15)
            .zIndex(0.15)

        .wait(150);

        return seq;
    }

    const seq = new Sequence();
    for (let i = 1; i <= attacks; i++) {
        seq.addSequence(attackAnimation(token, target, config));
    }

    return seq;
}

async function play(token: Token, target: Token, config: Record<string, any> = {}) {
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
    return null;
}

function stop() {
    // Transient animation
}

export const rapidStrike = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("rapidStrike", "melee-target", "eskie.effect.rapidStrike", DEFAULT_CONFIG, "0.0.2", "Rapid Strike");