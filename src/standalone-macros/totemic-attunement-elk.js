// Standalone Macro: Totemic Attunement - Elk
// Last Updated: 1/27/2025
// Author: .eskie
// Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Elk Totemic Attunement' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your Barbarian token!");

const target = game.user.targets.first();

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const color = "red";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `Elk Totemic Attunement - ${tokenId}`;

const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    return ui.notifications.info("Ended Elk Totemic Attunement.");
}

const seq = new Sequence();

// Elk charge flower particle trailing surge around attacker
seq.effect()
    .file(closest("eskie.smoke.03.tan"))
    .attachTo(token, { bindAlpha: false, bindRotation: false })
    .scaleToObject(2)
    .opacity(0.6)
    .belowTokens();

seq.effect()
    .name(label)
    .file(closest(`eskie.nature.flower.particle.01.${color}`))
    .attachTo(token)
    .scaleToObject(1.5)
    .fadeIn(1000)
    .fadeOut(250)
    .persist()
    .zIndex(1);

// Optional Prone / Trample knock-down animation if targeting an enemy
if (target) {
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
    const tokenCenter = token.center ?? { x: token.x, y: token.y };
    const targetCenter = target.center ?? { x: target.x, y: target.y };
    const gridSize = canvas.grid?.size ?? 100;

    const pushDistance = 10;
    const dx = targetCenter.x - tokenCenter.x;
    const dy = targetCenter.y - tokenCenter.y;
    const dist = Math.hypot(dx, dy) || 1;

    const pushOffset = {
        x: (dx / dist) * (gridSize * (pushDistance / 5)),
        y: (dy / dist) * (gridSize * (pushDistance / 5)),
    };

    seq.effect()
        .delay(100)
        .file(closest(`eskie.damage.bludgeoning.01.${color}`))
        .attachTo(target, { bindAlpha: false, bindRotation: false })
        .scaleToObject(1.5)
        .opacity(1)
        .zIndex(1)
        .belowTokens()
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", gridUnits: true })
        .filter("ColorMatrix", { saturate: 1 });

    // Target elk charge knockback push and prone rotation tilt using Sequencer 4.3.0+ sequence.motion(target).moveBy()
    seq.motion(target)
        .rotateTo(targetRotation + 90)
        .moveBy(pushOffset, { duration: 500, ease: "easeOutCubic" });

    seq.effect()
        .file(closest("eskie.smoke.03.tan"))
        .attachTo(target, { bindAlpha: false, bindRotation: false })
        .scaleToObject(2)
        .opacity(0.8)
        .belowTokens();
}

await seq.play();
