// Standalone Macro: Enfeebling Arrow
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Enfeebling Arrow' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const label = `${target.name} Enfeebling Arrow`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    return ui.notifications.info(`Ended Enfeebling Arrow on ${target.name}.`);
}

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("eskie.casting.physical.03.side.one_shot.green"))
        .attachTo(token)
        .rotateTowards(target)
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(2)
        .filter("ColorMatrix", { hue: 50, brightness: 1 })
        .waitUntilFinished(-750)

    .effect()
        .file(closest("eskie.attack.ranged.arrow.01.physical.medium.green.normal"))
        .atLocation(token)
        .stretchTo(target)
        .zIndex(2)
        .filter("ColorMatrix", { hue: 50, brightness: 1 })
        .waitUntilFinished(-750)

    .motion(target)
        .noise({ strength: 0.05, frequency: 50, duration: 1000, gridUnits: true })

    .effect()
        .file(closest("eskie.damage.necrotic.01.teal"))
        .attachTo(target, { bindAlpha: false, bindVisibility: false })
        .scaleToObject(1.5, { considerTokenScale: true })
        .zIndex(1)

    .effect()
        .file(closest("jb2a.misty_step.02.blue"))
        .atLocation(target)
        .scaleToObject(1.75, { considerTokenScale: true })
        .startTime(1500)
        .filter("ColorMatrix", { hue: -75 })
        .belowTokens()
        .zIndex(2)

    .effect()
        .name(label)
        .file(closest("eskie.poison.token_mask.01.teal.full"))
        .attachTo(target)
        .scaleToObject(0.95, { considerTokenScale: true })
        .fadeIn(1000)
        .fadeOut(1000)
        .persist()
        .mask(target)
        .zIndex(0)

    .effect()
        .file(closest("jb2a.extras.tmfx.inflow.circle.01"))
        .attachTo(target)
        .scaleToObject(1.65, { considerTokenScale: true })
        .fadeIn(500)
        .duration(10000)
        .fadeOut(1000)
        .opacity(0.75)
        .mask()
        .playbackRate(0.75)
        .tint("#51e692")
        .zIndex(1);

await sequence.play();
