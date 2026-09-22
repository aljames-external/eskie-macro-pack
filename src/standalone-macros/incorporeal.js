// Standalone Macro: Incorporeal Form
// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Incorporeal Form' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tokenUuid = token.document?.uuid ?? token.uuid ?? token.id;
const id = `eskie.effect.incorporeal.main - ${tokenUuid}`;
const tintColor = "#6ff087";

// Toggle existing incorporeal state
const activeEffects = Sequencer.EffectManager.getEffects({ name: id, object: token }) ?? [];
if (activeEffects.length > 0) {
    await token.document.update({ light: { dim: 0, bright: 0 } });
    await Sequencer.EffectManager.endEffects({ name: id, object: token });
    return ui.notifications.info(`Returned ${token.name} to material density.`);
}

const seq = new Sequence();

seq.thenDo(function () {
    const light = {
        dim: 0,
        bright: 1,
        alpha: 0.25,
        luminosity: 0.55,
        color: tintColor,
        animation: { type: "torch", speed: 4, intensity: 5 },
        attenuation: 0.85,
        contrast: 0,
        shadows: 0
    };
    token.document.update({ light });
});

seq.effect()
    .name(id)
    .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
    .attachTo(token, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
    .scaleToObject(1.45, { considerTokenScale: true })
    .randomRotation()
    .belowTokens()
    .opacity(0.45)
    .tint(tintColor)
    .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
    .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
    .persist();

seq.motion(token)
    .name(id)
    .oscillate()
    .fadeTo(0.5)
    .tintTo(tintColor)
    .persist();

seq.effect()
    .file(closest("jb2a.smoke.puff.centered.grey"))
    .atLocation(token)
    .scaleToObject(2, { considerTokenScale: true })
    .opacity(0.5)
    .filter("ColorMatrix", { saturate: 0, brightness: 1.5 })
    .tint(tintColor);

await seq.play();

