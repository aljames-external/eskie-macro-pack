// Standalone Macro: Wails from the Grave
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const targets = Array.from(game.user.targets);
if (targets.length < 1) return ui.notifications.warn('Please target at least 1 token (Primary target)!');

const target1 = targets[0];
const target2 = targets[1];

const type = 'slashing';
const weight = 'medium';

const randomOffset = [];
const minDistance = 0.1 * (target2 ?? target1).document.width;

for (let i = 0; i < 3; i++) {
    let valid = false;
    let offset;
    while (!valid) {
        offset = {
            x: (Math.random() * 0.5 - 0.25) * (target2 ?? target1).document.width,
            y: (Math.random() * 0.5 - 0.25) * (target2 ?? target1).document.width
        };
        valid = randomOffset.every(existing => {
            const dx = offset.x - existing.x;
            const dy = offset.y - existing.y;
            return Math.hypot(dx, dy) >= minDistance;
        });
    }
    randomOffset.push(offset);
}

const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 1;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

function getNearestSquareCenter(token, target) {
    const gs = canvas.grid.size;
    const srcCenter = token.center;
    const w = target.document.width;
    const h = target.document.height;
    let bestPoint = null;
    let bestDist2 = Infinity;
    for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < h; gy++) {
            const cx = target.document.x + (gx + 0.5) * gs;
            const cy = target.document.y + (gy + 0.5) * gs;
            const dx = cx - srcCenter.x;
            const dy = cy - srcCenter.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPoint = { x: cx, y: cy };
            }
        }
    }
    return bestPoint ?? target.center;
}

const targetSquare = getNearestSquareCenter(token, target1);
const dx = targetSquare.x - token.center.x;
const dy = targetSquare.y - token.center.y;
const sx = Math.sign(dx);
const sy = Math.sign(dy);
const targetOffset = { x: sx * 0.5, y: sy * 0.5 };

new Sequence()
    .effect()
    .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.purpleblack.slow`))
    .atLocation(token)
    .rotateTowards(targetSquare)
    .scaleToObject(effectSize, { considerTokenScale: true })
    .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
    .randomizeMirrorY()
    .zIndex(1)
    .filter('ColorMatrix', { hue: -130 })
    .effect()
    .delay(150)
    .file(closest(`eskie.damage.${type}.01.yellow`))
    .size(1.25 * token.document.width, { gridUnits: true })
    .atLocation(targetSquare)
    .randomRotation()
    .playbackRate(0.9)
    .zIndex(0.1)
    .filter('ColorMatrix', { hue: 120 })
    .effect()
    .delay(150)
    .file(closest('jb2a.smoke.puff.side.dark_black.4'))
    .atLocation(targetSquare)
    .size(1.5 * token.document.width, { gridUnits: true })
    .rotateTowards(token)
    .spriteOffset({ x: -1.15 * token.document.width }, { gridUnits: true })
    .spriteRotation(180)
    .fadeOut(1500)
    .zIndex(0)
    .effect()
    .delay(150)
    .copySprite(target1)
    .spriteRotation(-target1.document.rotation)
    .attachTo(target1)
    .scaleToObject(1, { considerTokenScale: true })
    .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
    .opacity(0.25)
    .duration(1000)
    .fadeOut(750)
    .tint('#58feb0')
    .wait(150)
    .effect()
    .file(closest('eskie.environment.wisp.01.teal'))
    .atLocation(targetSquare, { offset: randomOffset[0], gridUnits: true })
    .size(0.5, { gridUnits: true })
    .spriteOffset({ x: targetOffset.x / 2, y: targetOffset.y / 2 }, { gridUnits: true })
    .fadeIn(1500, { ease: 'easeOutCubic' })
    .scaleIn(0, 1500, { ease: 'easeOutCubic' })
    .animateProperty('sprite', 'position.x', { from: -targetOffset.x / 2, to: 0, duration: 2000, gridUnits: true, ease: 'easeOutCubic' })
    .animateProperty('sprite', 'position.y', { from: -targetOffset.y / 2, to: 0, duration: 2000, gridUnits: true, ease: 'easeOutCubic' })
    .zIndex(2)
    .effect()
    .delay(1800)
    .file(closest('jb2a.impact.010.blue'))
    .atLocation(targetSquare, { offset: randomOffset[0], gridUnits: true })
    .size(0.5, { gridUnits: true })
    .spriteOffset({ x: targetOffset.x / 2, y: targetOffset.y / 2 }, { gridUnits: true })
    .filter('ColorMatrix', { hue: -50 })
    .zIndex(3)
    .effect()
    .file(closest('eskie.environment.wisp.01.teal'))
    .atLocation(targetSquare, { offset: randomOffset[1], gridUnits: true })
    .size(0.5, { gridUnits: true })
    .spriteOffset({ x: targetOffset.x / 2, y: targetOffset.y / 2 }, { gridUnits: true })
    .fadeIn(1500, { ease: 'easeOutCubic' })
    .scaleIn(0, 1500, { ease: 'easeOutCubic' })
    .animateProperty('sprite', 'position.x', { from: -targetOffset.x / 2, to: 0, duration: 2000, gridUnits: true, ease: 'easeOutCubic' })
    .animateProperty('sprite', 'position.y', { from: -targetOffset.y / 2, to: 0, duration: 2000, gridUnits: true, ease: 'easeOutCubic' })
    .mirrorX()
    .zIndex(2)
    .effect()
    .delay(1800)
    .file(closest('jb2a.impact.010.blue'))
    .atLocation(targetSquare, { offset: randomOffset[1], gridUnits: true })
    .size(0.5, { gridUnits: true })
    .spriteOffset({ x: targetOffset.x / 2, y: targetOffset.y / 2 }, { gridUnits: true })
    .filter('ColorMatrix', { hue: -50 })
    .zIndex(3)
    .effect()
    .file(closest('eskie.environment.wisp.01.teal'))
    .atLocation(targetSquare, { offset: randomOffset[2], gridUnits: true })
    .size(0.5, { gridUnits: true })
    .spriteOffset({ x: targetOffset.x / 2, y: targetOffset.y / 2 }, { gridUnits: true })
    .fadeIn(1500, { ease: 'easeOutCubic' })
    .scaleIn(0, 1500, { ease: 'easeOutCubic' })
    .animateProperty('sprite', 'position.x', { from: -targetOffset.x / 2, to: 0, duration: 2000, gridUnits: true, ease: 'easeOutCubic' })
    .animateProperty('sprite', 'position.y', { from: -targetOffset.y / 2, to: 0, duration: 2000, gridUnits: true, ease: 'easeOutCubic' })
    .randomizeMirrorX()
    .zIndex(2)
    .effect()
    .delay(1800)
    .file(closest('jb2a.impact.010.blue'))
    .atLocation(targetSquare, { offset: randomOffset[2], gridUnits: true })
    .size(0.5, { gridUnits: true })
    .spriteOffset({ x: targetOffset.x / 2, y: targetOffset.y / 2 }, { gridUnits: true })
    .filter('ColorMatrix', { hue: -50 })
    .zIndex(3)
    .play();

if (target2) {
    new Sequence()
        .wait(2500)
        .effect()
        .file(closest('eskie.damage.necrotic.01.teal'))
        .atLocation(target2, { offset: randomOffset[0], gridUnits: true })
        .scaleToObject(0.6, { considerTokenScale: true })
        .zIndex(2)
        .effect()
        .delay(100)
        .file(closest('eskie.damage.necrotic.01.teal'))
        .atLocation(target2, { offset: randomOffset[1], gridUnits: true })
        .scaleToObject(0.6, { considerTokenScale: true })
        .zIndex(2)
        .effect()
        .delay(200)
        .file(closest('eskie.damage.necrotic.01.teal'))
        .atLocation(target2, { offset: randomOffset[2], gridUnits: true })
        .scaleToObject(0.6, { considerTokenScale: true })
        .zIndex(2)
        .effect()
        .delay(150)
        .copySprite(target2)
        .spriteRotation(-target2.document.rotation)
        .attachTo(target2)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .opacity(0.25)
        .duration(1000)
        .fadeOut(750)
        .tint('#58feb0')
        .effect()
        .file(closest('eskie.sound.roar.02'))
        .atLocation(target2, { offset: randomOffset[0], gridUnits: true })
        .scaleToObject(0.9)
        .zIndex(1)
        .duration(1000)
        .fadeOut(400)
        .tint('#111111')
        .opacity(0.9)
        .effect()
        .delay(100)
        .file(closest('eskie.sound.roar.02'))
        .atLocation(target2, { offset: randomOffset[1], gridUnits: true })
        .scaleToObject(0.9)
        .zIndex(1)
        .duration(1000)
        .fadeOut(400)
        .tint('#111111')
        .opacity(0.9)
        .effect()
        .delay(200)
        .file(closest('eskie.sound.roar.02'))
        .atLocation(target2, { offset: randomOffset[2], gridUnits: true })
        .scaleToObject(0.9)
        .zIndex(1)
        .duration(1000)
        .fadeOut(400)
        .tint('#111111')
        .opacity(0.9)
        .play();
}
