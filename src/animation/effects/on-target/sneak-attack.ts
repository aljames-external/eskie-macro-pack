import { adapter } from '../../../adapters/index.js';
import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG_MELEE = {
    id: "sneakAttackMelee",
    color: {
        attack: "redblack",
        impact: "red",
        damage: "red",
    },
    type: "slashing",
    weight: "medium",
    sound: {
        attack: { ...DEFAULT_SOUND_CONFIG },
        impact: { ...DEFAULT_SOUND_CONFIG }
    }
};

async function createMelee(token: Token, target: Token, config: any = {}) {
    if (!token || !target) return null;
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG_MELEE, config);
    const { id, color, type, weight, sound } = mConfig;

    //Determine Attack Size
    const weightIndex = ({ light: 0, medium: 1, heavy: 2 } as Record<string, number>)[weight] ?? 1;

    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    //Determine nearest targetSquare
    const targetSquare = adapter.getNearestSquareCenter(token, target);
    if (!targetSquare) return null;
    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    const tokenCenter = adapter.getCenter(token);
    const baseRad = Math.atan2(targetSquare.y - tokenCenter.y, targetSquare.x - tokenCenter.x);
    const lungeX = Math.cos(baseRad) * 0.35;
    const lungeY = Math.sin(baseRad) * 0.35;

    let seq = new Sequence();
    applySound(seq, sound.attack);
    applySound(seq, sound.impact, 150);

    // Sneak attack lunging step via Sequencer 4.3.0+ sequence.motion(token)
    seq.motion(token)
        .moveBy({ x: lungeX, y: lungeY }, { duration: 80, ease: "easeOutQuad", gridUnits: true })
        .moveBy({ x: -lungeX, y: -lungeY }, { duration: 120, ease: "easeInQuad", gridUnits: true });

    seq = seq

        .effect()
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color.attack}.slow`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize)
        .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
        .randomizeMirrorY()
        .zIndex(1)

        .effect()
        .delay(150)
        .file(closest(`jb2a.impact.008.${color.impact}`))
        .size(1.25 * tokenWidth, { gridUnits: true })
        .atLocation(targetSquare)
        .randomRotation()
        .playbackRate(0.9)
        .zIndex(0.1)

        .effect()
        .delay(150)
        .file(closest(`jb2a.liquid.splash_side.${color.damage}`))
        .atLocation(targetSquare)
        .size(1.5 * tokenWidth, { gridUnits: true })
        .rotateTowards(token)
        .spriteOffset({ x: -1.15 * tokenWidth }, { gridUnits: true })
        .spriteRotation(180)
        .zIndex(0);

    return seq;
}

async function playMelee(token: Token, target: Token, config: any = {}) {
    const seq = await createMelee(token, target, config);
    if (seq) { return seq.play(); }
    return null;
}

function stop() {
    // Transient animation
}

const melee = {
    create: createMelee,
    play: playMelee,
    stop,
};

const DEFAULT_CONFIG_RANGED = {
    id: "sneakAttackRanged",
    color: {
        attack: "red",
        impact: "red",
        damage: "red",
    },
    sound: {
        attack: { ...DEFAULT_SOUND_CONFIG },
        impact: { ...DEFAULT_SOUND_CONFIG }
    }
};

function createRanged(token: Token, target: Token, config: any = {}) {
    if (!token || !target) return null;
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG_RANGED, config);
    const { id, color, sound } = mConfig;
    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    let seq = new Sequence();
    applySound(seq, sound.attack);
    applySound(seq, sound.impact, 150);
    seq = seq
        .effect()
        .file(closest(`eskie.slice.01_ranged.black.${color.attack}`))
        .atLocation(token)
        .stretchTo(target)
        .spriteOffset({ x: tokenWidth / 2 }, { gridUnits: true })
        .zIndex(1)

        .effect()
        .delay(150)
        .file(closest(`jb2a.impact.008.${color.impact}`))
        .size(1.25 * tokenWidth, { gridUnits: true })
        .atLocation(target)
        .randomRotation()
        .playbackRate(0.9)
        .zIndex(0.1)

        .effect()
        .delay(150)
        .file(closest(`jb2a.liquid.splash_side.${color.damage}`))
        .atLocation(target)
        .size(1.5 * tokenWidth, { gridUnits: true })
        .rotateTowards(token)
        .spriteOffset({ x: -1.15 * tokenWidth }, { gridUnits: true })
        .spriteRotation(180)
        .zIndex(0);

    return seq;
}

async function playRanged(token: Token, target: Token, config: any = {}) {
    const seq = await createRanged(token, target, config);
    if (seq) { return seq.play(); }
    return null;
}

const ranged = {
    create: createRanged,
    play: playRanged,
    stop,
};

const DEFAULT_CONFIG = {
    melee: DEFAULT_CONFIG_MELEE,
    ranged: DEFAULT_CONFIG_RANGED,
};

export const sneakAttack = {
    melee,
    ranged,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register(adapter.autorec.MELEE("sneakAttack", "Sneak Attack"), "melee-target", "eskie.effect.sneakAttack.melee", DEFAULT_CONFIG_MELEE, "1.0.2", "(Melee) Sneak Attack");
adapter.autorec.register(adapter.autorec.RANGED("sneakAttack", "Sneak Attack"), "ranged-target", "eskie.effect.sneakAttack.ranged", DEFAULT_CONFIG_RANGED, "1.0.2", "(Ranged) Sneak Attack");