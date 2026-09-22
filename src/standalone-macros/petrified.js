// Standalone Macro: Petrified
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Petrified' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "Petrified";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id}-${tokenId}`;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
const activeById = Sequencer.EffectManager.getEffects({ name: id, object: token }) ?? [];

if (activeEffects.length > 0 || activeById.length > 0) {
    const stopSequence = new Sequence();

    // Crack ground impact and stone dust shatter animation when breaking petrification
    stopSequence.effect()
        .file(closest("jb2a.impact.earth.01.browngreen"))
        .atLocation(token)
        .filter("ColorMatrix", { saturate: -1 })
        .scaleToObject(2)
        .randomRotation();

    stopSequence.animation()
        .on(token)
        .opacity(1)
        .thenDo(() => {
            Sequencer.EffectManager.endEffects({ name: label, object: token });
            Sequencer.EffectManager.endEffects({ name: id, object: token });
        });

    await stopSequence.play();
    return;
}

const sequence = new Sequence();

// Crack ground impact and stone dust animation as token turns to stone
sequence.effect()
    .file(closest("jb2a.impact.earth.01.browngreen"))
    .atLocation(token)
    .filter("ColorMatrix", { saturate: -1 })
    .scaleToObject(2)
    .randomRotation();

// Stone shudder motion as token petrifies
sequence.motion(token)
    .noise({ strength: 0.05, frequency: 75, duration: 3000, gridUnits: true });

// Stone gray petrification statue texture overlay
sequence.effect()
    .file("https://i.imgur.com/4P2tITB.png")
    .name(label)
    .atLocation(token)
    .mask(token)
    .opacity(1)
    .filter("Glow", { color: 0x000000, distance: 3, outerStrength: 4 })
    .zIndex(0)
    .fadeIn(3000)
    .duration(5000)
    .attachTo(token)
    .persist();

await sequence.play();
