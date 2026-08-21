// Standalone Macro: Thorn Whip
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const target = Array.from(game.user.targets)[0];
if (!target) return ui.notifications.warn('Please target a token!');

const timingAdjust = -100;

const dx = token.center.x - target.center.x;
const dy = token.center.y - target.center.y;
const distance = Math.hypot(dx, dy);

const pullDistance = canvas.grid.size * 2; // 10ft
const adjacentDistance = canvas.grid.size; // 5ft
const maxAllowedPull = Math.max(0, distance - adjacentDistance);
const moveDistance = Math.min(pullDistance, maxAllowedPull);

const rawLocation = {
    x: target.center.x + (distance > 0 ? (dx / distance) * moveDistance : 0),
    y: target.center.y + (distance > 0 ? (dy / distance) * moveDistance : 0)
};

const location = canvas.grid.getCenterPoint ? canvas.grid.getCenterPoint(rawLocation) : rawLocation;
const offsetX = (location.x - target.center.x) / canvas.grid.size;
const offsetY = (location.y - target.center.y) / canvas.grid.size;

new Sequence()
    .effect()
    .file(closest('eskie.casting.nature.01.side.one_shot.green'))
    .attachTo(token)
    .rotateTowards(target)
    .playbackRate(1.25)
    .scaleToObject(1, { considerTokenScale: true })
    .spriteOffset({ x: 0 }, { gridUnits: true })
    .effect()
    .file(closest('eskie.nature.vine.thorny.ranged.01.physical.normal.green'))
    .attachTo(token)
    .stretchTo(target)
    .zIndex(2)
    .waitUntilFinished(-1000)
    .effect()
    .file(closest('eskie.damage.piercing.01.yellow'))
    .atLocation(target)
    .scaleToObject(1, { considerTokenScale: true })
    .zIndex(1)
    .randomRotation()
    .effect()
    .copySprite(target)
    .spriteRotation(-target.document.rotation)
    .attachTo(target)
    .scaleToObject(1, { considerTokenScale: true })
    .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
    .opacity(0.5)
    .duration(1000)
    .fadeOut(250)
    .animation()
    .delay(100)
    .on(target)
    .opacity(0)
    .playIf(target.document.width <= 2)
    .effect()
    .copySprite(target)
    .spriteRotation(-target.document.rotation)
    .zIndex(0)
    .animateProperty('sprite', 'position.x', { from: 0, to: offsetX, duration: 500, delay: 101 + timingAdjust, gridUnits: true, ease: 'easeInCubic' })
    .animateProperty('sprite', 'position.y', { from: 0, to: offsetY, duration: 500, delay: 101 + timingAdjust, gridUnits: true, ease: 'easeInCubic' })
    .duration(700 + timingAdjust)
    .waitUntilFinished(-100)
    .playIf(target.document.width <= 2)
    .animation()
    .on(target)
    .teleportTo(location, { relativeToCenter: true })
    .opacity(1)
    .playIf(target.document.width <= 2)
    .play();
