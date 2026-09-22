// Standalone Macro: Pushing Attack
// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Pushing Attack' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const getNearestSquareCenter = (srcToken, tgtToken) => {
    if (!srcToken || !tgtToken) return null;
    const gs = canvas.grid.size;
    const srcCenter = srcToken.center;
    const w = tgtToken.document.width;
    const h = tgtToken.document.height;
    let bestPoint = null;
    let bestDist2 = Infinity;
    for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < h; gy++) {
            const cx = tgtToken.x + (gx + 0.5) * gs;
            const cy = tgtToken.y + (gy + 0.5) * gs;
            const dx = cx - srcCenter.x;
            const dy = cy - srcCenter.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPoint = { x: cx, y: cy };
            }
        }
    }
    return bestPoint;
};

const tokenPlaceable = token?.object ?? token;
const targetPlaceable = target?.object ?? target;

const pushDistance = 15;
const type = "bludgeoning";
const weight = "heavy";
const color = "blue";

const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 2;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

const targetSquare = getNearestSquareCenter(tokenPlaceable, targetPlaceable);
const tokenCenter = tokenPlaceable.center;
const targetCenter = targetPlaceable.center;
const gridSize = canvas.grid.size;

const dx = targetCenter.x - tokenCenter.x;
const dy = targetCenter.y - tokenCenter.y;
const dist = Math.hypot(dx, dy);

// Calculate destination position pushing AWAY from attacker along vector (dx, dy)
const position = {
    x: targetCenter.x + (dist > 0 ? (dx / dist) * (pushDistance / 5) * gridSize : (pushDistance / 5) * gridSize),
    y: targetCenter.y + (dist > 0 ? (dy / dist) * (pushDistance / 5) * gridSize : 0),
};

const backposition = {
    x: dist > 0 ? (dx / dist) * gridSize * 0.5 : 0,
    y: dist > 0 ? (dy / dist) * gridSize * 0.5 : 0,
};

const tokenWidth = tokenPlaceable.document?.width ?? tokenPlaceable.width ?? 1;

const sequence = new Sequence();

// Attacker thrust motion using Sequencer 4.3.0+ .motion()
sequence.motion(tokenPlaceable)
    .moveBy({ x: -backposition.x, y: -backposition.y }, { duration: 250, ease: 'easeOutExpo' })
    .moveBy({ x: backposition.x, y: backposition.y }, { duration: 200, ease: 'easeInExpo' });

sequence.effect()
    .file(closest("eskie.smoke.02.white"))
    .atLocation({ x: tokenCenter.x - backposition.x, y: tokenCenter.y - backposition.y })
    .rotateTowards(targetPlaceable)
    .size(tokenWidth * 2.15, { gridUnits: true })
    .spriteOffset({ x: -1.5 }, { gridUnits: true })
    .spriteRotation(180)
    .belowTokens()
    .delay(150);

sequence.canvasPan()
    .delay(250)
    .shake({ duration: 250, strength: 2, rotation: false });

sequence.effect()
    .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow`))
    .atLocation(tokenPlaceable)
    .rotateTowards(targetSquare)
    .scaleToObject(effectSize, { considerTokenScale: true })
    .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
    .randomizeMirrorY()
    .zIndex(1)
    .delay(1000);

sequence.effect()
    .file(closest("jb2a.gust_of_wind.veryfast"))
    .atLocation(tokenPlaceable)
    .stretchTo(position, { onlyX: true })
    .opacity(0.75)
    .belowTokens()
    .fadeOut(1000)
    .delay(1500);

sequence.effect()
    .delay(1000)
    .file(closest("eskie.trail.token.generic.01.white"))
    .atLocation(tokenPlaceable)
    .rotateTowards(position)
    .scaleToObject(1.5, { considerTokenScale: true })
    .startTime(750)
    .spriteOffset({ x: -1.25 }, { gridUnits: true });

sequence.wait(1000);

sequence.effect()
    .file(closest(`eskie.damage.${type}.01.yellow`))
    .atLocation(targetPlaceable)
    .size(tokenWidth * 1.5, { gridUnits: true })
    .zIndex(1);

sequence.wait(250);

// Target knockback push using Sequencer 4.3.0+ sequence.motion(targetPlaceable).moveTo() API
sequence.motion(targetPlaceable)
    .moveTo(position, { duration: 500, ease: 'easeOutCirc' });

await sequence.play();

