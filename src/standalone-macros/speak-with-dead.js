// Standalone Macro: Speak with Dead
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const id = "speakWithDead";
const label = `${id} - ${token.id}`;

// Check if effect is already playing
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;

if (isPlaying) {
    let opacity = new Sequence().animation().on(token).opacity(1);
    opacity.play();
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
} else {
    const sound = {
        enabled: false,
        file: "psfx.magic-signs.circle.v1.necromancy.complete",
        volume: 0.5,
    };

    // Main sequence creation
    let sequence = new Sequence()
        .sound().name(label).volume(sound.volume).file(sound.file).playIf(sound.enabled)
        .addSequence(_addMagicCircleEffects(token, label))
        .wait(500)
        .addSequence(_addCornerFlameEffects(token, label, 0.5, 0.5, 2)) // Bottom Right Flame
        .addSequence(_addCornerFlameEffects(token, label, -0.5, 0.5, 2)) // Bottom Left Flame
        .addSequence(_addCornerFlameEffects(token, label, -0.5, -0.5, 1)) // Top Left Flame
        .addSequence(_addCornerFlameEffects(token, label, 0.5, -0.5, 1)) // Top Right Flame
        .addSequence(_addTokenVisualEffects(token, label));

    sequence.play();
}


// ==========================================
// Helper Functions
// ==========================================

function _addMagicCircleEffects(token, id) {
    let seq = new Sequence()
        .effect()
        .name(id)
        .atLocation(token)
        .file("jb2a.magic_signs.circle.02.necromancy.loop.blue")
        .scaleToObject(1.25)
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { hue: -65 })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 60000 })
        .belowTokens()
        .fadeOut(2000)
        .zIndex(0)
        .persist()

        .effect()
        .name(id)
        .atLocation(token)
        .file("jb2a.magic_signs.circle.02.necromancy.loop.green")
        .scaleToObject(1.25)
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .belowTokens(true)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .filter("Blur", { blurX: 5, blurY: 5 })
        .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 60000 })
        .zIndex(1)
        .duration(1200)
        .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
        .fadeOut(300, { ease: "linear" });
    return seq;
}

function _addTokenVisualEffects(token, label) {
    let seq = new Sequence()
        .effect()
        .name(label)
        .delay(1000)
        .file("eskie.attack.ranged.arrow.01.physical.medium.green")
        .atLocation(token, { offset: { y: -0.75 * token.document.width }, gridUnits: true })
        .scaleToObject(2)
        .rotate(-90)
        .filter("ColorMatrix", { hue: -65 })
        .fadeIn(250)
        .filter("Blur", { blurX: 1, blurY: 50 })
        .zIndex(2)

        .effect()
        .name(label)
        .delay(100)
        .file("jb2a.particles.outward.blue.01.03")
        .atLocation(token)
        .scaleToObject(1.1)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.75, duration: 500, ease: "easeOutCubic", gridUnits: true })
        .animateProperty("sprite", "width", { from: 1, to: 0.5, duration: 100, ease: "easeOutCubic", gridUnits: true })
        .animateProperty("sprite", "height", { from: 1, to: 1.5, duration: 500, ease: "easeOutCubic", gridUnits: true })
        .fadeOut(500)
        .duration(500)
        .zIndex(2)

        .effect()
        .name(label)
        .delay(100)
        .file("jb2a.detect_magic.circle.blue")
        .atLocation(token)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { hue: -65 })
        .fadeOut(3500)
        .zIndex(1.5)

        .animation()
        .delay(200)
        .on(token)
        .opacity(0)

        .effect()
        .name(label)
        .file("jb2a.token_border.circle.static.blue.012")
        .attachTo(token, { bindAlpha: false, bindRotation: false })
        .scaleToObject(1.85, { considerTokenScale: true })
        .fadeIn(4000)
        .opacity(0.5)
        .filter("ColorMatrix", { hue: -65 })
        .zIndex(1.1)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.2, duration: 2000, delay: 2000, gridUnits: true, ease: "easeInSine" })
        .loopProperty("spriteContainer", "position.y", { from: 0, to: 0.05, duration: 2500, delay: 4000, gridUnits: true, ease: "easeInOutQuad", pingPong: true })
        .persist()

        .effect()
        .name(label)
        .delay(100)
        .copySprite(token)
        .attachTo(token, { bindAlpha: false, bindRotation: false })
        .scaleToObject(0.95, { considerTokenScale: true })
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(1.1)
        .persist()

        .effect()
        .name(label)
        .delay(2000)
        .file("jb2a.spirit_guardians.blue.spirits")
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindAlpha: false, bindRotation: false })
        .scaleToObject(1.35, { considerTokenScale: true })
        .persist()
        .filter("ColorMatrix", { hue: -65 })
        .opacity(0.65)
        .fadeIn(1000)
        .zIndex(0.1)

        .effect()
        .name(label)
        .delay(3000)
        .file("jb2a.magic_signs.rune.necromancy.complete.blue")
        .attachTo(token, { offset: { y: -0.77 * token.document.width }, gridUnits: true, bindAlpha: false, bindRotation: false })
        .scaleToObject(0.4, { considerTokenScale: true })
        .persist()
        .filter("ColorMatrix", { hue: -65 })
        .opacity(1)
        .loopProperty("spriteContainer", "position.y", { from: 0, to: 0.05, duration: 2500, delay: 1000, gridUnits: true, ease: "easeInOutQuad", pingPong: true })
        .zIndex(2)

        .effect()
        .name(label)
        .delay(3000)
        .file("jb2a.magic_signs.rune.necromancy.complete.blue")
        .attachTo(token, { offset: { y: -0.55 * token.document.width }, gridUnits: true, bindAlpha: false, bindRotation: false })
        .scaleToObject(0.4, { considerTokenScale: true })
        .persist()
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(2)

        .effect()
        .name(label)
        .delay(100)
        .copySprite(token)
        .attachTo(token, { bindAlpha: false, bindRotation: false })
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.2, duration: 2000, delay: 2000, gridUnits: true, ease: "easeInSine" })
        .animateProperty("sprite", "rotation", { from: 0, to: 15, duration: 1000, delay: 2500, ease: "easeInOutBack" })
        .animateProperty("sprite", "rotation", { from: 0, to: -15, duration: 1000, delay: 3000, ease: "easeInOutBack" })
        .loopProperty("spriteContainer", "position.y", { from: 0, to: 0.05, duration: 2500, delay: 4000, gridUnits: true, ease: "easeInOutQuad", pingPong: true })
        .persist()
        .zIndex(0.2)
        .waitUntilFinished(-500);

    return seq;
}

function _addCornerFlameEffects(token, id, xOffset, yOffset, smokeZIndex) {
    let seq = new Sequence()
        .effect()
        .name(id)
        .atLocation(token, { offset: { x: xOffset, y: yOffset }, gridUnits: true })
        .file("jb2a.impact.008.blue")
        .filter("ColorMatrix", { hue: -65 })
        .scaleToObject(1)
        .zIndex(1)

        .effect()
        .name(id)
        .atLocation(token, { offset: { x: xOffset, y: yOffset }, gridUnits: true })
        .file("jb2a.flames.01.blue")
        .belowTokens()
        .filter("ColorMatrix", { hue: -65 })
        .scaleToObject(0.5)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .randomizeMirrorX()
        .persist()

        .effect()
        .name(id)
        .delay(250)
        .atLocation(token, { offset: { x: xOffset, y: yOffset - 0.35 }, gridUnits: true })
        .file("eskie.smoke.05.black")
        .scaleToObject(0.8)
        .opacity(0.4)
        .tint("#6ff087")
        .fadeIn(500)
        .zIndex(smokeZIndex)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .randomizeMirrorX()
        .persist();

    return seq;
}
