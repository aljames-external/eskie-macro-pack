// Standalone Macro: Psychic Teleportation
// Original Author: EskieMoh#2969
// Modular Conversion & .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Psychic Teleportation' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = "Psychic Teleportation";
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;

const position = await Sequencer.Crosshair.show({
    size: token.document?.width ?? 1,
    icon: portalPath,
    label: label
});

if (!position || position.cancelled) return;

const sequence = new Sequence()
    .effect()
        .name(label)
        .file(closest("jb2a.dagger.throw.01.white"))
        .atLocation(token)
        .stretchTo(position)
        .filter("ColorMatrix", { saturate: -1, brightness: 5 })
        .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
        .opacity(0.9)
        .duration(1000)

    .effect()
        .file(closest("jb2a.impact.010.blue"))
        .atLocation(token)
        .scaleToObject(2)
        .scaleOut(0, 250)
        .randomRotation()

    .effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .filter("ColorMatrix", { saturate: 1, brightness: 5 })
        .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
        .atLocation(token)
        .scaleToObject(2)
        .randomRotation()
        .scaleIn(0.25, 250)
        .fadeOut(2500)
        .duration(3000)

    .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .scaleToObject(1.25)
        .opacity(0.25)

    .effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .atLocation(token)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .opacity(0.25)
        .fadeOut(500)

    .motion(token)
        .moveTo(position, { offset: { x: -1, y: -1 } })
        .snapToGrid()
        .waitUntilFinished()

    .wait(1000)

    .thenDo(function () {
        Sequencer.EffectManager.endEffects({ name: label, object: token });
    })

    .effect()
        .file(closest("jb2a.impact.010.blue"))
        .atLocation(token)
        .scaleToObject(2)
        .scaleIn(0, 250)
        .randomRotation()

    .effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .filter("ColorMatrix", { saturate: 1, brightness: 5 })
        .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
        .atLocation(token)
        .scaleToObject(2)
        .randomRotation()
        .scaleIn(0.25, 250)
        .fadeOut(2500)
        .duration(3000)

    .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .scaleToObject(1.25)
        .opacity(0.25)

    .effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .atLocation(token)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .opacity(0.25)
        .fadeOut(500)

    .waitUntilFinished(-400);

await sequence.play();
