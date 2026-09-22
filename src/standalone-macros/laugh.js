// Standalone Macro: Emote - Laugh
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Laugh Emote' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "laugh";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id}-${tokenId}`;

const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
const activeIdEffects = Sequencer.EffectManager.getEffects({ name: id, object: token }) ?? [];
if (activeEffects.length > 0 || activeIdEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    return;
}

const tokenWidth = token.document?.width ?? 1;
const facingFactor = 1;

let laughEffect = new Sequence();

laughEffect.effect()
    .name(label)
    .file(closest("eskie.emote.laugh.01.yellow"))
    .atLocation(token, { offset: { x: 0.3 * tokenWidth * facingFactor, y: -0.3 * tokenWidth }, gridUnits: true, local: true })
    .attachTo(token, { bindAlpha: false })
    .loopProperty("sprite", "rotation", { from: 0, to: -15 * facingFactor, duration: 250, ease: "easeOutCubic" })
    .loopProperty("spriteContainer", "position.y", { from: 0, to: -0.025, duration: 250, gridUnits: true, pingPong: false })
    .scaleToObject(0.9)
    .persist()
    .private();

laughEffect.motion(token)
    .name(label)
    .noise()
    .persist()
    .waitUntilFinished(-200);

await laughEffect.play();
