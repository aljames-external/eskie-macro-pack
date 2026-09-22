// Standalone Macro: Vicious Mockery
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Vicious Mockery' macro requires the 'Sequencer' module to be installed and active!");
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
    id: "viciousMockery",
    word: "Haha!",
};

const id = DEFAULT_CONFIG.id ?? "viciousMockery";
const label = `${id}-${token.id}`;
const word = DEFAULT_CONFIG.word ?? "Haha!";

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct string path if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// 3. Toggle / Re-entrant Persistent Effect Handling
let isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: id }).length > 0;

for (const target of targets) {
    const targetLabel = `${id}-${target.id}`;
    if (Sequencer.EffectManager.getEffects({ name: targetLabel }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0) {
        isPlaying = true;
        break;
    }
}

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: id });
    for (const target of targets) {
        const targetLabel = `${id}-${target.id}`;
        Sequencer.EffectManager.endEffects({ name: targetLabel, object: target });
        Sequencer.EffectManager.endEffects({ name: targetLabel });
        Sequencer.EffectManager.endEffects({ name: id, object: target });
    }
    return;
}

const sequence = new Sequence();

// -------------------------------------------------------------
// CASTING SEQUENCE (BARDIC ENCHANTMENT CIRCLE & MUSICAL NOTES)
// -------------------------------------------------------------

// Enchantment circle below caster token
sequence.effect()
    .name(label)
    .atLocation(token)
    .file(closest("jb2a.magic_signs.circle.02.enchantment.loop.purple"))
    .scaleToObject(1.25)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
    .belowTokens()
    .fadeOut(2000)
    .zIndex(0);

// Glowing bright blur circle overlay on caster token
sequence.effect()
    .name(label)
    .atLocation(token)
    .file(closest("jb2a.magic_signs.circle.02.enchantment.loop.purple"))
    .scaleToObject(1.25)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
    .belowTokens(true)
    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .zIndex(1)
    .duration(1200)
    .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
    .fadeOut(300, { ease: "linear" });

const musicNotes = ["bass_clef", "beamed_quavers", "crotchet", "flat", "quaver", "treble_clef"];
const getMusicNote = () => closest(`jb2a.music_notations.${musicNotes[Math.floor(Math.random() * musicNotes.length)]}.purple`);

// Bardic musical notations bursting around caster token
sequence.effect()
    .name(label)
    .file(() => getMusicNote())
    .scaleIn(0, 500, { ease: "easeOutQuint" })
    .delay(500)
    .atLocation(token, { offset: { y: -0.2 }, gridUnits: true, randomOffset: 1.5 })
    .scaleToObject(0.5)
    .zIndex(1)
    .playbackRate(1.5)
    .repeats(5, 200, 200)
    .fadeOut(500);

// -------------------------------------------------------------
// PROJECTILE & IMPACT SEQUENCE FOR EACH TARGET
// -------------------------------------------------------------
for (const target of targets) {
    const targetLabel = `${id}-${target.id}`;
    const targetWidth = target.document?.width ?? 1;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;


    const textStyle = {
        fill: "#ffffff",
        fontFamily: "Helvetica",
        fontSize: 48 * targetWidth,
        strokeThickness: 0,
        fontWeight: "bold",
    };

    // Fast blue energy pulse on impact
    sequence.effect()
        .name(targetLabel)
        .atLocation(target, { offset: { x: -0.25 * targetWidth, y: -0.3 * targetWidth }, randomOffset: 0.1, gridUnits: true })
        .file(closest("eskie.pulse.energy.02.fast.blue"))
        .fadeOut(250)
        .scale(0.25 * targetWidth)
        .scaleIn(0, 500, { ease: "easeOutBack" })
        .zIndex(0)
        .animateProperty("spriteContainer", "position.x", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("spriteContainer", "position.y", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 10, ease: "easeOutElastic" })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .filter("ColorMatrix", { hue: 50 });

    // Dynamic orange outward particles on impact
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.particles.outward.orange.02.03"))
        .atLocation(target, { offset: { x: -0.25 * targetWidth, y: -0.3 * targetWidth }, randomOffset: 0.1, gridUnits: true })
        .scale(0.25 * targetWidth)
        .duration(800)
        .fadeOut(200)
        .animateProperty("spriteContainer", "position.x", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("spriteContainer", "position.y", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 10, ease: "easeOutElastic" })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .zIndex(2);

    // Mockery word insult polygon text animation with purple glow mask
    sequence.effect()
        .name(targetLabel)
        .atLocation(target, { offset: { x: -0.25 * targetWidth, y: -0.3 * targetWidth }, randomOffset: 0.1, gridUnits: true })
        .text(`${word}`, textStyle)
        .duration(2000)
        .fadeOut(1000)
        .animateProperty("spriteContainer", "position.x", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("spriteContainer", "position.y", { from: -0.6, to: 0, duration: 600, gridUnits: true, ease: "easeInExpo" })
        .animateProperty("sprite", "rotation", { from: 0, to: 45, duration: 10, ease: "easeOutElastic" })
        .animateProperty("sprite", "rotation", { from: -2.5, to: 2.5, duration: 500, ease: "easeOutElastic", delay: 650 })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .filter("Glow", { color: 0x6820ee })
        .zIndex(2)
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -2, y: -2 }, { x: 1.175, y: -1 }, { x: -1, y: 1.175 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        });

    // Purple impact burst (psychic shock impact)
    sequence.effect()
        .name(targetLabel)
        .delay(600)
        .file(closest("jb2a.impact.010.purple"))
        .atLocation(target, { offset: { x: -0.25 * targetWidth, y: -0.3 * targetWidth }, gridUnits: true })
        .scaleToObject(1.25)
        .zIndex(1);


    // Psychic recoil wobble noise motion on target
    sequence.motion(target)
        .name(targetLabel)
        .delay(600)
        .noise({ strength: 0.05, frequency: 50, duration: 1800, gridUnits: true });


    // Confused / mockery emote #1
    sequence.effect()
        .name(targetLabel)
        .delay(800)
        .file(closest("eskie.emote.confused"))
        .atLocation(target, { offset: { x: 0, y: -0.5 * targetWidth }, gridUnits: true })
        .scaleToObject(0.75)
        .playbackRate(1.5)
        .rotate(-20)
        .filter("ColorMatrix", { hue: -100 });

    // Confused / mockery emote #2
    sequence.effect()
        .name(targetLabel)
        .delay(1100)
        .file(closest("eskie.emote.confused"))
        .atLocation(target, { offset: { x: -0.5 * targetWidth, y: 0 }, gridUnits: true })
        .scaleToObject(0.75)
        .playbackRate(1.5)
        .rotate(15)
        .filter("ColorMatrix", { hue: -100 });
}

await sequence.play();
