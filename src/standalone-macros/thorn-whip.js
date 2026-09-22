// Standalone Macro: Thorn Whip
// Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

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

const canPull = (target.document?.width ?? 1) <= 2;

const sequence = new Sequence();

sequence.effect()
    .file(closest('eskie.casting.nature.01.side.one_shot.green'))
    .attachTo(token)
    .rotateTowards(target)
    .playbackRate(1.25)
    .scaleToObject(1, { considerTokenScale: true })
    .spriteOffset({ x: 0 }, { gridUnits: true });

sequence.effect()
    .file(closest('eskie.nature.vine.thorny.ranged.01.physical.normal.green'))
    .attachTo(token)
    .stretchTo(target)
    .zIndex(2)
    .waitUntilFinished(-1000);

sequence.effect()
    .file(closest('eskie.damage.piercing.01.yellow'))
    .atLocation(target)
    .scaleToObject(1, { considerTokenScale: true })
    .zIndex(1)
    .randomRotation();

if (canPull) {
    sequence.motion(target)
        .moveTo(location, { duration: 500, rotate: false, ease: 'easeInCubic', delay: Math.max(0, 101 + timingAdjust) });
}

await sequence.play();
