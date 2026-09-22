// Standalone Macro: Possession
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Possession' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select the possessing ghost/spirit token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const activePossessions = Sequencer.EffectManager.getEffects({ name: "eskie.effect.possession.main*" });
if (activePossessions.length > 0) {
    await Sequencer.EffectManager.endEffects({ name: "eskie.effect.possession.main*" });
    return ui.notifications.info(`Ended ghost possession.`);
}

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target the token to possess!");

const targetUuid = target.document?.uuid ?? target.uuid ?? target.id;
const effectName = `eskie.effect.possession.main - ${targetUuid}`;

const tintColor = "#6ff087"; // Teal ghostly energy tint
const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
const mirrorX = token.document?.mirrorX ?? false;

const seq = new Sequence();

seq.motion(token)
    .name(effectName)
    .oscillate({ period: 2000, amplitude: 0.05 })
    .fadeTo(0.65, { duration: 500 })
    .tintTo(tintColor, { duration: 500 });

seq.effect()
    .delay(100)
    .file(closest("jb2a.particles.outward.white.01.03"))
    .attachTo(target, { offset: { y: 0.2 }, gridUnits: true, bindRotation: false })
    .scaleToObject()
    .duration(1000)
    .fadeOut(800)
    .scaleIn(0, 1000, { ease: "easeOutCubic" })
    .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
    .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 1000, gridUnits: true })
    .tint(tintColor)
    .filter("Blur", { blurX: 0, blurY: 5 })
    .opacity(0.8)
    .zIndex(0.3);

seq.effect()
    .delay(500)
    .name(effectName)
    .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
    .attachTo(target, { cacheLocation: true, offset: { y: 0 }, gridUnits: true, bindAlpha: false })
    .scaleToObject(1.45, { considerTokenScale: true })
    .randomRotation()
    .fadeIn(1000)
    .fadeOut(500)
    .belowTokens()
    .opacity(0.45)
    .tint(tintColor)
    .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
    .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })
    .persist();

seq.effect()
    .delay(500)
    .name(effectName)
    .copySprite(target)
    .spriteRotation(-targetRotation)
    .attachTo(target, { bindAlpha: false })
    .belowTokens()
    .mirrorX(mirrorX)
    .scaleToObject(1, { considerTokenScale: true })
    .loopProperty("alphaFilter", "alpha", { from: 0.75, to: 1, duration: 1500, pingPong: true, ease: "easeOutSine" })
    .filter("Glow", { color: tintColor, distance: 5, outerStrength: 4, innerStrength: 0 })
    .fadeIn(1000)
    .fadeOut(500)
    .persist()
    .zIndex(0.1)
    .waitUntilFinished();

await seq.play();
