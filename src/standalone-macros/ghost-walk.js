// Standalone Macro: Ghost Walk (Toggle)
// Author: .eskie
const closest = (path) => {
    if (typeof eskie !== 'undefined' && eskie.util?.file?.closest) return eskie.util.file.closest(path);
    const apiClosest = game.modules?.get('eskie-macros')?.api?.util?.closest;
    if (typeof apiClosest === 'function') return apiClosest(path);
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const changeLight = true;
const color = '#58feb0';
const ghostEffectName = `${token.document.name} Ghost Walk`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: ghostEffectName, object: token }).length > 0;

if (isPlaying) {
    if (changeLight) {
        await token.document.update({ light: { dim: 0, bright: 0 } });
    }
    await new Sequence().animation().on(token).opacity(1).show(true).play();
    await Sequencer.EffectManager.endEffects({ name: ghostEffectName, object: token });
} else {
    new Sequence()
        .animation()
        .on(token)
        .opacity(0)
        .thenDo(async () => {
            if (changeLight) {
                const light = {
                    dim: 0,
                    bright: 1,
                    alpha: 0.25,
                    luminosity: 0.55,
                    color: color,
                    animation: { type: 'torch', speed: 4, intensity: 5 },
                    attenuation: 0.85,
                    contrast: 0,
                    shadows: 0
                };
                await token.document.update({ light });
            }
        })
        .effect()
        .name(ghostEffectName)
        .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
        .attachTo(token, { bindAlpha: false })
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .belowTokens()
        .opacity(0.45)
        .zIndex(1)
        .tint(color)
        .fadeIn(1500, { ease: 'easeInSine' })
        .fadeOut(1500)
        .duration(5000)
        .persist()
        .effect()
        .delay(250)
        .name(ghostEffectName)
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .attachTo(token, { bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.65)
        .tint(color)
        .loopProperty('sprite', 'position.x', { from: 0, to: 0.025, duration: 5000, gridUnits: true, pingPong: true, ease: 'easeOutSine', delay: 3000 })
        .loopProperty('sprite', 'position.x', { from: 0, to: -0.025, duration: 5000, gridUnits: true, pingPong: true, ease: 'easeInSine', delay: 3000 })
        .loopProperty('sprite', 'position.y', { from: 0, to: -0.03, duration: 2500, gridUnits: true, pingPong: true, delay: 3000 })
        .filter('ColorMatrix', { saturate: -0.2, brightness: 1.2 })
        .filter('Blur', { blurX: 0, blurY: 0.8 })
        .fadeIn(1500, { ease: 'easeInSine' })
        .fadeOut(1000)
        .persist()
        .effect()
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(token)
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(0.5)
        .filter('ColorMatrix', { saturate: 0, brightness: 1.5 })
        .tint(color)
        .play();
}
