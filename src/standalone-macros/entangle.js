// Standalone Macro: Entangle
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const entangle = true;
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
            .name('Entangle Crosshair')
            .file(closest('eskie.crosshair.rectangle.fantasy_01.white.full.20x20ft'))
            .attachTo(crosshair)
            .scaleToObject()
            .belowTokens()
            .locally()
            .persist()
            .play();
    })
    .callback(Sequencer.Crosshair.CALLBACKS.PLACED, function() {
        Sequencer.EffectManager.endEffects({ name: 'Entangle Crosshair' });
    })
    .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, function() {
        Sequencer.EffectManager.endEffects({ name: 'Entangle Crosshair' });
    })
    .effect()
    .name('Entangle')
    .file(closest('eskie.casting.nature.01.side.loop.green'))
    .attachTo(token)
    .rotateTowards('position')
    .scaleToObject(1.25, { considerTokenScale: true })
    .spriteOffset({ x: -0.25 }, { gridUnits: true })
    .duration(2000)
    .fadeOut(500)
    .effect()
    .name('Entangle')
    .file(closest('eskie.casting.nature.01.center.loop.green'))
    .attachTo('position')
    .size(1, { gridUnits: true })
    .belowTokens()
    .duration(2000)
    .fadeOut(500)
    .zIndex(1.1)
    .effect()
    .delay(500)
    .name('Entangle')
    .file(closest('eskie.nature.vine.normal.circle.01.physical.green.radius_20ft'))
    .atLocation('position')
    .scaleToObject(1.15)
    .persist()
    .belowTokens()
    .zIndex(1)
    .randomRotation()
    .thenDo(() => {
        targets.forEach(target => {
            new Sequence()
                .effect()
                .delay(1000)
                .name('Entangle')
                .file(closest('eskie.nature.vine.normal.token.01.physical.green'))
                .attachTo(target)
                .scaleToObject(1.3, { considerTokenScale: true })
                .persist()
                .playIf(entangle)
                .play();
        });
    })
    .effect()
    .name('Entangle')
    .atLocation('position')
    .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_green'))
    .size(3.5, { gridUnits: true })
    .fadeIn(600)
    .opacity(1)
    .rotateIn(180, 600, { ease: 'easeOutCubic' })
    .scaleIn(0, 600, { ease: 'easeOutCubic' })
    .belowTokens()
    .fadeOut(500)
    .duration(3000)
    .effect()
    .name('Entangle')
    .atLocation('position')
    .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_green'))
    .size(3.5, { gridUnits: true })
    .fadeIn(600, { delay: 2500 })
    .opacity(0.5)
    .rotateIn(180, 600, { ease: 'easeOutCubic' })
    .scaleIn(0, 600, { ease: 'easeOutCubic' })
    .persist()
    .belowTokens()
    .filter('ColorMatrix', { brightness: 0 })
    .play();
