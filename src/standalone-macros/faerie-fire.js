// Standalone Macro: Faerie Fire
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const glow = true;
const color = 'green'; // 'blue', 'green', 'purple'

let tintColor, hue, hue2;
if (color === 'blue') {
    tintColor = '0x2eb9dc';
    hue = '100';
    hue2 = '0';
} else if (color === 'green') {
    tintColor = '0xd3eb6a';
    hue = '45';
    hue2 = '-35';
} else if (color === 'purple') {
    tintColor = '0xcb40f2';
    hue = '250';
    hue2 = '0';
}

const targets = Array.from(game.user.targets);

new Sequence()
    .crosshair('position')
    .type('rect')
    .distance(28.5)
    .icon(token.document.texture.src)
    .snapPosition(240)
    .callback(Sequencer.Crosshair.CALLBACKS.SHOW, function(crosshair) {
        new Sequence()
            .wait(50)
            .effect()
            .name('Circle Crosshair')
            .file(closest('eskie.crosshair.rectangle.fantasy_01.white.full.20x20ft'))
            .attachTo(crosshair)
            .scaleToObject()
            .belowTokens()
            .locally()
            .persist()
            .play();
    })
    .callback(Sequencer.Crosshair.CALLBACKS.PLACED, function(crosshair) {
        Sequencer.EffectManager.endEffects({ name: 'Circle Crosshair' });
    })
    .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, function(crosshair) {
        Sequencer.EffectManager.endEffects({ name: 'Circle Crosshair' });
    })
    .effect()
    .file(closest('eskie.casting.nature.01.side.one_shot.white'))
    .attachTo(token)
    .rotateTowards('position')
    .scaleToObject(1.25, { considerTokenScale: true })
    .spriteOffset({ x: -0.25 }, { gridUnits: true })
    .filter('Glow', { color: tintColor, distance: 1, outerStrength: 0, innerStrength: 2 })
    .effect()
    .file(closest(`jb2a.sacred_flame.target.${color}`))
    .atLocation('position')
    .scale(0.25)
    .playbackRate(1)
    .duration(1000)
    .scaleOut(0.5, 1000, { ease: 'easeOutBack' })
    .filter('ColorMatrix', { brightness: 0, hue: hue })
    .filter('Blur', { blurX: 5, blurY: 10 })
    .belowTokens()
    .opacity(0.75)
    .effect()
    .file(closest(`jb2a.sacred_flame.target.${color}`))
    .atLocation('position')
    .scale(0.25)
    .playbackRate(1)
    .duration(1000)
    .scaleIn(0, 1000, { ease: 'easeOutCubic' })
    .animateProperty('sprite', 'width', { from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
    .animateProperty('sprite', 'height', { from: 0, to: 0.5, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
    .animateProperty('sprite', 'position.y', { from: 0, to: -0.25, duration: 1000, gridUnits: true, ease: 'easeOutBack' })
    .waitUntilFinished(-200)
    .effect()
    .file(closest(`jb2a.impact.010.${color}`))
    .atLocation('position', { offset: { y: -0.25 }, gridUnits: true })
    .scaleToObject(0.45)
    .randomRotation()
    .zIndex(1)
    .effect()
    .file(closest(`eskie.pulse.energy.01.${color}`))
    .atLocation('position', { offset: { y: -0.25 }, gridUnits: true })
    .scaleToObject(1.1)
    .filter('ColorMatrix', { hue: hue2 })
    .effect()
    .file(closest('jb2a.extras.tmfx.outflow.circle.04'))
    .atLocation('position')
    .belowTokens()
    .scaleToObject(1)
    .opacity(0.25)
    .duration(2500)
    .fadeIn(500)
    .fadeOut(2000)
    .tint(tintColor)
    .effect()
    .file(closest(`jb2a.fireflies.{{Pfew}}.02.${color}`))
    .atLocation('position', { randomOffset: 0.75 })
    .scaleToObject(0.5)
    .randomRotation()
    .duration(750)
    .fadeOut(500)
    .setMustache({
        'Pfew': () => {
            const Pfews = ['few', 'many'];
            return Pfews[Math.floor(Math.random() * Pfews.length)];
        }
    })
    .repeats(10, 75, 75)
    .spriteOffset({ y: -0.25 }, { gridUnits: true })
    .zIndex(1)
    .thenDo(() => {
        targets.forEach(t => {
            new Sequence()
                .effect()
                .name(`${t.document.name} Faerie Fire`)
                .copySprite(t)
                .spriteRotation(-t.document.rotation)
                .attachTo(t, { bindAlpha: false, bindVisibility: false })
                .belowTokens()
                .scaleToObject(1, { considerTokenScale: true })
                .filter('Glow', { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0, knockout: true })
                .fadeIn(500)
                .fadeOut(500)
                .persist()
                .playIf(glow)
                .effect()
                .name(`${t.document.name} Faerie Fire`)
                .file(closest(`eskie.texture_mask.glitter.01.${color}.particles_only`))
                .attachTo(t, { bindAlpha: false, bindVisibility: false })
                .mask()
                .scaleToObject(1.5, { considerTokenScale: true })
                .fadeIn(500)
                .fadeOut(1500)
                .duration(2000)
                .playIf(glow)
                .play();
        });
    })
    .play();
