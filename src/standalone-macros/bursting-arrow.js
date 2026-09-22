// Standalone Macro: Bursting Arrow
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Bursting Arrow' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const targetWidth = target.document?.width ?? target.width ?? 1;

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("eskie.casting.physical.03.side.one_shot.white"))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2)
        .waitUntilFinished(-750)

    .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.white.slow"))
        .atLocation(token)
        .stretchTo(target)
        .loopProperty("sprite", "position.y", { from: -0.05, to: 0.05, duration: 50, gridUnits: true, pingPong: true })
        .opacity(0.5)
        .zIndex(3)

    .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.white.slow"))
        .atLocation(token)
        .stretchTo(target)
        .zIndex(2)
        .waitUntilFinished(-750)

    .canvasPan()
        .delay(200)
        .shake({ duration: 500, strength: 4, rotation: false, fadeOut: 500 })

    .effect()
        .file(closest("jb2a.explosion.04.blue"))
        .atLocation(target)
        .size(3.5 + targetWidth, { gridUnits: true })
        .opacity(0.75)
        .filter("ColorMatrix", { saturate: -1 })

    .effect()
        .delay(200)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(target)
        .size(3.75 + targetWidth, { gridUnits: true })
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { saturate: -1 })
        .zIndex(1)

    .effect()
        .delay(200)
        .file(closest("jb2a.impact.ground_crack.still_frame.01"))
        .atLocation(target)
        .size(4 + targetWidth, { gridUnits: true })
        .fadeIn(250)
        .fadeOut(1000)
        .duration(2500)
        .opacity(0.75)
        .belowTokens();

const hitTargets = Array.from(game.user.targets);
for (const t of hitTargets) {
    const targetSeq = new Sequence()
        .motion(t)
            .noise()
            .duration(1000)
        .effect()
            .file(closest("eskie.damage.force.01.white"))
            .attachTo(t, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(1.5, { considerTokenScale: true })
            .zIndex(1);

    sequence.addSequence(targetSeq);
}

await sequence.play();
