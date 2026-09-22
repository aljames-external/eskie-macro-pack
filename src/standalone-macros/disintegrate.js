// Standalone Macro: Disintegrate
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Disintegrate' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the default path if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const DEFAULT_CONFIG = {
    id: "disintegrate",
    targetDeath: true,
    duration: 500,
    effect: {
        smoke: {
            img: "eskie.smoke.05.tan",
            delay: 1000,
            duration: 10000,
            scale: 0.5,
        },
        spirit: {
            img: "jb2a.spirit_guardians.green.particles",
            duration: 7500,
            scale: 0.35,
        },
        beam: [
            { img: "jb2a.magic_signs.circle.02.transmutation.loop.dark_green" },
            { img: "jb2a.particles.outward.white.01.02" },
            { img: "jb2a.extras.tmfx.border.circle.inpulse.01.fast" },
            { img: "jb2a.disintegrate.green" },
        ],
    },
};

const id = DEFAULT_CONFIG.id ?? "disintegrate";
const label = `${id}-${token.id}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: id }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: id });
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: label, object: target });
        Sequencer.EffectManager.endEffects({ name: id, object: target });
        new Sequence().motion(target).scaleTo(1, { duration: 300 }).fadeTo(1).play();
    }
    return;
}

function buildDissolveSequence(target, effectId) {
    return new Sequence()
        .motion(target)
        .scaleTo(0.01, { duration: 300 })
        .fadeTo(0);
}

function buildBeamSequence(casterToken, targetToken, effectId, beamEffects) {
    const seq = new Sequence()
        // Dark green transmutation spell circle on caster
        .effect()
        .name(effectId)
        .atLocation(casterToken)
        .file(closest(beamEffects[0]?.img ?? "jb2a.magic_signs.circle.02.transmutation.loop.dark_green"))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens()
        .fadeOut(2000)
        .zIndex(0)

        // Saturated glow circle on caster
        .effect()
        .name(effectId)
        .atLocation(casterToken)
        .file(closest(beamEffects[0]?.img ?? "jb2a.magic_signs.circle.02.transmutation.loop.dark_green"))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens(true)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(0.1)
        .duration(1200)
        .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
        .fadeOut(300, { ease: "linear" })

        // Outward energy particles right
        .effect()
        .name(effectId)
        .file(closest(beamEffects[1]?.img ?? "jb2a.particles.outward.white.01.02"))
        .scaleIn(0, 1000, { ease: "easeOutQuint" })
        .delay(500)
        .fadeOut(1000)
        .atLocation(casterToken)
        .duration(1000)
        .size(1.75, { gridUnits: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
        .zIndex(1)

        // Outward energy particles left (mirrored)
        .effect()
        .name(effectId)
        .file(closest(beamEffects[1]?.img ?? "jb2a.particles.outward.white.01.02"))
        .scaleIn(0, 1000, { ease: "easeOutQuint" })
        .delay(500)
        .fadeOut(1000)
        .atLocation(casterToken)
        .duration(1000)
        .size(1.75, { gridUnits: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, gridUnits: true, duration: 1000 })
        .zIndex(1)
        .mirrorX()

        .wait(1000)

        // Energy impulse border ring
        .effect()
        .name(effectId)
        .file(closest(beamEffects[2]?.img ?? "jb2a.extras.tmfx.border.circle.inpulse.01.fast"))
        .atLocation(casterToken)
        .tint("#d9df53")
        .scaleToObject(1.5)

        .wait(500)

        // Thin green disintegrate beam stretching to target
        .effect()
        .name(effectId)
        .file(closest(beamEffects[3]?.img ?? "jb2a.disintegrate.green"))
        .atLocation(casterToken)
        .stretchTo(targetToken)
        .zIndex(1)

        .wait(500);

    return seq;
}

function buildDeathSequence(targetToken, effectId, smokeEffect, spiritEffect) {
    const seq = new Sequence()
        // Dust / ash explosion smoke puff (tan smoke zeroed in brightness = black ash)
        .effect()
        .name(effectId)
        .file(closest(smokeEffect?.img ?? "eskie.smoke.05.tan"))
        .atLocation(targetToken, { offset: { y: -0.25 }, gridUnits: true })
        .fadeIn(1000)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .delay(smokeEffect?.delay ?? 1000)
        .duration(smokeEffect?.duration ?? 10000)
        .fadeOut(500)
        .scaleToObject(smokeEffect?.scale ?? 0.5)
        .filter("ColorMatrix", { brightness: 0 })
        .zIndex(0.1)
        .belowTokens()

        // Swirling green spirit particle rise
        .effect()
        .name(effectId)
        .file(closest(spiritEffect?.img ?? "jb2a.spirit_guardians.green.particles"))
        .atLocation(targetToken)
        .duration(spiritEffect?.duration ?? 7500)
        .fadeOut(3000)
        .scaleToObject(spiritEffect?.scale ?? 0.35)
        .filter("ColorMatrix", { hue: -25 })
        .belowTokens()

        // Dynamic dissolving mask turning token to ash
        .addSequence(buildDissolveSequence(targetToken, effectId))
        .wait(1500);

    return seq;
}

const mainSequence = new Sequence();
const beamEffects = DEFAULT_CONFIG.effect?.beam ?? [];
const smokeEffect = DEFAULT_CONFIG.effect?.smoke ?? {};
const spiritEffect = DEFAULT_CONFIG.effect?.spirit ?? {};

for (const target of targets) {
    const beamSeq = buildBeamSequence(token, target, label, beamEffects);
    const deathSeq = buildDeathSequence(target, label, smokeEffect, spiritEffect);
    mainSequence.addSequence(beamSeq);
    if (DEFAULT_CONFIG.targetDeath ?? true) {
        mainSequence.addSequence(deathSeq);
    }
}

await mainSequence.play();
