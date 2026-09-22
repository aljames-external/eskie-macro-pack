// Standalone Macro: Shapechange
// Original Author: EskieMoh#2969
// Update Author: bakanabaka
// Modular Standalone Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Shapechange' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const DEFAULT_CONFIG = {
    id: "shapechange",
    hybridForm: "https://files.d20.io/images/390116904/V1XE3gOTz6-hHEg-_jQt3g/original.png",
    wolfForm: "https://files.d20.io/images/390116931/NRBle2scKhQmU-q0EHskPw/original.png",
};

// Fetch or record human base form in flags
let shapechangeData = token.document?.getFlag("eskie-macros", "shapechange");
const currentTexture = token.document?.texture?.src ?? "";
if (!shapechangeData) {
    shapechangeData = { baseForm: currentTexture };
    await token.document?.setFlag("eskie-macros", "shapechange", shapechangeData);
} else if (!shapechangeData.baseForm) {
    shapechangeData.baseForm = currentTexture;
    await token.document?.setFlag("eskie-macros", "shapechange", shapechangeData);
}

// Toggle re-entrant handling: if token is shifted, revert back to human form
if (shapechangeData.baseForm && currentTexture !== shapechangeData.baseForm) {
    await playRevert(token);
    return;
}

// Dialog prompt for player choice of form
const choice = await Dialog.wait({
    title: "Change Shape",
    content: "<p style='text-align: center; margin-bottom: 10px;'>Select a wild shape form to shift into:</p>",
    buttons: {
        hybrid: {
            icon: '<i class="fas fa-paw" style="color: #d4a373;"></i>',
            label: "Hybrid Form",
            callback: () => "hybrid"
        },
        wolf: {
            icon: '<i class="fas fa-dog" style="color: #a3b18a;"></i>',
            label: "Wolf Form",
            callback: () => "wolf"
        }
    },
    default: "hybrid",
    close: () => null
});

if (!choice) return;

const targetForm = choice === "hybrid" ? DEFAULT_CONFIG.hybridForm : DEFAULT_CONFIG.wolfForm;
await playShapechange(token, targetForm);

/**
 * Executes the forward Shapechange transformation sequence with primal energy cocoon,
 * token ghosts, wild shape morph flash, and claw impacts.
 */
async function playShapechange(token, targetForm) {
    const sequence = new Sequence();
    const tokenWidth = token.document?.width ?? 1;
    const scaleX = token.document?.texture?.scaleX ?? 1;

    // 1. Dark outflow vortex beneath token — builds atmosphere
    sequence
        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(token)
        .duration(5000)
        .fadeIn(500)
        .scaleIn(0, 750, { ease: "easeOutSine" })
        .fadeOut(500)
        .scaleToObject(1.5, { considerTokenScale: true })
        .randomRotation()
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .animateProperty("sprite", "width", {
            from: 0,
            to: 0.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeOutCubic",
            delay: 2600,
        })
        .animateProperty("sprite", "height", {
            from: 0,
            to: 0.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeOutCubic",
            delay: 2600,
        })
        .belowTokens();

    // 2. Swirling dark vortex ring
    sequence
        .effect()
        .delay(400)
        .file(closest("jb2a.template_circle.vortex.loop.dark_black"))
        .attachTo(token)
        .duration(4000)
        .fadeIn(500)
        .scaleIn(0, 2400, { ease: "easeOutSine" })
        .fadeOut(500)
        .scaleToObject(1.55, { considerTokenScale: true })
        .randomRotation()
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .belowTokens();

    // 3. Shapechange transformation warp and shudder via Sequencer 4.3.0+ sequence.motion(token).scaleTo(1.25).noise()
    sequence
        .motion(token)
        .scaleTo(1.25, { duration: 500 })
        .noise({ strength: 0.05, frequency: 50, gridUnits: true });

    // 4. First target form ghost — very faint, brightened
    sequence
        .effect()
        .file(closest(targetForm))
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.25)
        .filter("ColorMatrix", { brightness: 0.75 });

    // 5. Second target form ghost — intermediate shape
    sequence
        .effect()
        .file(closest(targetForm))
        .delay(800)
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.5)
        .filter("ColorMatrix", { brightness: 0.5 });

    // 6. Third target form ghost — nearly solid wild manifest
    sequence
        .effect()
        .file(closest(targetForm))
        .delay(1600)
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.75)
        .filter("ColorMatrix", { brightness: 0.25 });

    // 7. Glowing red eyes flash at peak of transformation
    sequence
        .effect()
        .delay(3000)
        .file(closest("jb2a.eyes.01.dark_red.single"))
        .duration(1250)
        .attachTo(token)
        .scaleToObject(1.15, { considerTokenScale: true })
        .fadeOut(500)
        .zIndex(1);

    // 8. Final blurred ghost of target form before swap
    sequence
        .effect()
        .file(closest(targetForm))
        .delay(2400)
        .attachTo(token)
        .duration(2000)
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", {
            from: tokenWidth * 1.1 * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 500,
            gridUnits: true,
            ease: "easeInOutBack",
        })
        .animateProperty("sprite", "height", {
            from: tokenWidth * scaleX,
            to: tokenWidth * 1.25 * scaleX,
            duration: 750,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 100,
            pingPong: true,
            gridUnits: true,
        })
        .opacity(0.75)
        .filter("ColorMatrix", { brightness: 0.2 })
        .waitUntilFinished(-500);

    // 9. Token image swap — change texture to selected form
    sequence.thenDo(function () {
        token.document?.update({ "texture.src": targetForm });
    });

    // 11. Claw slash impact — below token
    sequence
        .effect()
        .file(closest("jb2a.claws.200px.dark_red"))
        .atLocation(token)
        .scaleToObject(2.15, { considerTokenScale: true })
        .fadeOut(500)
        .playbackRate(1.5)
        .belowTokens()
        .zIndex(1);

    // 12. Dark impact burst beneath token
    sequence
        .effect()
        .file(closest("jb2a.impact.004.dark_red"))
        .atLocation(token)
        .scaleToObject(2.75, { considerTokenScale: true })
        .belowTokens()
        .fadeOut(500)
        .filter("ColorMatrix", { brightness: 0 })
        .opacity(0.85);

    await sequence.play();
}

/**
 * Executes the revert sequence restoring the token to its base human form,
 * complete with unravelling cocoon vortex, energy dissolution particle burst,
 * and texture restoration.
 */
async function playRevert(token) {
    const shapechangeData = token.document?.getFlag("eskie-macros", "shapechange");
    const baseForm = shapechangeData?.baseForm ?? token.document?.texture?.src ?? "";
    const currentForm = token.document?.texture?.src ?? "";

    const sequence = new Sequence();

    // Wide outflow vortex signaling unwinding transformation
    sequence
        .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .attachTo(token)
        .duration(6000)
        .fadeIn(500)
        .scaleIn(0, 750, { ease: "easeOutSine" })
        .scaleOut(0, 4000, { ease: "easeOutSine" })
        .fadeOut(500)
        .scaleToObject(1.75, { considerTokenScale: true })
        .randomRotation()
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .belowTokens();

    // Animal shape image fading slowly as spirit unbinds
    sequence
        .effect()
        .file(closest(currentForm))
        .attachTo(token)
        .duration(5000)
        .fadeOut(4000, { ease: "easeInSine" })
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty("spriteContainer", "position.x", {
            from: -0.005,
            to: 0.005,
            duration: 500,
            pingPong: true,
            gridUnits: true,
            delay: 1000,
        });

    sequence.wait(500);

    // White energy outward burst particles — animal form breaking apart
    sequence
        .effect()
        .delay(500)
        .file(closest("jb2a.particles.outward.white.01.03"))
        .attachTo(token, { offset: { y: 0 }, gridUnits: true, bindRotation: false })
        .scaleToObject()
        .duration(1000)
        .fadeOut(800)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .animateProperty("sprite", "width", {
            from: 0,
            to: 0.25,
            duration: 500,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .animateProperty("sprite", "height", {
            from: 0,
            to: 1.0,
            duration: 1000,
            gridUnits: true,
            ease: "easeOutBack",
        })
        .animateProperty("spriteContainer", "position.y", {
            from: 0,
            to: -0.6,
            duration: 1000,
            gridUnits: true,
        })
        .filter("ColorMatrix", { saturate: 0, brightness: 0 })
        .belowTokens()
        .randomizeMirrorX()
        .opacity(1)
        .repeats(14, 250, 250)
        .zIndex(0.3);

    // Swap token texture back to human base form
    sequence.thenDo(function () {
        if (baseForm) {
            token.document?.update({ "texture.src": baseForm });
        }
    });

    await sequence.play();
}
