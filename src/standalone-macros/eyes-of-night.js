// Standalone Macro: Eyes of Night
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const darkMap = true;
const remainingTargets = Array.from(game.user.targets);
let source = token;

const allPoints = [
    token.center,
    ...remainingTargets.map(t => t.center)
];

const minX = Math.min(...allPoints.map(p => p.x));
const maxX = Math.max(...allPoints.map(p => p.x));
const minY = Math.min(...allPoints.map(p => p.y));
const maxY = Math.max(...allPoints.map(p => p.y));

const centerPoint = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2
};

await new Sequence()
    .effect()
    .name(`Casting ${token.document.name}`)
    .file(closest(canvas.scene.background.src))
    .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
    .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
    .fadeIn(750)
    .fadeOut(750)
    .duration(4000)
    .filter('ColorMatrix', { brightness: 0 })
    .belowTokens()
    .opacity(0.5)
    .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
    .playIf(darkMap && canvas.scene.background?.src)
    .effect()
    .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
    .attachTo(token)
    .scaleToObject(2.2, { considerTokenScale: true })
    .fadeIn(500)
    .fadeOut(1000)
    .opacity(1)
    .belowTokens()
    .startTime(1000)
    .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
    .zIndex(1)
    .effect()
    .file(closest('eskie.symbol.eye.01.blue'))
    .attachTo(token)
    .scaleToObject(0.65, { considerTokenScale: true })
    .filter('ColorMatrix', { saturate: -1 })
    .effect()
    .file(closest('eskie.symbol.constellation.symbol_only.01.moon.white'))
    .atLocation(centerPoint)
    .scaleToObject(6)
    .fadeIn(1000)
    .filter('ColorMatrix', { brightness: 0 })
    .opacity(0.5)
    .duration(4500)
    .fadeOut(1000)
    .belowTokens()
    .zIndex(0)
    .play();

while (remainingTargets.length > 0) {
    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < remainingTargets.length; i++) {
        const target = remainingTargets[i];
        const distance = Math.hypot(target.center.x - source.center.x, target.center.y - source.center.y);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
        }
    }

    const target = remainingTargets.splice(closestIndex, 1)[0];
    const scale = closestDistance <= canvas.grid.size ? 1 : 0.5;

    await new Sequence()
        .effect()
        .file(closest('eskie.star.constellation.line.01.white'))
        .attachTo(source)
        .stretchTo(target, { onlyX: false, attachTo: true })
        .scale(scale)
        .template({ gridSize: 200, startPoint: -100, endPoint: 100 })
        .randomizeMirrorY()
        .effect()
        .delay(250)
        .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
        .attachTo(target)
        .scaleToObject(2.2, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .startTime(1000)
        .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
        .zIndex(1)
        .wait(250)
        .play();

    source = target;
}
