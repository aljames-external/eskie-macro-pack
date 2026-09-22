// Standalone Macro: Ray of Sickness
// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Ray of Sickness' macro requires the 'Sequencer' module to be installed and active!");
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

const targetSquare = getNearestSquareCenter(token, target);
const targetCenter = target.center;
const targetOffset = { x: targetSquare.x - targetCenter.x, y: targetSquare.y - targetCenter.y };
const targetWidth = target.document.width;

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("eskie.velocity.01.white"))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(2, { considerTokenScale: true })
        .zIndex(3)
        .opacity(0.25)
        .spriteOffset({ x: -1 }, { gridUnits: true })
        .tint("#98d723")

    .effect()
        .file(closest("jb2a.eldritch_blast.green"))
        .atLocation(token)
        .stretchTo(targetSquare, { offset: { x: -0.25 }, gridUnits: true, local: true })
        .scale(0.5)
        .startTime(1000)
        .spriteOffset({ x: 0.25 }, { gridUnits: true })
        .filter("ColorMatrix", { hue: -12 })
        .zIndex(1)
        .waitUntilFinished(-3000)

    .motion(target)
        .noise({ strength: 0.05, frequency: 50, duration: 1000, gridUnits: true })

    .effect()
        .file(closest("eskie.texture_mask.ink.01.black"))
        .attachTo(target, { offset: targetOffset })
        .scaleToObject(((2 * targetWidth) - 1) / targetWidth, { considerTokenScale: true })
        .playbackRate(1.5)
        .mask(target)
        .opacity(0.5)
        .startTime(1000)

    .effect()
        .file(closest("eskie.smoke.05.green"))
        .atLocation(targetSquare, { offset: { x: 0, y: 0 }, gridUnits: true, local: false })
        .rotateTowards(token)
        .scaleIn(0, 750, { ease: "easeOutCubic" })
        .spriteAnchor({ x: 0.5, y: 1 })
        .spriteOffset({ x: -0.5 }, { gridUnits: true })
        .spriteScale({ x: 1, y: 1.25 }, { gridUnits: true })
        .spriteRotation(90)
        .fadeOut(500)
        .duration(750)
        .scaleToObject(1, { considerTokenScale: true })
        .mirrorY()
        .opacity(0.5)

    .effect()
        .file(closest("eskie.smoke.05.green"))
        .atLocation(targetSquare, { offset: { x: 0, y: 0 }, gridUnits: true, local: false })
        .rotateTowards(token)
        .scaleIn(0, 750, { ease: "easeOutCubic" })
        .spriteAnchor({ x: 0.5, y: 1 })
        .spriteOffset({ x: -0.5 }, { gridUnits: true })
        .spriteRotation(-45)
        .fadeOut(500)
        .duration(750)
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.5)

    .effect()
        .file(closest("eskie.smoke.05.green"))
        .atLocation(targetSquare, { offset: { x: 0, y: 0 }, gridUnits: true, local: false })
        .rotateTowards(token)
        .scaleIn(0, 750, { ease: "easeOutCubic" })
        .spriteAnchor({ x: 0.5, y: 1 })
        .spriteOffset({ x: -0.5 }, { gridUnits: true })
        .spriteRotation(-135)
        .fadeOut(500)
        .duration(750)
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.5)

    .effect()
        .file(closest("eskie.poison.01.green.full"))
        .attachTo(target, { offset: targetOffset })
        .size(0.65, { gridUnits: true })
        .mask(target)
        .zIndex(0)

    .effect()
        .file(closest("eskie.damage.poison.01.green"))
        .atLocation(targetSquare)
        .size(1.75, { gridUnits: true })
        .zIndex(1);

await sequence.play();
