// Standalone Macro: Fly
// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Fly' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "fly";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const rotation = -(token.document?.rotation ?? token.rotation ?? 0);

const sequence = new Sequence();

// Misty step launch burst
sequence.effect()
    .file(closest("jb2a.misty_step.01.blue"))
    .atLocation(token)
    .scaleToObject(1.75)
    .belowTokens();

// Flying token hover motion via Sequencer 4.3.0+ .motion() API
sequence.motion(token)
    .name(label)
    .moveBy({ y: -0.5 }, { duration: 1000, gridUnits: true })
    .oscillate({ period: 1500, amplitude: 0.05 });

// Ground shadow sprite (altitude elevation scale and blur shadow animation)
sequence.effect()
    .copySprite(token)
    .spriteRotation(rotation)
    .name(label)
    .atLocation(token, { ignoreMotion: true })
    .scaleToObject(0.9, { considerTokenScale: true })
    .duration(1000)
    .opacity(0.5)
    .belowTokens()
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .attachTo(token, { bindAlpha: false, ignoreMotion: true })
    .zIndex(1)
    .persist();

await sequence.play();

