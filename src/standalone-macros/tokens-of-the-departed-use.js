// Standalone Macro: Tokens of the Departed (Use)
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
if (!target) return ui.notifications.warn('Please target a token or location!');

const label = `${target.document.name} Tokens of the Departed`;

new Sequence()
    .effect()
    .file(closest('jb2a.extras.tmfx.border.circle.outpulse.01.fast'))
    .atLocation(token, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
    .scaleToObject(0.25, { considerTokenScale: true })
    .filter('ColorMatrix', { hue: -50 })
    .zIndex(1)
    .duration(1500)
    .animateProperty('sprite', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
    .animateProperty('sprite', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
    .moveTowards(target, { delay: 500, ease: 'easeOutCubic', rotate: false })
    .scaleOut(0, 1000, { ease: 'easeOutSine' })
    .tint('#58feb0')
    .effect()
    .file(closest('eskie.star.03.blue'))
    .atLocation(token, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
    .scaleToObject(0.75, { considerTokenScale: true })
    .filter('ColorMatrix', { hue: -50 })
    .zIndex(1)
    .duration(1500)
    .animateProperty('sprite', 'position.y', { from: 0, to: -0.25, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 500 })
    .animateProperty('sprite', 'position.y', { from: 0, to: 0.25, duration: 750, ease: 'easeOutSine', gridUnits: true, delay: 750 })
    .animateProperty('sprite', 'rotation', { from: 0, to: 720, duration: 1500, delay: 500, ease: 'easeOutCubic' })
    .moveTowards(target, { delay: 500, ease: 'easeOutCubic', rotate: false })
    .scaleOut(0, 1000, { ease: 'easeOutSine' })
    .waitUntilFinished(-500)
    .effect()
    .file(closest('eskie.poison.circle.01.teal'))
    .atLocation(target)
    .scaleToObject(1.5, { considerTokenScale: true })
    .zIndex(2)
    .effect()
    .name(label)
    .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
    .attachTo(target, { bindAlpha: false })
    .scaleToObject(1.45, { considerTokenScale: true })
    .randomRotation()
    .belowTokens()
    .opacity(0.45)
    .tint('#58feb0')
    .fadeIn(2500, { ease: 'easeInSine' })
    .persist()
    .effect()
    .name(label)
    .copySprite(target)
    .spriteRotation(-target.document.rotation)
    .attachTo(target, { bindAlpha: false })
    .scaleToObject(1, { considerTokenScale: true })
    .opacity(0.65)
    .tint('#58feb0')
    .loopProperty('sprite', 'position.x', { from: 0.025, to: -0.025, duration: 5000, gridUnits: true, pingPong: true, ease: 'easeOutSine' })
    .loopProperty('sprite', 'position.y', { from: 0, to: -0.03, duration: 2500, gridUnits: true, pingPong: true })
    .filter('ColorMatrix', { saturate: -0.2, brightness: 1.2 })
    .filter('Blur', { blurX: 0, blurY: 0.8 })
    .fadeIn(2500, { ease: 'easeInSine' })
    .persist()
    .play();
