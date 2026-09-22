// Standalone Macro: Hook and Pull
// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka
// Standalone Conversion: Claude

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Hook and Pull' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");
if (target === token) return ui.notifications.warn("You cannot target yourself!");

const label = `HookAndPull-${token.id}`;

// Check if effect sequence is active and toggle off cleanly if running again
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    return;
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the direct string path otherwise.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

/**
 * Finds the adjacent grid center point with the minimal perpendicular distance
 * to the line between two tokens.
 */
function getBestAdjacentLocation(token, target) {
    const p1 = token.center ?? { x: token.x, y: token.y };
    const p2 = target.center ?? { x: target.x, y: target.y };

    const a = p1.y - p2.y;
    const b = p2.x - p1.x;
    const c = p1.x * p2.y - p2.x * p1.y;
    const denominator = Math.sqrt(a * a + b * b);

    const getDistance = (p) => {
        if (denominator === 0) return 0;
        return Math.abs(a * p.x + b * p.y + c) / denominator;
    };

    const grid = canvas.grid;
    const size = grid.size ?? 100;
    const tDoc = token.document;
    const candidates = [];

    for (let i = -1; i <= tDoc.width; i++) {
        for (let j = -1; j <= tDoc.height; j++) {
            if (i >= 0 && i < tDoc.width && j >= 0 && j < tDoc.height) continue;

            const cellX = tDoc.x + (i * size);
            const cellY = tDoc.y + (j * size);
            const center = grid.getCenterPoint ? grid.getCenterPoint({ x: cellX, y: cellY }) : grid.getCenter(cellX, cellY);
            const pos = Array.isArray(center) ? { x: center[0], y: center[1] } : center;
            candidates.push(pos);
        }
    }

    if (candidates.length === 0) return p1;

    let location = candidates[0];
    let minDistance = Infinity;

    for (const cand of candidates) {
        const d = getDistance(cand);
        if (d < minDistance) {
            minDistance = d;
            location = cand;
        } else if (Math.abs(d - minDistance) < 0.1) {
            const distToTargetCurr = Math.hypot(cand.x - p2.x, cand.y - p2.y);
            const distToTargetBest = Math.hypot(location.x - p2.x, location.y - p2.y);
            if (distToTargetCurr < distToTargetBest) {
                location = cand;
            }
        }
    }

    return location;
}

const config = {
    missed: false,
    timingAdjust: -50,
    hook: "eskie.objects.meat_hook.ranged.01.physical.normal.iron",
    latch: "eskie.objects.meat_hook.ranged.01.physical.latch.iron",
};

const missed = config.missed ?? false;
const timingAdjust = config.timingAdjust ?? -50;
const hookAsset = config.hook ?? "eskie.objects.meat_hook.ranged.01.physical.normal.iron";
const latchAsset = config.latch ?? "eskie.objects.meat_hook.ranged.01.physical.latch.iron";

// Determine pull location (best adjacent square to the caster along the line to the target)
const location = getBestAdjacentLocation(token, target);

const sequence = new Sequence();

// Effect if missed
sequence.effect()
    .name(label)
    .file(closest(hookAsset))
    .attachTo(token)
    .stretchTo(target)
    .zIndex(1)
    .waitUntilFinished(-750)
    .playIf(missed);

// Effect if hit
sequence.effect()
    .name(label)
    .file(closest(latchAsset))
    .attachTo(token)
    .stretchTo(target)
    .zIndex(1)
    .waitUntilFinished(-750)
    .playIf(!missed);

// Pull target toward location via Sequencer 4.3.0+ motion API
sequence.motion(target)
    .moveTo(location, { relativeToCenter: true, duration: 500, delay: 101 + timingAdjust, ease: "easeInCubic" })
    .playIf(!missed);

await sequence.play();
