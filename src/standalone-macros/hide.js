// Standalone Macro: Hide
// Original Author: EskieMoh#2969 / .eskie
// Integration: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Hide' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "hide";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle / re-entrant persistent effect handling: stop hide if active
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    await new Sequence()
        .motion(token)
            .fadeTo(1, { duration: 500 })
            .tintTo("#FFFFFF", { duration: 500 })
        .play();
    return;
}

const sequence = new Sequence();

// Black smoke burst
sequence.effect()
    .file(closest("eskie.smoke.03.black"))
    .attachTo(token)
    .scaleToObject(1.75)
    .opacity(1)
    .randomRotation()
    .fadeOut(1000)
    .zIndex(2)
    .tint("#696969");

// Stealth fade motion via Sequencer 4.3.0+ sequence.motion(token)
sequence.motion(token)
    .fadeTo(0.25, { duration: 500 })
    .tintTo("#696969", { duration: 500 });

// Persistent tracking effect for macro toggle support
sequence.effect()
    .name(label)
    .attachTo(token)
    .persist()
    .private();

await sequence.play();
