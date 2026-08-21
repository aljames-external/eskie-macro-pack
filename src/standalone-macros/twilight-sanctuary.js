// Standalone Macro: Twilight Sanctuary (Toggle)
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
const effectName = `Twilight Sanctuary ${token.document.name}`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: effectName, object: token }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: effectName });
} else {
    new Sequence()
        .effect()
        .name(effectName)
        .file(closest(canvas.scene.background.src))
        .atLocation({ x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2 })
        .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
        .fadeIn(750)
        .fadeOut(750)
        .duration(4000)
        .filter('ColorMatrix', { brightness: 0 })
        .belowTokens()
        .persist()
        .opacity(0.5)
        .spriteOffset({ x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY })
        .playIf(darkMap && canvas.scene.background?.src)
        .wait(250)
        .effect()
        .name(effectName)
        .file(closest('jb2a.markers.light_orb.complete.white'))
        .attachTo(token)
        .scaleToObject(0.65, { considerTokenScale: true })
        .persist()
        .effect()
        .file(closest('jb2a.energy_strands.in.blue'))
        .attachTo(token)
        .scaleToObject(2.5, { considerTokenScale: true })
        .filter('ColorMatrix', { brightness: 0 })
        .belowTokens()
        .opacity(0.8)
        .playbackRate(1.2)
        .wait(1000)
        .effect()
        .file(closest('eskie.pulse.energy.01.yellow'))
        .attachTo(token, { offset: { x: 0 }, gridUnits: true })
        .scaleToObject(0.7, { gridUnits: true })
        .filter('ColorMatrix', { saturate: -1 })
        .zIndex(1)
        .effect()
        .file(closest('eskie.pulse.energy.01.yellow'))
        .attachTo(token, { offset: { x: 0 }, gridUnits: true })
        .scaleToObject(13.5, { gridUnits: true })
        .filter('ColorMatrix', { saturate: -1 })
        .zIndex(1)
        .effect()
        .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
        .attachTo(token)
        .scaleToObject(3, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .startTime(1000)
        .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
        .zIndex(2)
        .effect()
        .name(effectName)
        .file(closest('jb2a.particles.outward.white.02.03'))
        .attachTo(token)
        .size(2, { gridUnits: true })
        .persist()
        .belowTokens()
        .zIndex(3)
        .effect()
        .name(effectName)
        .file(closest('eskie.aura.twilight.02.black'))
        .attachTo(token, { bindRotation: false })
        .size(13, { gridUnits: true })
        .belowTokens()
        .opacity(1)
        .zIndex(2)
        .filter('ColorMatrix', { hue: -125 })
        .persist()
        .play();
}
