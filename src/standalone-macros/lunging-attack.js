// Standalone Macro: Lunging Attack
// Original Author: .eskie
// Modular Conversion & .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Lunging Attack' macro requires the 'Sequencer' module to be installed and active!");
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

const type = "slashing";
const weight = "medium";
const color = "blue";
const tint = "#01aafe";

const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 1;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

const targetSquare = getNearestSquareCenter(token, target);

const src = token.center;
const tgt = target.center;

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

// Dynamic motion shadow under lunging token
sequence.effect()
    .copySprite(token)
    .attachTo(token)
    .scaleToObject(0.9, { considerTokenScale: true })
    .belowTokens()
    .filter("ColorMatrix", { brightness: 0 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .opacity(0.65)
    .fadeOut(500)
    .duration(1500);

// Battlemaster lunging attack motion toward target via Sequencer 4.3.0+ sequence.motion(token)
const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x) * (180 / Math.PI) + 90;
sequence.motion(token)
    .rotateTo(angle, { duration: 300 })
    .moveTo(targetSquare, {
        duration: 1500,
        ease: "easeOutCubic"
    });

sequence.wait(400);

sequence.effect()
    .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.02`))
    .atLocation(token)
    .rotateTowards(targetSquare)
    .scaleToObject(effectSize, { considerTokenScale: true })
    .spriteOffset({ x: effectOffset * tokenWidth + 0.75 }, { gridUnits: true })
    .mirrorY(src.x >= tgt.x)
    .zIndex(2);

sequence.effect()
    .delay(150)
    .file(closest(`eskie.damage.${type}.01.yellow`))
    .size(1.25 * tokenWidth, { gridUnits: true })
    .atLocation(targetSquare)
    .randomRotation()
    .zIndex(0.1);

sequence.effect()
    .delay(150)
    .copySprite(target)
    .attachTo(target)
    .scaleToObject(1, { considerTokenScale: true })
    .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
    .opacity(0.25)
    .duration(1000)
    .fadeOut(750);

await sequence.play();

