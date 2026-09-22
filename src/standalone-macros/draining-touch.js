// Standalone Macro: Draining Touch
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Draining Touch' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
}

const DEFAULT_CONFIG = {
    id: "draining-touch",
    color: "teal",
    duration: 5000,
};

const id = DEFAULT_CONFIG.id ?? "draining-touch";
const color = DEFAULT_CONFIG.color ?? "teal";
const duration = DEFAULT_CONFIG.duration ?? 5000;

let tintColor = "#6ff087";
let hue = 35;

if (color === "teal") {
    tintColor = "#6ff087";
    hue = 35;
} else if (color === "green") {
    tintColor = "#6cde3b";
    hue = 0;
} else if (color === "blue") {
    tintColor = "#74e2cf";
    hue = 75;
} else if (color === "red") {
    tintColor = "#e22c47";
    hue = -95;
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// 3. Toggle / Re-entrant Persistent Effect Handling
let isPlaying = false;
for (const target of targets) {
    const label = `${id}-${token.id}-${target.id}`;
    if (
        Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: id, object: token }).length > 0
    ) {
        isPlaying = true;
        break;
    }
}
if (!isPlaying && Sequencer.EffectManager.getEffects({ name: id }).length > 0) {
    isPlaying = true;
}

if (isPlaying) {
    for (const target of targets) {
        const label = `${id}-${token.id}-${target.id}`;
        Sequencer.EffectManager.endEffects({ name: label });
        Sequencer.EffectManager.endEffects({ name: id, object: target });
    }
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    Sequencer.EffectManager.endEffects({ name: id });
    return;
}

const sequence = new Sequence();

for (const target of targets) {
    const label = `${id}-${token.id}-${target.id}`;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
    const tokenWidth = token.document?.width ?? 1;

    // Necrotic drain surge on target upon contact
    sequence.effect()
        .name(label)
        .delay(150)
        .file(closest("jb2a.impact.004.green"))
        .atLocation(target)
        .rotateTowards(token)
        .scaleToObject(1.45)
        .spriteScale({ x: 0.75, y: 1.0 })
        .filter("ColorMatrix", { saturate: -0.75, brightness: 1.5, hue: hue })
        .spriteOffset({ x: -0.15 }, { gridUnits: true })
        .zIndex(2);

    // Life-draining touch: necrotic dark green tendrils siphoning vigor from target to caster
    sequence.effect()
        .name(label)
        .file(closest("jb2a.energy_strands.overlay.dark_red.01"))
        .atLocation(target)
        .stretchTo(token, { attachTo: true })
        .tint(tintColor)
        .playbackRate(1.1)
        .scaleToObject(1)
        .zIndex(3)
        .duration(duration)
        .fadeIn(300)
        .fadeOut(800)
        .persist()
        .name(id);

    // Secondary necrotic dark green siphon tendril web for deep life force extraction
    sequence.effect()
        .name(label)
        .file(closest("jb2a.energy_strands.overlay.dark_red.01"))
        .atLocation(target)
        .stretchTo(token, { attachTo: true })
        .tint("#1e561e")
        .filter("ColorMatrix", { saturate: -0.3, brightness: 0.8 })
        .playbackRate(0.8)
        .scaleToObject(1.25)
        .zIndex(2)
        .duration(duration)
        .fadeIn(500)
        .fadeOut(1000)
        .persist()
        .name(id);

    // Drain Touch ground cracks beneath target
    sequence.effect()
        .name(label)
        .file(closest("jb2a.impact.ground_crack.02.white"))
        .atLocation(target)
        .rotateTowards(token)
        .spriteOffset({ x: -0.4 }, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 0, brightness: 1.5 })
        .size(tokenWidth * 1.5, { gridUnits: true })
        .tint(tintColor)
        .mask(target)
        .zIndex(1);

    // Target draining touch shudder motion via Sequencer 4.3.0+ .motion() API
    sequence.motion(target)
        .name(label)
        .noise({ strength: 0.05, frequency: 50, duration: duration, gridUnits: true })
        .persist()
        .name(id);

    // Outflow hit dust dissipating from target
    sequence.effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(target)
        .filter("ColorMatrix", { brightness: 0, saturate: -1 })
        .scaleToObject(1.45, { considerTokenScale: true })
        .fadeIn(1500)
        .fadeOut(1000)
        .belowTokens()
        .duration(duration)
        .persist()
        .name(id);

    // Dark lingering necrotic crack frame on target
    sequence.effect()
        .name(label)
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(target)
        .rotateTowards(token)
        .spriteOffset({ x: -0.4 }, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .filter("Glow", { outerStrength: 6, distance: 10, color: 0x000000 })
        .size(tokenWidth * 1.5, { gridUnits: true })
        .fadeIn(1000)
        .fadeOut(1000)
        .duration(duration)
        .tint(tintColor)
        .mask(target)
        .zIndex(0)
        .persist()
        .name(id);

    // Necrotic static light pulse border siphoning vigor into caster token
    sequence.effect()
        .name(label)
        .file(closest("jb2a.token_border.circle.static.blue.012"))
        .atLocation(token)
        .attachTo(token)
        .opacity(0.65)
        .delay(300)
        .fadeIn(1200)
        .fadeOut(1000)
        .scaleToObject(1.75, { considerTokenScale: true })
        .tint(tintColor)
        .belowTokens()
        .duration(duration)
        .persist()
        .name(id);
}

await sequence.play();
