// Standalone Macro: Divine Strike (Twilight Melee)
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

const darkMap = true;
const isCrit = false;
const type = 'slashing';
const weight = 'medium';

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

const targetSquare = getNearestSquareCenter(token, target);

new Sequence()
    .effect()
    .name(`Casting ${target.document.name}`)
    .file(closest(canvas.scene.background.src))
    .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
    .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
    .fadeIn(750)
    .fadeOut(750)
    .duration(3000)
    .filter('ColorMatrix', { brightness: 0 })
    .belowTokens()
    .opacity(0.5)
    .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
    .playIf(darkMap && canvas.scene.background?.src)
    .wait(500)
    .effect()
    .file(closest('eskie.casting.physical.01.center.one_shot.white'))
    .attachTo(token)
    .startTime(250)
    .scaleToObject(3, { considerTokenScale: true })
    .filter('ColorMatrix', { hue: 130 })
    .effect()
    .file(closest(`eskie.attack.melee.twilight.01.${type}.${weight}.blue.slow`))
    .atLocation(token)
    .rotateTowards(targetSquare)
    .scaleToObject(effectSize, { considerTokenScale: true })
    .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
    .randomizeMirrorY()
    .zIndex(1)
    .effect()
    .delay(150)
    .file(closest('eskie.damage.radiant.01.rainbow'))
    .atLocation(targetSquare)
    .scaleToObject(1.25 * token.document.width, { considerTokenScale: true })
    .filter('ColorMatrix', { hue: -140 })
    .randomRotation()
    .zIndex(1)
    .effect()
    .delay(150)
    .file(closest('eskie.damage.critical.01.white'))
    .atLocation(targetSquare)
    .scaleToObject(1.5, { considerTokenScale: true })
    .randomRotation()
    .filter('ColorMatrix', { hue: -140 })
    .zIndex(1)
    .playIf(isCrit)
    .canvasPan()
    .delay(150)
    .shake({ duration: 500, strength: 1, rotation: false, fadeOutDuration: 500 });

sequence.effect()
    .delay(150)
    .copySprite(target)
    .spriteRotation(-target.document.rotation)
    .attachTo(target)
    .scaleToObject(1, { considerTokenScale: true })
    .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
    .opacity(0.5)
    .duration(500)
    .fadeOut(250);

sequence.effect()
    .delay(150)
    .copySprite(target)
    .spriteRotation(-target.document.rotation)
    .attachTo(target)
    .scaleToObject(1, { considerTokenScale: true })
    .filter('Glow', { color: '#fdffd3', distance: 10, outerStrength: 4, innerStrength: 0, knockout: true })
    .opacity(0.75)
    .duration(500)
    .fadeOut(250)
    .playIf(isCrit);

sequence.play();
