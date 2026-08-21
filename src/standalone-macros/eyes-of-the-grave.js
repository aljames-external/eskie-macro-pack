// Standalone Macro: Eyes of the Grave
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const path = 'actor.system.details.type.value';
const radius = 60;

const grid = canvas.scene.grid.distance ?? 5;
const radiusGU = radius / grid;

const collectedTargets = canvas.tokens.placeables.filter(t => {
    if (!t?.actor) return false;
    if (t.id === token.id) return false;

    const distPx = Math.hypot(t.center.x - token.center.x, t.center.y - token.center.y);
    const distGU = distPx / canvas.grid.size;
    return distGU <= radiusGU;
});

const targets = Array.from(collectedTargets);

new Sequence()
    .effect()
    .name(`Eyes of the Grave ${token.document.id}`)
    .file(closest('eskie.symbol.eye.01.green'))
    .attachTo(token, { offset: { y: -0.5 * token.document.width }, gridUnits: true, bindRotation: false })
    .scaleToObject(0.65, { considerTokenScale: true })
    .filter('ColorMatrix', { hue: 50 })
    .effect()
    .file(closest('jb2a.detect_magic.circle.blue'))
    .atLocation(token)
    .size((radius * 2) / 5, { gridUnits: true })
    .filter('ColorMatrix', { hue: -50 })
    .fadeOut(4000)
    .opacity(0.75)
    .belowTokens()
    .play();

targets.forEach(target => {
    const value = foundry.utils.getProperty(target, path);
    const isUndead = Array.isArray(value)
        ? value.map(v => String(v).toLowerCase()).includes('undead')
        : String(value ?? '').toLowerCase().includes('undead');

    if (target.id !== token.id) {
        const distance = Math.hypot(target.x - token.x, target.y - token.y);
        const gridDistance = distance / canvas.grid.size;

        new Sequence()
            .effect()
            .delay(gridDistance * 125)
            .file(closest('jb2a.detect_magic.circle.blue'))
            .atLocation(target)
            .scaleToObject(2.5, { considerTokenScale: true })
            .filter('ColorMatrix', { hue: -50 })
            .mask(target)
            .effect()
            .delay(gridDistance * 125)
            .copySprite(target)
            .belowTokens()
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .spriteRotation(-target.document.rotation)
            .filter('Glow', { color: 0x58feb0, distance: 15 })
            .duration(15000)
            .fadeIn(2000, { delay: 1000 })
            .fadeOut(3500, { ease: 'easeInSine' })
            .opacity(0.8)
            .zIndex(0.1)
            .playIf(isUndead)
            .effect()
            .delay(gridDistance * 125)
            .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
            .attachTo(target)
            .scaleToObject(1.5, { considerTokenScale: true })
            .randomRotation()
            .duration(15000)
            .fadeIn(5000)
            .fadeOut(3500, { ease: 'easeInSine' })
            .scaleIn(0, 3500, { ease: 'easeInOutCubic' })
            .tint('#58feb0')
            .opacity(0.5)
            .belowTokens()
            .playIf(isUndead)
            .play();
    }
});
