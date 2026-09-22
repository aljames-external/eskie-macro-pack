// Standalone Macro: Shocking Grasp
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Shocking Grasp' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const DEFAULT_CONFIG = {
    id: "shockingGrasp",
};

const id = DEFAULT_CONFIG.id ?? "shockingGrasp";

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: id, object: token }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: id }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    Sequencer.EffectManager.endEffects({ name: id, object: target });
    Sequencer.EffectManager.endEffects({ name: id });
    return;
}

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

sequence
    .effect()
    .name(id)
    .file(closest("jb2a.breath_weapons.lightning.line.blue"))
    .atLocation(token)
    .rotateTowards(target)
    .spriteOffset({ x: tokenWidth * 0.4 }, { gridUnits: true })
    .scale(0.25)
    .endTime(4000)
    .playbackRate(3)
    .animateProperty('spriteContainer', 'position.x', { from: -0.3, to: 0, duration: 750, gridUnits: true, ease: "easeInBack" })
    .waitUntilFinished(-300)

    .effect()
    .name(id)
    .delay(250)
    .file(closest("jb2a.impact.008.blue"))
    .atLocation(token)
    .rotateTowards(target)
    .spriteOffset({ x: tokenWidth - 1 }, { gridUnits: true })
    .scale(0.25)

    .effect()
    .name(id)
    .file(closest("eskie.lightning.03.blue"))
    .atLocation(token)
    .rotateTowards(target)
    .size(tokenWidth * 1.2, { gridUnits: true })
    .filter("ColorMatrix", { hue: -24, saturate: 1 })
    .spriteOffset({ x: tokenWidth * 0.35 }, { gridUnits: true })
    .zIndex(1)
    .repeats(2, 500, 500)

    .effect()
    .name(id)
    .delay(250)
    .file(closest("eskie.lightning.03.blue"))
    .atLocation(token)
    .rotateTowards(target)
    .size(tokenWidth * 1.2, { gridUnits: true })
    .filter("ColorMatrix", { hue: -24, saturate: 1 })
    .spriteOffset({ x: tokenWidth * 0.35 }, { gridUnits: true })
    .mirrorY()
    .zIndex(1)
    .repeats(2, 500, 500)

    .wait(250)

    .effect()
    .name(id)
    .file(closest("jb2a.static_electricity.03.blue"))
    .attachTo(target)
    .scaleToObject(1.25)
    .opacity(1)
    .playbackRate(1)
    .fadeOut(1000)
    .randomRotation()
    .filter("ColorMatrix", { hue: -15, saturate: 1 })
    .repeats(3, 300, 300)

    .motion(target)
    .name(id)
    .noise({ strength: 0.05, frequency: 50, duration: 4000, gridUnits: true });

await sequence.play({ preload: true });
