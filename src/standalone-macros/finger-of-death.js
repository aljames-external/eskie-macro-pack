// Standalone Macro: Finger of Death
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Finger of Death' macro requires the 'Sequencer' module to be installed and active!");
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
    id: "finger-of-death",
    darkMap: true,
};

const id = DEFAULT_CONFIG.id ?? "finger-of-death";
const darkMap = DEFAULT_CONFIG.darkMap ?? true;

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// 3. Toggle / Re-entrant Persistent Effect Handling
let isPlaying = false;
for (const target of targets) {
    const activeFx = Sequencer.EffectManager.getEffects({ name: id, object: target });
    if (activeFx.length > 0) {
        isPlaying = true;
        break;
    }
}
if (!isPlaying && Sequencer.EffectManager.getEffects({ name: id }).length > 0) {
    isPlaying = true;
}

if (isPlaying) {
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: id, object: target });
    }
    Sequencer.EffectManager.endEffects({ name: id });
    return;
}

const sequence = new Sequence();

// Ambient map dimming if background exists and darkMap is enabled
const backgroundSrc = canvas.scene?.background?.src;
if (darkMap && backgroundSrc) {
    const canvasWidth = canvas.dimensions?.width ?? canvas.scene?.width ?? 0;
    const canvasHeight = canvas.dimensions?.height ?? canvas.scene?.height ?? 0;
    const sceneWidth = canvas.scene?.width ?? 0;
    const sceneHeight = canvas.scene?.height ?? 0;
    const gridSize = canvas.grid?.size ?? 100;

    sequence.effect()
        .name(id)
        .file(backgroundSrc)
        .filter("ColorMatrix", { brightness: 0.3 })
        .atLocation({ x: canvasWidth / 2, y: canvasHeight / 2 })
        .size({ width: sceneWidth / gridSize, height: sceneHeight / gridSize }, { gridUnits: true })
        .spriteOffset({ x: -0.5 }, { gridUnits: true })
        .duration(6000)
        .fadeIn(500)
        .fadeOut(500)
        .belowTokens();
}

// Caster ominous aura prep
sequence.effect()
    .name(id)
    .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
    .atLocation(token)
    .scaleToObject(3)
    .opacity(0.75)
    .belowTokens()
    .filter("ColorMatrix", { saturate: 0, brightness: 0 })
    .zIndex(1);

sequence.effect()
    .name(id)
    .file(closest("jb2a.extras.tmfx.outflow.circle.04"))
    .attachTo(token)
    .scaleToObject(1.75)
    .fadeIn(1000)
    .fadeOut(500)
    .opacity(1.2)
    .randomRotation()
    .belowTokens()
    .filter("ColorMatrix", { saturate: 0, brightness: 0 })
    .zIndex(1);

for (const target of targets) {
    const tokenWidth = token.document?.width ?? 1;

    sequence.wait(750)

    .effect()
        .name(id)
        .file(closest("jb2a.impact.010.green"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.2 }, { gridUnits: true })
        .scaleToObject(0.4)
        .fadeOut(750)
        .zIndex(1)
        .wait(50)

    .effect()
        .name(id)
        .file(closest("jb2a.twinkling_stars.points04.orange"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.2 }, { gridUnits: true })
        .filter("ColorMatrix", { hue: 70 })
        .rotate(0)
        .scaleToObject(0.4)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .animateProperty('sprite', 'rotation', { from: 0, to: 360, duration: 1000, ease: "easeOutCubic" })
        .animateProperty('spriteContainer', 'position.x', { from: -0.2, to: 0.25, duration: 1500, gridUnits: true, ease: "easeOutBack", delay: 1500 })
        .animateProperty('sprite', 'rotation', { from: 0, to: 360, duration: 4042, ease: "easeOutSine" })
        .fadeOut(750)
        .zIndex(1)

    .effect()
        .name(id)
        .file(closest("jb2a.extras.tmfx.outpulse.circle.03.normal"))
        .atLocation(token)
        .rotateTowards(target)
        .spriteOffset({ x: -0.175 }, { gridUnits: true })
        .rotate(0)
        .scaleToObject(0.35)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .animateProperty('sprite', 'rotation', { from: 0, to: 360, duration: 1000, ease: "easeOutCubic" })
        .animateProperty('spriteContainer', 'position.x', { from: -0.2, to: 0.275, duration: 1500, gridUnits: true, ease: "easeOutBack", delay: 1500 })
        .tint("#89eb34")
        .opacity(0.8)
        .duration(4042)
        .fadeOut(750)
        .zIndex(0)
        .wait(3000)

    // Dark reddish casting charge from caster tip
    .effect()
        .name(id)
        .file(closest("jb2a.cast_generic.dark.side01.red"))
        .size(1 * tokenWidth, { gridUnits: true })
        .atLocation(token)
        .rotateTowards(target)
        .filter("ColorMatrix", { hue: -285 })
        .waitUntilFinished(-1500)
        .zIndex(2)

    // Terrifying dark red energy bolt shooting from caster finger into target chest
    .effect()
        .name(id)
        .file(closest("jb2a.fireball.beam.dark_red"))
        .atLocation(token)
        .playbackRate(1.75)
        .scale(0.3)
        .stretchTo(target)
        .filter("ColorMatrix", { hue: -285 })
        .startTime(2000)
        .waitUntilFinished(-2100)

    // Chest impact burst & canvas camera shake
    .effect()
        .name(id)
        .file(closest("jb2a.impact.004.dark_red"))
        .atLocation(target)
        .scaleToObject(2.5)
        .filter("ColorMatrix", { hue: -285 })
        .fadeOut(1167)
        .opacity(0.45)
        .scaleIn(0, 1167, { ease: "easeOutCubic" })
        .canvasPan()
        .shake({ duration: 100, strength: 25, rotation: false })

    // Necrotic dark crackling electrical discharge on target
    .effect()
        .name(id)
        .file(closest("jb2a.static_electricity.03.blue"))
        .attachTo(target)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .opacity(0.75)
        .playbackRate(4)
        .fadeOut(1000)
        .randomRotation()
        .repeats(10, 250, 250)
        .zIndex(1)

    // Dark necrotic shadow ring under target token
    .effect()
        .name(id)
        .file(closest("jb2a.token_border.circle.static.blue.009"))
        .attachTo(target)
        .fadeIn(1000)
        .fadeOut(6000)
        .scaleToObject(1.6, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .belowTokens()
        .duration(10000)

    // Soul wither disintegration death shudder motion
    .motion(target)
        .name(id)
        .noise({ strength: 0.05, frequency: 50, duration: 5000, gridUnits: true })

    // Secondary dying static electricity crackle
    .effect()
        .name(id)
        .delay(2000)
        .file(closest("jb2a.static_electricity.03.blue"))
        .attachTo(target)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .opacity(0.75)
        .playbackRate(2)
        .fadeOut(1000)
        .randomRotation()
        .repeats(3, 2000, 4000)
        .zIndex(1);
}

await sequence.play();
