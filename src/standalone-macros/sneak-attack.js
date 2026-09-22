// Standalone Macro: Sneak Attack
// Original Author: .eskie
// Modular Conversion: standalone-macro

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sneak Attack' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please target a token!");
}

const DEFAULT_CONFIG = {
    id: "sneakAttack",
    mode: "auto", // "auto", "melee", or "ranged"
    melee: {
        color: {
            attack: "redblack",
            impact: "red",
            damage: "red",
        },
        type: "slashing",
        weight: "medium",
    },
    ranged: {
        color: {
            attack: "red",
            impact: "red",
            damage: "red",
        }
    }
};

const config = DEFAULT_CONFIG;
const id = config.id ?? "sneakAttack";
const label = `${id}-${token.id}`;
const mode = config.mode ?? "auto";

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

/**
 * Calculates 3D scene distance in units (e.g. feet) between two tokens.
 */
function getDistance(t1, t2) {
    const delegate = game.modules.get("eskie-macros")?.api?.util?.tokens?.getDistance;
    if (delegate) return delegate(t1, t2);

    const p1 = t1.center ?? { x: t1.x, y: t1.y };
    const p2 = t2.center ?? { x: t2.x, y: t2.y };
    const dist2DPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const gridSize = canvas.grid?.size ?? 100;
    const gridDistance = canvas.scene?.grid?.distance ?? 5;
    const dist2DUnits = (dist2DPx / gridSize) * gridDistance;
    const el1 = t1.document?.elevation ?? 0;
    const el2 = t2.document?.elevation ?? 0;
    const elDiff = el1 - el2;
    return Math.ceil(Math.hypot(dist2DUnits, elDiff));
}

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

const tokenWidth = token.document?.width ?? 1;

// Melee attack sizing geometry
const meleeConfig = config.melee ?? {};
const meleeType = meleeConfig.type ?? "slashing";
const meleeWeight = meleeConfig.weight ?? "medium";
const meleeColor = meleeConfig.color ?? {};
const meleeColorAttack = meleeColor.attack ?? "redblack";
const meleeColorImpact = meleeColor.impact ?? "red";
const meleeColorDamage = meleeColor.damage ?? "red";

const weightMap = { light: 0, medium: 1, heavy: 2 };
const weightIndex = weightMap[meleeWeight] ?? 1;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

// Ranged attack styling
const rangedConfig = config.ranged ?? {};
const rangedColor = rangedConfig.color ?? {};
const rangedColorAttack = rangedColor.attack ?? "red";
const rangedColorImpact = rangedColor.impact ?? "red";
const rangedColorDamage = rangedColor.damage ?? "red";

const sequence = new Sequence();

for (const target of targets) {
    const targetSquare = getNearestSquareCenter(token, target);

    // Determine attack style: if auto, pick melee if within reach (<= 8 ft), else ranged
    const dist = getDistance(token, target);
    const useMelee = mode === "melee" || (mode === "auto" && dist <= 8);

    if (useMelee) {
        const srcCenter = token.center ?? { x: token.x, y: token.y };
        const baseRad = Math.atan2(targetSquare.y - srcCenter.y, targetSquare.x - srcCenter.x);
        const lungeX = Math.cos(baseRad) * 0.35;
        const lungeY = Math.sin(baseRad) * 0.35;

        // Sneak attack lunging step via Sequencer 4.3.0+ sequence.motion(token)
        sequence.motion(token)
            .moveBy({ x: lungeX, y: lungeY }, { duration: 80, ease: "easeOutQuad", gridUnits: true })
            .moveBy({ x: -lungeX, y: -lungeY }, { duration: 120, ease: "easeInQuad", gridUnits: true });

        // Vital spot melee strike dagger slash
        sequence.effect()
            .name(label)
            .file(closest(`eskie.attack.melee.generic.01.${meleeType}.${meleeWeight}.${meleeColorAttack}.slow`))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .scaleToObject(effectSize)
            .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
            .randomizeMirrorY()
            .zIndex(1);

        // Vital spot impact flash
        sequence.effect()
            .name(label)
            .delay(150)
            .file(closest(`jb2a.impact.008.${meleeColorImpact}`))
            .size(1.25 * tokenWidth, { gridUnits: true })
            .atLocation(targetSquare)
            .randomRotation()
            .playbackRate(0.9)
            .zIndex(0.1);

        // Blood splatter precision damage flare
        sequence.effect()
            .name(label)
            .delay(150)
            .file(closest(`jb2a.liquid.splash_side.${meleeColorDamage}`))
            .atLocation(targetSquare)
            .size(1.5 * tokenWidth, { gridUnits: true })
            .rotateTowards(token)
            .spriteOffset({ x: -1.15 * tokenWidth }, { gridUnits: true })
            .spriteRotation(180)
            .zIndex(0);
    } else {
        // Vital spot ranged precision strike slice
        sequence.effect()
            .name(label)
            .file(closest(`eskie.slice.01_ranged.black.${rangedColorAttack}`))
            .atLocation(token)
            .stretchTo(target)
            .spriteOffset({ x: tokenWidth / 2 }, { gridUnits: true })
            .zIndex(1);

        // Vital spot impact flash
        sequence.effect()
            .name(label)
            .delay(150)
            .file(closest(`jb2a.impact.008.${rangedColorImpact}`))
            .size(1.25 * tokenWidth, { gridUnits: true })
            .atLocation(target)
            .randomRotation()
            .playbackRate(0.9)
            .zIndex(0.1);

        // Blood splatter precision damage flare
        sequence.effect()
            .name(label)
            .delay(150)
            .file(closest(`jb2a.liquid.splash_side.${rangedColorDamage}`))
            .atLocation(target)
            .size(1.5 * tokenWidth, { gridUnits: true })
            .rotateTowards(token)
            .spriteOffset({ x: -1.15 * tokenWidth }, { gridUnits: true })
            .spriteRotation(180)
            .zIndex(0);
    }
}

await sequence.play();
