// Standalone Macro: Leap
// Original Author: EskieMoh#2969
// Modular Conversion & .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Leap' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "leap";
const tokenId = token.document.id;
const label = `${id} - ${tokenId}`;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const tokenWidth = token.document.width;
const tokenRotation = token.document.rotation;

const crosshairConfig = {
    size: tokenWidth,
    icon: 'icons/skills/movement/feet-winged-boots-brown.webp',
    label: 'Jump',
    tag: label,
    drawIcon: true,
    drawOutline: true,
    interval: tokenWidth % 2 === 0 ? 1 : -1,
    rememberControlled: true,
};

const position = await Sequencer.Crosshair.show(crosshairConfig);
if (!position || position.cancelled || !position.x) return;

const jumpTime = 900;
const upTime = jumpTime * 0.5;
const downTime = jumpTime * 0.5;

const sequence = new Sequence();

// --- 1. POWERFUL SUPERHERO JUMP TAKEOFF CRATER EXPLOSION ---
sequence.effect()
    .file(closest("eskie.smoke.06.white"))
    .atLocation(token)
    .scaleToObject(2.2)
    .belowTokens()
    .randomRotation()
    .scaleIn(0, 250, { ease: "easeOutExpo" })
    .opacity(0.9)
    .zIndex(1);

sequence.effect()
    .file(closest("eskie.smoke.03.white"))
    .atLocation(token)
    .scaleToObject(1.8)
    .belowTokens()
    .randomRotation()
    .playbackRate(1.5)
    .scaleIn(0, 200, { ease: "easeOutExpo" })
    .fadeOut(300)
    .zIndex(1);

sequence.effect()
    .file(closest("jb2a.impact.009.orange"))
    .atLocation(token)
    .scaleToObject(1.5)
    .belowTokens()
    .randomRotation()
    .opacity(0.85)
    .zIndex(1);

// --- 2. SHADOW ZOOM UNDERNEATH ---
sequence.effect()
    .name(label)
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .atLocation(token)
    .scaleToObject(0.95, { considerTokenScale: true })
    .opacity(0.55)
    .belowTokens()
    .anchor({ x: 0.5, y: 0.5 })
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 6, blurY: 12 })
    .moveTowards(position, { ease: "linear", rotate: false })
    .duration(jumpTime)
    .animateProperty('sprite', 'width', { from: 0, to: -0.45, duration: upTime, gridUnits: true, ease: "easeOutCubic" })
    .animateProperty('sprite', 'width', { from: 0, to: 0.45, duration: downTime, delay: upTime, gridUnits: true, ease: "easeInCubic" })
    .animateProperty('sprite', 'height', { from: 0, to: -0.45, duration: upTime, gridUnits: true, ease: "easeOutCubic" })
    .animateProperty('sprite', 'height', { from: 0, to: 0.45, duration: downTime, delay: upTime, gridUnits: true, ease: "easeInCubic" })
    .zIndex(2);

// --- 3. HIGH ARC AERIAL SPIN TRAJECTORY VIA SEQUENCER 4.3.0+ .MOTION() ---
sequence.animation()
    .on(token)
    .moveTowards(position, { rotate: false, ease: "linear" })
    .motion({
        arc: 0.8,
        rotation: 720,
        duration: jumpTime,
        ease: "easeInOutSine"
    })
    .snapToGrid();

sequence.effect()
    .file(closest("jb2a.wind_stream.white"))
    .anchor({ x: 0.5, y: 1 })
    .atLocation(token)
    .duration(jumpTime)
    .opacity(0.85)
    .scale(tokenWidth * 0.03)
    .moveTowards(position, { rotate: true })
    .animateProperty('spriteContainer', 'position.y', { from: 0, to: -2.8, duration: upTime, gridUnits: true, ease: "easeOutQuad" })
    .animateProperty('spriteContainer', 'position.y', { from: 0, to: 2.8, duration: downTime, delay: upTime, gridUnits: true, ease: "easeInQuad" })
    .zIndex(4);

sequence.wait(jumpTime);

// --- 4. THUNDEROUS GROUND POUNDING ARRIVAL SHOCKWAVE ---
sequence.effect()
    .file(closest("eskie.smoke.06.white"))
    .atLocation(position)
    .scaleToObject(2.5)
    .belowTokens()
    .randomRotation()
    .scaleIn(0, 200, { ease: "easeOutExpo" })
    .opacity(0.95)
    .zIndex(3);

sequence.effect()
    .file(closest("eskie.smoke.03.white"))
    .atLocation(position)
    .scaleToObject(2.0)
    .belowTokens()
    .randomRotation()
    .playbackRate(1.5)
    .scaleIn(0, 300, { ease: "easeOutCubic" })
    .fadeOut(600)
    .zIndex(3);

sequence.effect()
    .file(closest("jb2a.explosion.01.orange"))
    .atLocation(position)
    .scaleToObject(1.6)
    .belowTokens()
    .randomRotation()
    .opacity(0.8)
    .zIndex(2);

await sequence.play();
