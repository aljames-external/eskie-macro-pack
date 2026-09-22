// Standalone Macro: Rapid Strike
// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Rapid Strike' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please target a token!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

/**
 * Finds the center of the grid square on a target token that is nearest to a source token.
 */
function getNearestSquareCenter(token, target) {
    const delegate = game.modules.get("eskie-macros")?.api?.util?.tokens?.getNearestSquareCenter;
    if (delegate) return delegate(token, target);

    const gs = canvas.grid?.size ?? 100;
    const srcCenter = token.center ?? { x: token.x, y: token.y };
    const w = target.document?.width ?? 1;
    const h = target.document?.height ?? 1;

    let bestPoint = null;
    let bestDist2 = Infinity;

    for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < h; gy++) {
            const cx = target.x + (gx + 0.5) * gs;
            const cy = target.y + (gy + 0.5) * gs;
            const dx = cx - srcCenter.x;
            const dy = cy - srcCenter.y;
            const d2 = dx * dx + dy * dy;

            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPoint = { x: cx, y: cy };
            }
        }
    }

    return bestPoint ?? (target.center ?? { x: target.x, y: target.y });
}

const DEFAULT_CONFIG = {
    id: "Rapid Strike",
    type: "slashing",   // Set Attack type (slashing, piercing, bludgeoning)
    weight: "heavy",    // Set Attack Weight (light, medium, or heavy)
    color: "red",       // Set Attack Color
    attacks: 12,        // Set Attack Number
    sound: {
        enable: true,
        volume: 0.5
    }
};

const config = DEFAULT_CONFIG;
const { type, weight, color, attacks, sound } = config;
const id = config.id ?? "Rapid Strike";
const label = `${id}-${token.id}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: label, object: target });
    }
    return;
}

// Determine Attack Size & Offset
const weightMap = { light: 0, medium: 1, heavy: 2 };
const weightIndex = weightMap[weight] ?? 2;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);
const tokenWidth = token.document?.width ?? 1;

function createAttackAnimation(token, target, targetSquare) {
    const targetWidth = target.document?.width ?? 1;
    const srcCenter = token.center ?? { x: token.x, y: token.y };
    const baseRad = Math.atan2(targetSquare.y - srcCenter.y, targetSquare.x - srcCenter.x);
    const slashX = Math.cos(baseRad) * 0.35;
    const slashY = Math.sin(baseRad) * 0.35;

    const seq = new Sequence();

    if (sound?.enable ?? sound?.enabled ?? true) {
        seq.sound()
            .file(closest(`psfx.impacts.${type}`))
            .volume(sound?.volume ?? 0.5);
    }

    seq.motion(token)
        .moveBy({ x: slashX, y: slashY }, { duration: 80, ease: "easeOutQuad", gridUnits: true })
        .moveBy({ x: -slashX, y: -slashY }, { duration: 120, ease: "easeInQuad", gridUnits: true });

    seq.effect()
        .name(label)
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow`))
        .atLocation(token)
        .rotateTowards(targetSquare, { randomOffset: 0.25 })
        .scaleToObject(effectSize)
        .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
        .randomizeMirrorY()
        .fadeOut(750, { ease: "easeOutQuint" })
        .zIndex(1)

    .effect()
        .name(label)
        .delay(150)
        .file(closest("jb2a.impact.003.yellow"))
        .size(1.75 * targetWidth, { gridUnits: true })
        .atLocation(targetSquare)
        .randomRotation()
        .playbackRate(1)
        .spriteScale({ x: 1, y: 1 }, { gridUnits: true })
        .zIndex(0.1)

    .effect()
        .name(label)
        .delay(150)
        .file(closest(`jb2a.impact.008.${color}`))
        .size(0.75 * targetWidth, { gridUnits: true })
        .atLocation(targetSquare)
        .randomRotation()
        .playbackRate(1.25)
        .zIndex(0.1)

    .effect()
        .name(label)
        .delay(150)
        .file(closest(`eskie.slice.01.color.${color}`))
        .size(1.25 * targetWidth, { gridUnits: true })
        .atLocation(targetSquare)
        .randomRotation()
        .playbackRate(1)
        .spriteScale({ x: 4, y: 1 }, { gridUnits: true })
        .zIndex(0.15)

    .effect()
        .name(label)
        .delay(150)
        .file(closest("eskie.slice.01.black.colorless"))
        .size(1.25 * targetWidth, { gridUnits: true })
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

const mainSeq = new Sequence();

for (const target of targets) {
    const targetSquare = getNearestSquareCenter(token, target);
    const attackCount = attacks ?? 12;
    for (let i = 1; i <= attackCount; i++) {
        mainSeq.addSequence(createAttackAnimation(token, target, targetSquare));
    }
}

await mainSeq.play();
