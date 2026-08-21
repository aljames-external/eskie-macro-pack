// Standalone Macro: Goodberry (Use)
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

new Sequence()
    .effect()
    .file(closest('blfx.misc.nature.goodberry.1.color1'))
    .attachTo(token)
    .scaleToObject(1.2, { considerTokenScale: true })
    .startTime(1000)
    .duration(2000)
    .fadeIn(300)
    .scaleOut(0, 250, { ease: 'easeOutCubic' })
    .animateProperty('sprite', 'position.y', { from: 0.25, to: 0, duration: 300, gridUnits: true, ease: 'easeOutCubic' })
    .loopProperty('sprite', 'position.y', { from: 0.05, to: 0, duration: 150, gridUnits: true, ease: 'easeOutCubic', delay: 300 })
    .zIndex(1)
    .waitUntilFinished(-250)
    .effect()
    .file(closest('jb2a.impact.002.green'))
    .attachTo(token)
    .scaleToObject(0.6, { considerTokenScale: true })
    .zIndex(2)
    .effect()
    .file(closest('eskie.particle.01.one_shot.green'))
    .attachTo(token)
    .scaleToObject(0.75, { considerTokenScale: true })
    .zIndex(2)
    .effect()
    .file(closest('eskie.buff.one_shot.health.green'))
    .attachTo(token)
    .scaleToObject(1, { considerTokenScale: true })
    .effect()
    .copySprite(token)
    .spriteRotation(-token.document.rotation)
    .attachTo(token)
    .belowTokens()
    .scaleToObject(1, { considerTokenScale: true })
    .filter('Glow', { color: '#6ee91c', distance: 10, outerStrength: 4, innerStrength: 0, knockout: true })
    .fadeIn(250)
    .fadeOut(750)
    .duration(1000)
    .play();
