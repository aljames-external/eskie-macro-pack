// Standalone Macro: Shadow Arrow
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Shadow Arrow' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const label = `${target.name} Shadow Arrow`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    return ui.notifications.info(`Ended Shadow Arrow on ${target.name}.`);
}

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("eskie.casting.physical.03.side.one_shot.purple"))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2)
        .filter("ColorMatrix", { hue: -35, brightness: 0.2 })
        .waitUntilFinished(-750)

    .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.purpleblack.slow"))
        .atLocation(token)
        .stretchTo(target)
        .zIndex(2)
        .filter("ColorMatrix", { hue: -35, brightness: 0.2 })
        .waitUntilFinished(-750)

    .motion(target)
        .noise({ strength: 0.05, frequency: 50, duration: 1000, gridUnits: true })

    .effect()
        .file(closest("eskie.damage.psychic.01.darkpurple"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(1.5, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1 })
        .zIndex(1)

    .effect()
        .file(closest("jb2a.smoke.puff.centered.dark_black"))
        .atLocation(target)
        .scaleToObject(1.65, { considerTokenScale: true })
        .randomRotation()
        .repeats(3, 250, 250)
        .belowTokens()
        .playbackRate(1.2)
        .zIndex(2)

    .effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .rotate(0)
        .fadeIn(2000)
        .fadeOut(1500)
        .duration(4500)
        .filter("ColorMatrix", { saturate: -1, brightness: 0.75 })

    .effect()
        .name(label)
        .delay(1000)
        .file(closest("jb2a.sleep.cloud.02.dark_purple"))
        .attachTo(target, { offset: { y: 0 }, gridUnits: true, local: true })
        .scaleToObject(1.5, { considerTokenScale: true })
        .spriteScale({ x: 1, y: 1 })
        .fadeIn(1500)
        .opacity(1)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .loopProperty("alphaFilter", "alpha", { from: -0.2, to: 0, duration: 2500, pingPong: true })
        .belowTokens()
        .persist()

    .effect()
        .name(label)
        .delay(1000)
        .file(closest("jb2a.extras.tmfx.inflow.circle.02"))
        .attachTo(target, { offset: { y: 0 }, gridUnits: true, local: true })
        .scaleToObject(1.1, { considerTokenScale: true })
        .spriteScale({ x: 1, y: 1 })
        .fadeIn(1500)
        .opacity(1)
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .loopProperty("alphaFilter", "alpha", { from: -0.2, to: 0, duration: 2500, pingPong: true })
        .mask()
        .persist()

    .effect()
        .name(label)
        .file(closest("eskie.symbol.eye.01.purple"))
        .attachTo(target, { offset: { y: 0 }, gridUnits: true, local: true })
        .scaleToObject(0.45, { considerTokenScale: true })
        .fadeIn(1500)
        .opacity(0.8)
        .filter("ColorMatrix", { saturate: -1 })
        .persist()
        .zIndex(1);

await sequence.play();
