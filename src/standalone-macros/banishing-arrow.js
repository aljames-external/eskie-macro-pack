// Standalone Macro: Banishing Arrow
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Banishing Arrow' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const label = `${target.name} Banishing Arrow`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    await new Sequence().motion(target).scaleTo(1).play();
    return ui.notifications.info(`Ended Banishing Arrow on ${target.name}.`);
}

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("eskie.casting.physical.03.side.one_shot.purple"))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2)
        .waitUntilFinished(-1250)

    .motion(target)
        .scaleTo(0)
        .rotateBy(360)

    .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.purple.slow"))
        .atLocation(token)
        .stretchTo(target)
        .zIndex(2)
        .waitUntilFinished(-750)

    .effect()
        .file(closest("eskie.damage.piercing.01.red"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(1.5, { considerTokenScale: true })
        .filter("ColorMatrix", { hue: -75 })
        .zIndex(1)

    .effect()
        .file(closest("jb2a.portals.horizontal.vortex.purple"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(0.25, { considerTokenScale: true })
        .fadeIn(250)
        .scaleIn(0, 250, { ease: "easeOutBack" })
        .scaleOut(0, 900, { ease: "easeInSine" })
        .duration(1150)

    .effect()
        .delay(250)
        .file(closest("jb2a.cast_generic.02.dark_purple"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(1)

    .effect()
        .file(closest("jb2a.energy_strands.in.purple.01"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(1.5, { considerTokenScale: true })
        .playbackRate(2)
        .scaleOut(0, 1000, { ease: "easeInSine" })
        .fadeOut(250)

    .effect()
        .delay(1000)
        .file(closest("eskie.star.02.purple"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(0.8, { considerTokenScale: true })
        .zIndex(2)

    .effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.outflow.circle.04"))
        .attachTo(target, { bindVisibility: false, bindAlpha: false })
        .scaleToObject(1, { considerTokenScale: true })
        .rotateIn(-360, 500, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeInOutCirc" })
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .persist()
        .filter("ColorMatrix", { brightness: -1 });

await sequence.play();
