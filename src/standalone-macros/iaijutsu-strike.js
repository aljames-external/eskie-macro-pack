// Standalone Macro: Iaijutsu Strike
// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Iaijutsu Strike' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Controlled Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const isPlaying = Sequencer.EffectManager.getEffects({ name: "*IaijutsuStrike*" }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: "cinema-bars" }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: "*IaijutsuStrike*" });
    Sequencer.EffectManager.endEffects({ name: "IaijutsuStrike" });
    Sequencer.EffectManager.endEffects({ name: "IaijutsuStrike Text" });
    Sequencer.EffectManager.endEffects({ name: "cinema-bars" });
    Sequencer.EffectManager.endEffects({ name: "*Top*" });
    Sequencer.EffectManager.endEffects({ name: "*Bottom*" });
    new Sequence().animation().on(token).opacity(1).play();
    return ui.notifications.info("Ended Iaijutsu Strike slice.");
}

// 2. Target Token Validation
const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target a token!");

const targetDeath = true;
const teleport = true;
const cameraFocus = {
    enable: true,
    scale: 0.3
};
const text = {
    id: 'IaijutsuStrike Text',
    duration: 2500,
    delay: 200,
    style: {
        "fill": "#da1b1bff",
        "fontFamily": "Helvetica",
        "fontSize": 106,
        "strokeThickness": 0,
        fontWeight: "bold",
    },
    kerning: 1.7,
    verticalOffset: 0.75,
};

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

function createCinemaBars(dim = true) {
    const barId = 'cinema-bars';
    let seq = new Sequence();
    seq.effect()
        .name(barId)
        .screenSpace()
        .screenSpaceScale({ fitX: true, fitY: true })
        .file(closest("eskie.screen_overlay.cinema_bars.02"))
        .persist();

    if (dim && canvas.scene?.background?.src) {
        const gridSZ = canvas.grid?.size ?? 100;
        seq.effect()
            .file(canvas.scene.background.src)
            .name(barId)
            .filter("ColorMatrix", { brightness: 0.3 })
            .atLocation({ x: (canvas.dimensions?.width ?? 0) / 2, y: (canvas.dimensions?.height ?? 0) / 2 })
            .size({ width: (canvas.scene?.width ?? 1000) / gridSZ, height: (canvas.scene?.height ?? 1000) / gridSZ }, { gridUnits: true })
            .duration(3000)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens();
    }
    return seq;
}

function createDashEffect(sourceToken, targetToken) {
    const deltaX = targetToken.x - sourceToken.x;
    const deltaY = sourceToken.y - targetToken.y;
    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = (angleRad * 180) / Math.PI;

    let seq = new Sequence();
    seq.effect()
        .name("IaijutsuStrike")
        .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.redblack"))
        .atLocation(targetToken)
        .rotate(angleDeg)
        .filter("ColorMatrix", { saturate: -1, brightness: 1 })
        .size({ width: 8, height: 1 }, { gridUnits: true })
        .scaleOut(0, 600, { ease: "easeOutCubic" })
        .aboveLighting();
    return seq;
}

function createFloatingText(targetToken, textStr, textCfg = {}) {
    const duration = Math.max(textCfg.duration ?? 2500, (textCfg.delay ?? 200) * textStr.length);
    const kerning = textCfg.kerning ?? 1.7;
    const verticalOffset = textCfg.verticalOffset ?? 0.75;
    const style = textCfg.style ?? {};
    const textId = textCfg.id ?? 'IaijutsuStrike Text';
    const delay = textCfg.delay ?? 200;

    const targetWidth = targetToken.document?.width ?? 1;
    const x = -((textStr.length - 1) * kerning) / 2;
    const y = -(targetWidth + verticalOffset);

    let seq = new Sequence();
    for (let i = 0; i < textStr.length; i++) {
        seq.effect()
            .name(textId)
            .atLocation(targetToken, { offset: { x: x + (i * kerning), y: y }, gridUnits: true })
            .text(textStr[i], style)
            .duration(duration - i * delay)
            .fadeOut(250)
            .aboveLighting()
            .zIndex(1)
            .wait(delay);
    }
    return seq;
}

function createDeathAnimation(targetToken) {
    const gridSZ = canvas.grid?.size ?? 100;
    const targetWidth = targetToken.document?.width ?? 1;
    const targetRotation = targetToken.document?.rotation ?? 0;
    const tName = targetToken.name ?? "Target";

    let seq = new Sequence();

    seq.effect()
        .name(`IaijutsuStrike ${tName} Top`)
        .copySprite(targetToken)
        .spriteRotation(-targetRotation)
        .atLocation(targetToken)
        .scaleToObject(1, { considerTokenScale: true })
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: 1, y: -1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })
        .moveTowards({
            x: targetToken.x + gridSZ * targetWidth + 0.1,
            y: targetToken.y + gridSZ * targetWidth + 0.1
        }, { rotate: false })
        .moveSpeed(100)
        .persist()
        .extraEndDuration(1000)
        .fadeOut(1000);

    seq.effect()
        .name(`IaijutsuStrike ${tName} Bottom`)
        .copySprite(targetToken)
        .spriteRotation(-targetRotation)
        .atLocation(targetToken)
        .scaleToObject(1, { considerTokenScale: true })
        .shape("polygon", {
            lineSize: 1,
            lineColor: "#FF0000",
            fillColor: "#FF0000",
            points: [{ x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }],
            fillAlpha: 1,
            gridUnits: true,
            isMask: true,
            name: "test"
        })
        .zIndex(0.1)
        .persist()
        .fadeOut(500);

    seq.effect()
        .file(closest("jb2a.water_splash.cone.01.red"))
        .atLocation(targetToken, { offset: { x: 0.1, y: -0.1 }, gridUnits: true })
        .delay(250)
        .fadeIn(200)
        .scaleToObject()
        .zIndex(0)
        .fadeOut(500)
        .rotate(45);

    seq.wait(5500);
    return seq;
}

let position;
if (teleport === true) {
    const crosshairsConfig = {
        size: 1,
        icon: 'icons/skills/melee/blade-tip-orange.webp',
        label: 'Iaijutsu Strike',
        tag: 'katana lol',
        t: 'ray',
        drawIcon: true,
        drawOutline: true,
        interval: -1,
        rememberControlled: true,
    };
    position = await Sequencer.Crosshair.show(crosshairsConfig);
    if (!position || position.cancelled) return;
}

let sequence = new Sequence();

if (cameraFocus?.enable ?? true) {
    sequence.addSequence(createCinemaBars(true));
    sequence.canvasPan({
        duration: 250,
        x: target.center.x,
        y: target.center.y,
        scale: cameraFocus?.scale ?? 0.3
    });
}

// Quickdraw katana blade sheath flash
sequence.effect()
    .name("IaijutsuStrike")
    .file(closest("eskie.star.02.blue"))
    .scaleToObject(0.75)
    .atLocation(token, { offset: { x: 0.25, y: 0.25 }, gridUnits: true })
    .scaleIn(0, 500, { ease: "easeOutCubic" })
    .rotateIn(-180, 500, { ease: "easeOutCubic" })
    .filter("ColorMatrix", { saturate: -1, brightness: 1.2 })
    .aboveLighting()
    .waitUntilFinished();

sequence.wait(500);

// Linear dash slice wave through target token
sequence.addSequence(createDashEffect(token, target));

const dashDestination = position ?? target.center;

// Slash dash token movement via Sequencer 4.3.0+ sequence.motion() API
sequence.motion(token)
    .moveTo(dashDestination, { rotate: false, ease: "easeOutCubic" })
    .moveSpeed(1500)
    .duration(400);

sequence.wait(500);

// Kanji floating strike text
sequence.addSequence(createFloatingText(target, "居合術", text));

// Samurai blood red slash stroke & delayed visual sheath strike impact
if (targetDeath === true) {
    sequence.addSequence(createDeathAnimation(target));
}

sequence.wait(500);

if (cameraFocus?.enable ?? true) {
    sequence.thenDo(() => {
        Sequencer.EffectManager.endEffects({ name: 'cinema-bars' });
    });
}

await sequence.play();

