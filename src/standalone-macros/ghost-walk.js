// Standalone Macro: Ghost Walk (Toggle)
// Author: .eskie
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

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
    await new Sequence()
        .motion(token)
        .fadeTo(1, { duration: 500 })
        .tintTo('#FFFFFF', { duration: 500 })
        .play();
    await Sequencer.EffectManager.endEffects({ name: ghostEffectName, object: token });
} else {
    new Sequence()
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
        .motion(token)
        .name(ghostEffectName)
        .fadeTo(0.65, { duration: 500 })
        .tintTo(color, { duration: 500 })
        .oscillate({ period: 2000, amplitude: 0.05 })
        .effect()
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(token)
        .scaleToObject(2, { considerTokenScale: true })
        .opacity(0.5)
        .filter('ColorMatrix', { saturate: 0, brightness: 1.5 })
        .tint(color)
        .play();
}
