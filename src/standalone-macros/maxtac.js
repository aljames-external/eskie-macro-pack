// Standalone Macro: MaxTac Trauma Team AV Deployment
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'MaxTac Trauma Team AV' macro requires the 'Sequencer' module to be installed and active!");
}

const target = canvas.tiles.controlled[0] ?? canvas.tokens.controlled[0];
if (!target) {
    return ui.notifications.warn("Please select a Vehicle Tile or Token to deploy the MaxTac Trauma Team AV!");
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "MaxTacTraumaTeamAV";
const targetId = target.id ?? target.document?.id ?? "";
const effectNameFly = `MaxTac-Fly-${targetId}`;
const effectNameLanding = `MaxTac-Landing-${targetId}`;
const flyingTag = "Flying";

const tileRotation = target.document?.rotation ?? target.rotation ?? 0;
const w = target.document?.width ?? target.w ?? 1;
const h = target.document?.height ?? target.h ?? 1;

// Top-level Run-1 Start / Run-2 Stop Toggle Check
const activeFly = Sequencer.EffectManager.getEffects({ name: effectNameFly, object: target }) ?? [];
const activeLanding = Sequencer.EffectManager.getEffects({ name: effectNameLanding, object: target }) ?? [];
const hasTag = game.modules.get('tagger')?.active && Tagger.hasTags(target, flyingTag);

if (activeFly.length > 0 || activeLanding.length > 0 || hasTag) {
    if (game.modules.get('tagger')?.active) {
        await Tagger.removeTags(target, flyingTag);
    }
    await Sequencer.EffectManager.endEffects({ name: effectNameLanding, object: target });
    await Sequencer.EffectManager.endEffects({ name: effectNameLanding });
    await Sequencer.EffectManager.endEffects({ name: effectNameFly, object: target });
    await Sequencer.EffectManager.endEffects({ name: effectNameFly });

    // Thruster blast-off & high speed extraction departure sequence
    const departureSeq = new Sequence();

    const thrusterOffsets = [
        { x: 1.5, y: -11.5 },
        { x: -1.5, y: -11.5 },
        { x: 1.5, y: -8.5 },
        { x: -1.5, y: -8.5 }
    ];

    for (const offset of thrusterOffsets) {
        departureSeq.effect()
            .file(closest("jb2a.dancing_light.red"))
            .scaleToObject(0.25)
            .attachTo(target, { offset, gridUnits: true, local: true, bindAlpha: false })
            .filter("ColorMatrix", { saturate: 1 })
            .filter("Blur", { blurX: 10, blurY: 10 })
            .playbackRate(5)
            .animateProperty("spriteContainer", "position.y", { from: 8, to: -40, gridUnits: true, duration: 1500, ease: "easeInCubic" })
            .animateProperty("spriteContainer", "rotation", { from: 0, to: tileRotation + 90, duration: 0 })
            .zIndex(0);
    }

    departureSeq.motion(target)
        .moveBy({ y: -40 }, { gridUnits: true, duration: 1500, ease: "easeInCubic" });

    departureSeq.effect()
        .copySprite(target)
        .spriteRotation(-tileRotation)
        .attachTo(target, { offset: { y: -8 }, gridUnits: true, bindAlpha: false })
        .size({ width: w, height: h })
        .animateProperty("spriteContainer", "position.y", { from: 7, to: -20, gridUnits: true, duration: 1500, ease: "easeInCubic" })
        .animateProperty("spriteContainer", "scale.x", { from: 1, to: 0.2, duration: 1500, ease: "easeInCubic" })
        .animateProperty("spriteContainer", "scale.y", { from: 1, to: 0.2, duration: 1500, ease: "easeInCubic" })
        .fadeOut(800, { delay: 500 })
        .opacity(0.35)
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .belowTokens()
        .zIndex(2);

    await departureSeq.play();
    return ui.notifications.info("MaxTac Trauma Team AV departed zone.");
}

if (game.modules.get('tagger')?.active) {
    await Tagger.addTags(target, flyingTag);
}

const cautionstyle = {
    fill: "#fffed6",
    fontFamily: "Arial Black, Arial, sans-serif",
    fontSize: 7,
};

const style = {
    fill: "#fffed6",
    fontFamily: "Impact, Charcoal, sans-serif",
    fontSize: 7,
};

const rotFactor = ((tileRotation / 90) % 2);
const seq = new Sequence();

// 1. Landing zone caution stage rings & glowing neon hazard texts
seq.effect()
    .name(effectNameLanding)
    .attachTo(target)
    .file(closest("jb2a.token_stage.square.red.02.03"))
    .scaleToObject(1.09)
    .persist()
    .playbackRate(2)
    .belowTokens()
    .elevation(0);

seq.effect()
    .name(effectNameLanding)
    .attachTo(target)
    .file(closest("jb2a.token_stage.square.red.02.02"))
    .scaleToObject(1)
    .persist()
    .playbackRate(2)
    .belowTokens()
    .elevation(0);

seq.wait(250);

seq.effect()
    .name(effectNameLanding)
    .text("注意", cautionstyle)
    .filter("Glow", { color: 0xF96244, innerStrength: 1 })
    .attachTo(target)
    .anchor({ y: -30 * Math.max(1, rotFactor * 2.1025) })
    .loopProperty("alphaFilter", "alpha", { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
    .animateProperty("spriteContainer", "rotation", { from: 0, to: tileRotation, duration: 0 })
    .scaleToObject(0.01, { uniform: false })
    .persist()
    .belowTokens()
    .elevation(0);

seq.effect()
    .name(effectNameLanding)
    .text("CAUTION", cautionstyle)
    .filter("Glow", { color: 0xF96244, innerStrength: 1 })
    .attachTo(target)
    .anchor({ y: -21 * Math.max(1, rotFactor * 2.5) })
    .loopProperty("alphaFilter", "alpha", { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
    .animateProperty("spriteContainer", "rotation", { from: 0, to: tileRotation, duration: 0 })
    .scaleToObject(0.01, { uniform: false })
    .persist()
    .belowTokens()
    .elevation(0);

seq.effect()
    .name(effectNameLanding)
    .text("STAY AWAY", style)
    .filter("Glow", { color: 0xF96244, innerStrength: 1 })
    .attachTo(target)
    .anchor({ x: -5 * Math.max(1, Math.abs(rotFactor - 0.5) * 4), y: -12.5 * Math.max(1, rotFactor * 2.5) })
    .loopProperty("alphaFilter", "alpha", { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
    .animateProperty("spriteContainer", "rotation", { from: 0, to: tileRotation - 90, duration: 0 })
    .scaleToObject(0.01, { uniform: false })
    .persist()
    .belowTokens()
    .elevation(0)
    .mirrorY()
    .mirrorX();

seq.effect()
    .name(effectNameLanding)
    .text("STAY AWAY", style)
    .filter("Glow", { color: 0xF96244, innerStrength: 1 })
    .attachTo(target)
    .anchor({ x: 5 * Math.max(1, Math.abs(rotFactor - 0.5) * 4), y: -12.5 * Math.max(1, rotFactor * 2.5) })
    .loopProperty("alphaFilter", "alpha", { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
    .animateProperty("spriteContainer", "rotation", { from: 0, to: tileRotation + 90, duration: 0 })
    .scaleToObject(0.01, { uniform: false })
    .persist()
    .belowTokens()
    .elevation(0)
    .mirrorY()
    .mirrorX();

seq.effect()
    .name(effectNameLanding)
    .file(closest("icons/svg/hazard.svg"))
    .filter("Glow", { color: 0xF96244, knockout: true, innerStrength: 1 })
    .attachTo(target)
    .anchor({ x: 0 })
    .loopProperty("alphaFilter", "alpha", { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
    .animateProperty("spriteContainer", "rotation", { from: 0, to: tileRotation + 90, duration: 0 })
    .scaleToObject(0.15, { uniform: true })
    .persist()
    .belowTokens()
    .elevation(0)
    .mirrorY()
    .mirrorX();

seq.effect()
    .name(effectNameLanding)
    .file(closest("icons/svg/hazard.svg"))
    .filter("Glow", { color: 0xF96244, knockout: true, innerStrength: 1 })
    .attachTo(target)
    .anchor({ x: 2.25 })
    .loopProperty("alphaFilter", "alpha", { values: [-1, 0], duration: 500, pingPong: true, delay: 500 })
    .animateProperty("spriteContainer", "rotation", { from: 0, to: tileRotation + 90, duration: 0 })
    .scaleToObject(0.15, { uniform: true })
    .persist()
    .belowTokens()
    .elevation(0);

seq.wait(2000);

// 2. High-heat Quad VTOL Dancing Lights Thrusters
const thrusterPositions = [
    { x: 1.5, y: -11.5 },
    { x: -1.5, y: -11.5 },
    { x: 1.5, y: -8.5 },
    { x: -1.5, y: -8.5 }
];

for (const offset of thrusterPositions) {
    seq.effect()
        .file(closest("jb2a.dancing_light.red"))
        .scaleToObject(0.25)
        .name(effectNameFly)
        .attachTo(target, { offset, gridUnits: true, local: true, bindAlpha: false })
        .filter("ColorMatrix", { saturate: 1 })
        .filter("Blur", { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: 8, gridUnits: true, duration: 5000, ease: "easeOutBack" })
        .animateProperty("spriteContainer", "rotation", { from: 0, to: tileRotation + 90, duration: 0 })
        .loopProperty("sprite", "position.y", { from: 0, to: -20, duration: 2500, pingPong: true, delay: 500 })
        .zIndex(0);
}

// Sequencer 4.3.0+ Vehicle tile flying hover motion
seq.motion(tile)
    .name(effectNameFly)
    .moveBy({ y: -0.5 }, { duration: 1000, gridUnits: true })
    .oscillate({ period: 2000, amplitude: 0.05 });

// Ground drop shadow effect staying on ground underneath tile
seq.effect()
    .copySprite(target)
    .spriteRotation(-tileRotation)
    .name(effectNameFly)
    .atLocation(target, { ignoreMotion: true })
    .size({ width: w, height: h })
    .opacity(0.35)
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .attachTo(target, { bindAlpha: false, ignoreMotion: true })
    .belowTokens()
    .zIndex(0)
    .persist();

seq.effect()
    .name(effectNameFly)
    .file(closest("eskie.smoke.07.white"))
    .scale(1.2)
    .delay(4000)
    .attachTo(target, { offset: { y: -1.5 }, gridUnits: true, bindAlpha: false })
    .belowTokens()
    .tint("#F96244")
    .opacity(0.25)
    .loopProperty("sprite", "scale.x", { from: 1, to: 1.5, duration: 900 })
    .loopProperty("sprite", "scale.y", { from: 1, to: 1.5, duration: 900 })
    .persist();

await seq.play();
