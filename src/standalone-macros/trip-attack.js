// Standalone Macro: Trip Attack
// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Trip Attack' macro requires the 'Sequencer' module to be installed and active!");
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

const type = "bludgeoning";
const weight = "heavy";
const color = "blue";

const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 2;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

const targetSquare = getNearestSquareCenter(token, target);
const tokenWidth = token.document.width;

const sequence = new Sequence();

sequence
    .effect()
        .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
        .zIndex(1)

    .effect()
        .copySprite(target)
        .attachTo(target, { bindAlpha: false, bindRotation: false, local: false })
        .scaleToObject(0.9, { considerTokenScale: true })
        .zIndex(0.1)
        .belowTokens()
        .filter("ColorMatrix", { brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.65)
        .duration(1200)

    .effect()
        .delay(100)
        .file(closest(`eskie.damage.${type}.01.yellow`))
        .attachTo(target, { bindAlpha: false, bindRotation: false })
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(1)
        .zIndex(1)
        .belowTokens()
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", gridUnits: true })

    .motion(target)
        .rotateTo(90)

    .effect()
        .file(closest("eskie.smoke.03.white"))
        .attachTo(target, { bindAlpha: false, bindRotation: false })
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(0.8)
        .belowTokens();

await sequence.play();

