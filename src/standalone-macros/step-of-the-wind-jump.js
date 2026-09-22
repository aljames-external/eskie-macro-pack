// Standalone Macro: Step of the Wind (Jump)
// Original Author: .eskie
// Modular Conversion & .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Step of the Wind (Jump)' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = `${token.document?.name ?? token.name ?? "Token"} Step of the Wind (Jump)`;
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tokenWidth = token.document?.width ?? token.width ?? 1;
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;

const crosshairConfig = {
    size: tokenWidth,
    icon: portalPath,
    label: "Step of the Wind (Jump)",
    tag: label,
    drawIcon: true,
    drawOutline: true,
    interval: tokenWidth % 2 === 0 ? 1 : -1,
    rememberControlled: true,
};

const position = await Sequencer.Crosshair.show(crosshairConfig);
if (!position || position.cancelled || !position.x) return;

// Determine Jump Timings
const jumpTime = 750;
const upTime = jumpTime * 0.5;
const downTime = jumpTime * 0.4;

// Determine Trail Direction
const tokenCenter = token.center ?? { x: token.x + (token.w ?? 0) / 2, y: token.y + (token.h ?? 0) / 2 };
const dx = position.x - tokenCenter.x;
const dy = position.y - tokenCenter.y;

let trailOffset  = { x: -0.75, y: 0 };
let trailRotFrom = -45;
let trailRotTo   = 45;
let mirrorTrail  = false;

if (dx > 0) {
    // Trail Right (Default)  
    trailOffset = { x: -0.75, y: 0 };
    trailRotFrom = -45;
    trailRotTo   = 45;
    mirrorTrail = false;
} else if (dx < 0) {
    // Trail Left
    trailOffset = { x: 0.75, y: 0 };
    trailRotFrom = 45;
    trailRotTo   = -45;
    mirrorTrail = true;
} else {
    if (dy > 0) {
        // Trail Down
        trailRotFrom = 90;
        trailRotTo   = 90;
    } else if (dy < 0) {
        // Trail Up
        trailRotFrom = -90;
        trailRotTo   = -90;
    }
}

const seq = new Sequence();

seq.wait(100)

    // Launch Dust Burst
    .effect()
        .file(closest("eskie.smoke.03.white"))
        .atLocation(token)
        .scaleToObject(1.75)
        .belowTokens()
        .randomRotation()
        .scaleIn(0, 300, { ease: "easeOutExpo" })
        .opacity(0.85)
        .zIndex(1)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.blue"))
        .atLocation(token)
        .scaleToObject(1.5)
        .playbackRate(2)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .duration(2500)
        .fadeIn(250)
        .fadeOut(1000)
        .spriteRotation(45)
        .zIndex(6)
        .animateProperty('sprite', 'height', { from: 1, to: 1.5, duration: 1000, gridUnits: true, ease: "easeOutCubic" })

    // Ground Leap Shadow
    .effect()
        .name(label)
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .atLocation(token)
        .scaleToObject(0.9, { considerTokenScale: true })
        .opacity(0.5)
        .belowTokens()
        .anchor({ x: 0.5, y: 0.5 })
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .animateProperty('sprite', 'width', { from: 0, to: -0.15, duration: upTime, gridUnits: true, delay: 200 })
        .animateProperty('sprite', 'width', { from: 0, to: 0.15, duration: downTime, gridUnits: true, delay: upTime + 200 })
        .animateProperty('sprite', 'height', { from: 0, to: -0.15, duration: upTime, gridUnits: true, delay: 200 })
        .animateProperty('sprite', 'height', { from: 0, to: 0.15, duration: downTime, gridUnits: true, delay: upTime + 200 })
        .moveTowards(position, { ease: "linear", rotate: false, delay: 200 })
        .duration(jumpTime + 200)
        .zIndex(2)

    // Monk Athletic Wind-Boosted Leap Trajectory via Sequencer 4.3.0+ .motion()
    .motion(token)
        .moveTo(position, {
            arc: 0.8,
            duration: jumpTime,
            delay: 200,
            rotate: false
        })

    // Air Motion Trail
    .effect()
        .name(label)
        .file(closest("eskie.trail.token.generic.01.white"))
        .scaleToObject(1.5, { considerTokenScale: true })
        .atLocation(token)
        .opacity(1)
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -1.5, duration: upTime, gridUnits: true, ease: "easeOutCubic", delay: 200 })
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: 1.5, duration: downTime, gridUnits: true, fromEnd: false, ease: "easeInSine", delay: upTime + 200 })
        .moveTowards(position, { ease: "linear", rotate: false, delay: 200 })
        .persist()
        .fadeIn(250, { delay: 200 })
        .fadeOut(50, { ease: "easeOutQuint" })
        .duration(jumpTime + 200)
        .animateProperty('sprite', 'rotation', { from: trailRotFrom, to: trailRotTo, duration: upTime + downTime, ease: "easeInSine", delay: 200 })
        .mirrorX(mirrorTrail)
        .spriteOffset(trailOffset, { gridUnits: true })
        .filter("ColorMatrix", { saturate: 3 })
        .zIndex(5)

    .wait(jumpTime)

    .thenDo(function() {
        Sequencer.EffectManager.endEffects({ name: label, object: token });
    })

    // Landing Impact Shockwave Burst
    .effect()
        .file(closest("eskie.smoke.03.white"))
        .atLocation(token)
        .scaleToObject(1.75)
        .belowTokens()
        .randomRotation()
        .scaleIn(0, 300, { ease: "easeOutExpo" })
        .opacity(0.85)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.blue"))
        .atLocation(token)
        .scaleToObject(1.5)
        .playbackRate(2)
        .scaleIn(0, 1000, { ease: "easeOutCubic" })
        .duration(2500)
        .fadeIn(250)
        .fadeOut(1000)
        .spriteRotation(45)
        .zIndex(6)
        .animateProperty('sprite', 'height', { from: 1, to: 1.5, duration: 1000, gridUnits: true, ease: "easeOutCubic" });

await seq.play();
