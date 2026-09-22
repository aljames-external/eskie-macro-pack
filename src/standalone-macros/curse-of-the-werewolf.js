// Standalone Macro: Curse of the Werewolf
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Curse of the Werewolf' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct string path if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const DEFAULT_CONFIG = {
    id: "curse-of-the-werewolf",
    werewolfForm: "https://files.d20.io/images/390116904/V1XE3gOTz6-hHEg-_jQt3g/original.png",
};

const werewolfForm = DEFAULT_CONFIG.werewolfForm;
const tokenWidth = token.document?.width ?? 1;

const sequence = new Sequence();

// Red runic sign floats above the target's head
sequence.effect()
    .file(closest("jb2a.magic_signs.rune.02.complete.04.red"))
    .attachTo(token, { offset: { x: 0, y: -0.7 * tokenWidth }, gridUnits: true, bindRotation: false })
    .scaleToObject(0.5, { considerTokenScale: true })
    .duration(4000)
    .fadeOut(1000)
    .playbackRate(1.5)
    .zIndex(0);

// Small dark outflow vortex near the rune — reinforces the cursed energy
sequence.effect()
    .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
    .attachTo(token, { offset: { x: 0, y: -0.7 * tokenWidth }, gridUnits: true })
    .scaleToObject(0.5, { considerTokenScale: true })
    .duration(4000)
    .fadeIn(1000)
    .fadeOut(1000)
    .playbackRate(1.5)
    .filter("ColorMatrix", { brightness: 0 });

// Dark particle burst — curse energy erupting upward from the target
sequence.effect()
    .delay(300)
    .file(closest("jb2a.particles.outward.white.01.03"))
    .attachTo(token, { offset: { y: -0.7 }, gridUnits: true, bindRotation: false })
    .scaleToObject(0.75, { considerTokenScale: true })
    .duration(1000)
    .fadeOut(800)
    .scaleIn(0, 1000, { ease: "easeOutCubic" })
    .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
    .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 1000, gridUnits: true })
    .filter("ColorMatrix", { brightness: 0 })
    .opacity(0.8)
    .zIndex(0.3);

sequence.wait(400);

// Larger dark outflow beneath the token — the curse spreading outward
sequence.effect()
    .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
    .attachTo(token)
    .scaleToObject(1.4, { considerTokenScale: true })
    .duration(4000)
    .fadeIn(1000)
    .fadeOut(1000)
    .belowTokens()
    .playbackRate(1.5)
    .randomRotation()
    .filter("ColorMatrix", { brightness: 0 });

// Red inflow spiral masked to the token — the curse seeping into the target
sequence.effect()
    .file(closest("jb2a.extras.tmfx.inflow.circle.02"))
    .attachTo(token)
    .scaleToObject(1.25, { considerTokenScale: true })
    .fadeIn(250)
    .fadeOut(2500)
    .duration(4000)
    .startTime(800)
    .opacity(0.8)
    .filter("ColorMatrix", { brightness: 0.5 })
    .tint("#e82121")
    .rotate(-15)
    .mask(token);

// Ghost of the current token — glowing red, fading in as the curse takes hold
// Native motion for werewolf transformation scale and shudder via Sequencer 4.3.0+
sequence.motion(token)
    .scaleTo(1.06, { duration: 750, ease: "easeOutBack" })
    .noise({ strength: 0.05, frequency: 50, gridUnits: true });

// Ghost of the werewolf form — the beast briefly surfacing through the curse
if (werewolfForm) {
    sequence.effect()
        .file(closest(werewolfForm))
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.4);
}

await sequence.play();

