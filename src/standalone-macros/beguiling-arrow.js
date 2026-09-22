// Standalone Macro: Beguiling Arrow
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Beguiling Arrow' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("eskie.casting.physical.03.side.one_shot.purple"))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2)
        .filter("ColorMatrix", { hue: 35, brightness: 1 })
        .waitUntilFinished(-750)

    .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.purple.slow"))
        .atLocation(token)
        .stretchTo(target, { attachTo: false })
        .zIndex(2)
        .filter("ColorMatrix", { hue: 35, brightness: 1 })
        .waitUntilFinished(-750)

    .motion(target)
        .noise()
        .duration(1000)

    .effect()
        .file(closest("jb2a.impact_themed.heart.02.pink"))
        .attachTo(target)
        .scaleToObject(1.25, { considerTokenScale: true })
        .zIndex(1)

    .effect()
        .file(closest("eskie.damage.psychic.01.pink"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(1.5, { considerTokenScale: true })
        .zIndex(1)

    .effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(500)
        .duration(8750)
        .fadeOut(1000)
        .opacity(0.75)
        .rotate(0)
        .belowTokens()
        .filter("Glow", { color: 0xfd5dbb, distance: 10, outerStrength: 4, innerStrength: 0 })
        .filter("ColorMatrix", { saturate: -0.2, brightness: 1.2 })

    .effect()
        .file(closest("jb2a.template_circle.symbol.out_flow.heart.pink"))
        .attachTo(target)
        .scaleToObject(1.75, { considerTokenScale: true })
        .fadeIn(500)
        .duration(8750)
        .belowTokens()
        .fadeOut(1000)

    .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .attachTo(target)
        .scaleToObject(0.95, { considerTokenScale: true })
        .fadeIn(500)
        .duration(8750)
        .fadeOut(1000)
        .playbackRate(1.25)
        .tint("#fd5dbb")
        .zIndex(1);

await sequence.play();
