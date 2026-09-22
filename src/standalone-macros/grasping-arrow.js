// Standalone Macro: Grasping Arrow
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Grasping Arrow' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const label = `Grasping Arrow ${target.name}`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    return ui.notifications.info(`Ended Grasping Arrow on ${target.name}.`);
}

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("eskie.casting.physical.03.side.one_shot.green"))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2)
        .waitUntilFinished(-750)

    .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.green.normal"))
        .atLocation(token)
        .stretchTo(target)
        .zIndex(2)
        .waitUntilFinished(-750)

    .motion(target)
        .noise()
        .duration(1000)

    .effect()
        .file(closest("eskie.damage.poison.01.green"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(0.95, { considerTokenScale: true })
        .zIndex(1)

    .effect()
        .file(closest("eskie.nature.vine.normal.01.physical.green"))
        .atLocation(target)
        .scaleToObject(1.25, { considerTokenScale: true })
        .zIndex(3)

    .effect()
        .name(label)
        .file(closest("jb2a.plant_growth.04.ring.4x4.pulse.greenwhite"))
        .attachTo(target)
        .scaleToObject(1.25, { considerTokenScale: true })
        .zIndex(1)
        .filter("ColorMatrix", { saturate: 0, hue: -20 })

    .wait(250)

    .effect()
        .name(label)
        .file(closest("eskie.nature.vine.normal.circle.01.physical.green.radius_20ft"))
        .attachTo(target)
        .scaleToObject(1.95, { considerTokenScale: true })
        .randomRotation()
        .zIndex(1)
        .persist()
        .mask()

    .effect()
        .name(label)
        .file(closest("eskie.nature.vine.normal.circle.01.physical.green.radius_10ft"))
        .attachTo(target)
        .scaleToObject(1.45, { considerTokenScale: true })
        .randomRotation()
        .zIndex(1)
        .persist()
        .belowTokens();

await sequence.play();
