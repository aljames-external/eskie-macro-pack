// Standalone Macro: Enlarge / Reduce
// Original Author: EskieMoh#2969
// Update Author: bakanabaka
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Enlarge / Reduce' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "enlargeReduce";
const tokenId = token.id ?? token.document?.id ?? "";
const enlargeLabel = `${id}-enlarge - ${tokenId}`;
const reduceLabel = `${id}-reduce - ${tokenId}`;
const scaleFactor = 1;

// Check if effect is already active on the token for toggle support
const activeEnlarge = Sequencer.EffectManager.getEffects({ name: enlargeLabel, object: token });
const activeReduce = Sequencer.EffectManager.getEffects({ name: reduceLabel, object: token });

if ((activeEnlarge?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: enlargeLabel, object: token });
    await playReduce(token, { isToggleOff: true });
    return;
}

if ((activeReduce?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: reduceLabel, object: token });
    await playEnlarge(token, { isToggleOff: true });
    return;
}

// Dialog to choose between Enlarge (Grow) and Reduce (Shrink)
const choice = await Dialog.wait({
    title: "Enlarge / Reduce",
    content: "<p style='text-align: center;'>Select effect mode for target token:</p>",
    buttons: {
        enlarge: {
            icon: '<i class="fas fa-expand-alt" style="color: #ff8800;"></i>',
            label: "Enlarge (Grow)",
            callback: () => "enlarge"
        },
        reduce: {
            icon: '<i class="fas fa-compress-alt" style="color: #4488ff;"></i>',
            label: "Reduce (Shrink)",
            callback: () => "reduce"
        }
    },
    default: "enlarge",
    close: () => null
});

if (!choice) return;

if (choice === "enlarge") {
    await playEnlarge(token);
} else if (choice === "reduce") {
    await playReduce(token);
}

/**
 * Plays the Enlarge animation and resizes the token larger.
 *
 * @param {Token} token The token to enlarge.
 * @param {object} options Options flag for toggling off state.
 */
async function playEnlarge(token, options = {}) {
    const sequence = new Sequence();

    const currentHeight = token.document?.height ?? token.height ?? 1;
    const currentWidth = token.document?.width ?? token.width ?? 1;
    const targetHeight = (currentHeight > 0.5) ? currentHeight + scaleFactor : 1;
    const targetWidth = (currentWidth > 0.5) ? currentWidth + scaleFactor : 1;
    const targetScale = targetWidth / currentWidth;

    sequence
        .effect()
            .file(closest("jb2a.static_electricity.03.orange"))
            .atLocation(token)
            .duration(3000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .zIndex(2);

    sequence
        .motion(token)
        .scaleTo(targetScale, { duration: 1000, ease: "easeOutBounce" });

    sequence
        .thenDo(function () {
            return token.document.update({
                height: targetHeight,
                width: targetWidth,
                scale: 1,
            }, { animate: false });
        })

        .effect()
            .file(closest("jb2a.extras.tmfx.outpulse.circle.01.fast"))
            .atLocation(token)
            .belowTokens()
            .opacity(0.75)
            .scaleToObject(2)
            .zIndex(1)

        .effect()
            .file(closest("jb2a.impact.ground_crack.orange.02"))
            .atLocation(token)
            .belowTokens()
            .scaleToObject(2)
            .zIndex(0)

        .effect()
            .file(closest("jb2a.particles.outward.orange.01.04"))
            .scaleIn(0.25, 500, { ease: "easeOutQuint" })
            .fadeIn(500)
            .fadeOut(1000)
            .atLocation(token)
            .randomRotation()
            .duration(3000)
            .scaleToObject(1.5)
            .zIndex(4)

        .effect()
            .file(closest("jb2a.static_electricity.03.orange"))
            .atLocation(token)
            .duration(5000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .waitUntilFinished(-3000);

    if (!options.isToggleOff) {
        sequence.effect()
            .name(enlargeLabel)
            .attachTo(token)
            .persist()
            .private();
    }

    await sequence.play();
}

/**
 * Plays the Reduce animation and resizes the token smaller.
 *
 * @param {Token} token The token to reduce.
 * @param {object} options Options flag for toggling off state.
 */
async function playReduce(token, options = {}) {
    const sequence = new Sequence();

    const currentHeight = token.document?.height ?? token.height ?? 1;
    const currentWidth = token.document?.width ?? token.width ?? 1;
    const targetHeight = (currentHeight - scaleFactor) > 0 ? currentHeight - scaleFactor : 0.5;
    const targetWidth = (currentWidth - scaleFactor) > 0 ? currentWidth - scaleFactor : 0.5;
    const targetScale = targetWidth / currentWidth;

    sequence
        .effect()
            .file(closest("jb2a.static_electricity.03.orange"))
            .atLocation(token)
            .duration(3000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .zIndex(2);

    sequence
        .motion(token)
        .scaleTo(targetScale, { duration: 1000, ease: "easeOutBounce" });

    sequence
        .thenDo(function () {
            return token.document.update({
                height: targetHeight,
                width: targetWidth,
                scale: 1,
            }, { animate: false });
        })

        .effect()
            .file(closest("jb2a.extras.tmfx.outpulse.circle.01.fast"))
            .atLocation(token)
            .opacity(0.75)
            .scaleToObject(2)
            .zIndex(1)

        .effect()
            .file(closest("jb2a.energy_strands.in.yellow.01.2"))
            .atLocation(token)
            .belowTokens()
            .scaleToObject(2)
            .zIndex(0)

        .effect()
            .file(closest("jb2a.particles.outward.orange.01.04"))
            .scaleIn(0.25, 500, { ease: "easeOutQuint" })
            .fadeIn(500)
            .fadeOut(1000)
            .atLocation(token)
            .randomRotation()
            .duration(3000)
            .scaleToObject(1.5)
            .zIndex(4)

        .effect()
            .file(closest("jb2a.static_electricity.03.orange"))
            .atLocation(token)
            .duration(5000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .waitUntilFinished(-3000);

    if (!options.isToggleOff) {
        sequence.effect()
            .name(reduceLabel)
            .attachTo(token)
            .persist()
            .private();
    }

    await sequence.play();
}
