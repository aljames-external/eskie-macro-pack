// Standalone Macro: Rage
// Original Author: EskieMoh#2969 / .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Rage' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const hexValue = (color) => {
    switch (color) {
        case "red": return "#FF0000";
        case "orange": return "#FF8800";
        case "yellow": return "#FFFF00";
        case "green": return "#00FF00";
        case "blue": return "#0000FF";
        case "purple": return "#FF00FF";
        case "dark_red": return "#600000";
        case "dark_orange": return "#603000";
        case "dark_yellow": return "#606000";
        case "dark_green": return "#005000";
        case "dark_blue": return "#000070";
        case "dark_purple": return "#3F003F";
        case "white": return "#FFFFFF";
        default: return "#FFFFFF";
    }
};

const RAGE_IDS = ["RageV1", "RageV2", "ElectricRage", "SSJRage", "Totem"];
const tokenId = token.id ?? token.document?.id ?? "";

// Toggle / re-entrant persistent effect handling: stop active rage if present
let activeEffectFound = false;
for (const id of RAGE_IDS) {
    const label = `${id} - ${tokenId}`;
    const active = Sequencer.EffectManager.getEffects({ name: label, object: token });
    if ((active?.length ?? 0) > 0) {
        activeEffectFound = true;
        Sequencer.EffectManager.endEffects({ name: label, object: token });
        Sequencer.EffectManager.endEffects({ name: `${label} - ground-crack` });
    }
}

if (activeEffectFound) {
    new Sequence().animation().on(token).opacity(1).play();
    return;
}

// Dialog for selection between visual styles
const choice = await Dialog.wait({
    title: "Barbarian Rage",
    content: "<p style='text-align: center;'>Select a visual rage style:</p>",
    buttons: {
        red_aura: {
            icon: '<i class="fas fa-fire" style="color: #ff3333;"></i>',
            label: "Red Aura",
            callback: () => "red_aura"
        },
        pulsing_muscle: {
            icon: '<i class="fas fa-dumbbell" style="color: #cc1111;"></i>',
            label: "Pulsing Muscle",
            callback: () => "pulsing_muscle"
        },
        electric_anger: {
            icon: '<i class="fas fa-bolt" style="color: #aa33ff;"></i>',
            label: "Electric Anger",
            callback: () => "electric_anger"
        },
        super_saiyan: {
            icon: '<i class="fas fa-sun" style="color: #ffaa00;"></i>',
            label: "Super Saiyan",
            callback: () => "super_saiyan"
        },
        totem_spirit: {
            icon: '<i class="fas fa-paw" style="color: #ff5522;"></i>',
            label: "Totem Spirit",
            callback: () => "totem_spirit"
        }
    },
    default: "pulsing_muscle",
    close: () => null
});

if (!choice) return;

function createRedAura(token) {
    const id = "RageV1";
    const color = "red";
    const label = `${id} - ${tokenId}`;

    let seq = new Sequence();
    seq.effect()
        .file(closest("jb2a.extras.tmfx.outpulse.circle.02.normal"))
        .atLocation(token)
        .size(4, { gridUnits: true })
        .opacity(0.25);

    seq.effect()
        .file(closest(`jb2a.impact.ground_crack.${color}.02`))
        .atLocation(token)
        .belowTokens()
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(1);

    seq.effect()
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(token)
        .belowTokens()
        .fadeIn(1000)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .persist()
        .name(`${label} - ground-crack`)
        .zIndex(0);

    seq.effect()
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token, { offset: { y: -0.05 }, gridUnits: true })
        .size(1.75, { gridUnits: true })
        .rotate(90)
        .opacity(0.9)
        .filter("ColorMatrix", { saturate: 1 })
        .tint(hexValue(color))
        .loopProperty("spriteContainer", "position.y", { from: -5, to: 5, duration: 50, pingPong: true })
        .duration(8000)
        .fadeOut(3000);

    seq.effect()
        .file(closest(`jb2a.particles.outward.${color}.01.03`))
        .atLocation(token)
        .scaleToObject(2.5)
        .opacity(1)
        .fadeIn(200)
        .fadeOut(3000)
        .loopProperty("spriteContainer", "position.x", { from: -5, to: 5, duration: 50, pingPong: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -100, duration: 6000, pingPong: true, delay: 2000 })
        .duration(8000);

    seq.effect()
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token)
        .name(label)
        .attachTo(token)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .filter("ColorMatrix", { saturate: 1 })
        .tint(hexValue(color))
        .persist()
        .private();

    seq.effect()
        .file(closest(`jb2a.token_border.circle.static.${color}.012`))
        .atLocation(token)
        .name(label)
        .attachTo(token)
        .opacity(0.6)
        .scaleToObject(1.9)
        .filter("ColorMatrix", { saturate: 1 })
        .tint(hexValue(color))
        .persist();

    return seq;
}

function createPulsingMuscle(token) {
    const id = "RageV2";
    const color = "red";
    const label = `${id} - ${tokenId}`;

    let seq = new Sequence();

    seq.motion(token)
        .scaleTo(1.05)
        .noise();

    seq.canvasPan()
        .delay(250)
        .shake({ duration: 1100, strength: 1, rotation: false, fadeOut: 500 });

    seq.effect()
        .name(label)
        .delay(250)
        .file(closest(`jb2a.impact.ground_crack.${color}.02`))
        .atLocation(token)
        .belowTokens()
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(1);

    seq.effect()
        .name(`${label} - ground-crack`)
        .delay(250)
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(token)
        .belowTokens()
        .fadeIn(1000)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .persist()
        .zIndex(0);

    seq.effect()
        .name(label)
        .delay(250)
        .file(closest("eskie.sound.roar.02"))
        .atLocation(token)
        .size(8, { gridUnits: true })
        .opacity(0.5);

    seq.effect()
        .name(label)
        .delay(250)
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(token, { offset: { y: -0.05 }, gridUnits: true })
        .scaleToObject(1.5)
        .opacity(0.9)
        .filter("ColorMatrix", { saturate: 1 })
        .playbackRate(1.5)
        .duration(8000)
        .fadeOut(3000)
        .zIndex(1);

    seq.effect()
        .name(label)
        .delay(250)
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(token, { offset: { y: -0.05 }, gridUnits: true })
        .scaleToObject(1)
        .opacity(0.5)
        .filter("ColorMatrix", { saturate: 1 })
        .playbackRate(1)
        .fadeOut(500)
        .persist()
        .zIndex(1);

    seq.effect()
        .name(label)
        .file(closest(`eskie.aura.token.generic.02.${color}`))
        .attachTo(token)
        .scaleToObject(2.1)
        .persist();

    return seq;
}

function createElectricAnger(token) {
    const id = "ElectricRage";
    const color = "purple";
    const label = `${id} - ${tokenId}`;

    let seq = new Sequence();
    seq.effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.outpulse.circle.02.normal"))
        .atLocation(token)
        .size(4, { gridUnits: true })
        .opacity(0.25);

    seq.effect()
        .name(label)
        .file(closest(`jb2a.impact.ground_crack.${color}.02`))
        .atLocation(token)
        .belowTokens()
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(1);

    seq.effect()
        .name(`${label} - ground-crack`)
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(token)
        .belowTokens()
        .fadeIn(1000)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .persist()
        .zIndex(0);

    seq.effect()
        .name(label)
        .file(closest(`jb2a.static_electricity.03.${color}`))
        .atLocation(token)
        .size(3, { gridUnits: true })
        .rotate(90)
        .randomRotation()
        .opacity(0.75)
        .belowTokens()
        .duration(8000)
        .fadeOut(3000);

    seq.effect()
        .name(label)
        .file(closest(`jb2a.particles.outward.${color}.01.03`))
        .atLocation(token)
        .scaleToObject(2.5)
        .opacity(1)
        .fadeIn(200)
        .fadeOut(3000)
        .loopProperty("spriteContainer", "position.x", { from: -5, to: 5, duration: 50, pingPong: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -100, duration: 6000, pingPong: true, delay: 2000 })
        .duration(8000);

    seq.effect()
        .name(label)
        .file(closest(`jb2a.static_electricity.03.${color}`))
        .atLocation(token)
        .attachTo(token)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .persist()
        .private();

    seq.effect()
        .name(label)
        .file(closest(`jb2a.token_border.circle.static.${color}.009`))
        .atLocation(token)
        .attachTo(token)
        .belowTokens()
        .opacity(1)
        .scaleToObject(2.025)
        .persist()
        .zIndex(5);

    return seq;
}

function createSuperSaiyan(token) {
    const id = "SSJRage";
    const color = "orange";
    const label = `${id} - ${tokenId}`;

    let seq = new Sequence();
    seq.effect()
        .name(label)
        .file(closest("jb2a.extras.tmfx.outpulse.circle.02.normal"))
        .atLocation(token)
        .size(4, { gridUnits: true })
        .opacity(0.25);

    seq.effect()
        .name(label)
        .file(closest(`jb2a.impact.ground_crack.${color}.02`))
        .atLocation(token)
        .belowTokens()
        .filter("ColorMatrix", { hue: 20, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(1);

    seq.effect()
        .name(`${label} - ground-crack`)
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(token)
        .belowTokens()
        .fadeIn(2000)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .persist()
        .zIndex(0);

    seq.effect()
        .name(label)
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token, { offset: { y: 75 } })
        .size(1.75, { gridUnits: true })
        .rotate(90)
        .opacity(1)
        .loopProperty("spriteContainer", "position.y", { from: -5, to: 5, duration: 50, pingPong: true })
        .duration(8000)
        .fadeOut(3000)
        .tint(hexValue(color));

    seq.effect()
        .name(label)
        .file(closest(`jb2a.particles.outward.${color}.01.03`))
        .atLocation(token)
        .scaleToObject(2.5)
        .opacity(1)
        .fadeIn(200)
        .fadeOut(3000)
        .loopProperty("spriteContainer", "position.x", { from: -5, to: 5, duration: 50, pingPong: true })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -100, duration: 6000, pingPong: true, delay: 2000 })
        .duration(8000);

    seq.effect()
        .name(label)
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token)
        .attachTo(token)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .filter("ColorMatrix", { saturate: 1 })
        .tint(hexValue(color))
        .persist()
        .private();

    seq.effect()
        .name(label)
        .file(closest(`jb2a.token_border.circle.static.${color}.012`))
        .atLocation(token)
        .attachTo(token)
        .opacity(0.7)
        .scaleToObject(1.9)
        .filter("ColorMatrix", { hue: 30, saturate: 1, contrast: 0, brightness: 1 })
        .persist();

    return seq;
}

function createTotemSpirit(token, spirit = "bear") {
    const id = "Totem";
    const color = "red";
    const label = `${id} - ${tokenId}`;

    let seq = new Sequence();

    seq.motion(token)
        .scaleTo(1.05)
        .noise();

    seq.canvasPan()
        .delay(250)
        .shake({ duration: 1100, strength: 1, rotation: false, fadeOut: 500 });

    seq.effect()
        .delay(250)
        .file(closest("jb2a.impact.ground_crack.orange.02"))
        .atLocation(token)
        .belowTokens()
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .zIndex(1);

    seq.effect()
        .delay(250)
        .file(closest("jb2a.impact.ground_crack.still_frame.02"))
        .atLocation(token)
        .belowTokens()
        .fadeIn(1000)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .size(3.5, { gridUnits: true })
        .persist()
        .name(`${label} - ground-crack`)
        .zIndex(0);

    seq.effect()
        .delay(250)
        .file(closest("eskie.sound.roar.02"))
        .atLocation(token)
        .size(8, { gridUnits: true })
        .opacity(0.5);

    seq.effect()
        .delay(250)
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(token, { offset: { y: -0.05 }, gridUnits: true })
        .scaleToObject(1.5)
        .opacity(0.9)
        .filter("ColorMatrix", { saturate: 1 })
        .playbackRate(1.5)
        .duration(8000)
        .fadeOut(3000)
        .zIndex(1);

    seq.effect()
        .delay(250)
        .name(label)
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(token, { offset: { y: -0.05 }, gridUnits: true })
        .scaleToObject(1)
        .opacity(0.5)
        .filter("ColorMatrix", { saturate: 1 })
        .playbackRate(1)
        .fadeOut(500)
        .persist()
        .zIndex(1);

    seq.effect()
        .delay(250)
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token)
        .name(label)
        .attachTo(token)
        .scaleToObject()
        .rotate(90)
        .opacity(1)
        .filter("ColorMatrix", { saturate: 1 })
        .tint("#FF0000")
        .persist()
        .private()
        .zIndex(1);

    seq.effect()
        .file(closest(`eskie.aura.token.generic.02.${color}`))
        .name(label)
        .attachTo(token)
        .scaleToObject(2.1)
        .persist();

    return seq;
}

let sequence;
switch (choice) {
    case "red_aura":
        sequence = createRedAura(token);
        break;
    case "pulsing_muscle":
        sequence = createPulsingMuscle(token);
        break;
    case "electric_anger":
        sequence = createElectricAnger(token);
        break;
    case "super_saiyan":
        sequence = createSuperSaiyan(token);
        break;
    case "totem_spirit":
        sequence = createTotemSpirit(token, "bear");
        break;
}

if (sequence) {
    await sequence.play();
}
