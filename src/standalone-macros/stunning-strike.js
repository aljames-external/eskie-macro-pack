// Standalone Macro: Stunning Strike
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Stunning Strike' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const id = "stunningStrike";
const activeStuns = Sequencer.EffectManager.getEffects({ name: `*StunningStrike*` });
if (activeStuns.length > 0) {
    Sequencer.EffectManager.endEffects({ name: `*StunningStrike*` });
    Sequencer.EffectManager.endEffects({ name: id });
    return ui.notifications.info("Cleared Stunning Strike state.");
}

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const label = `StunningStrike - DizzyStars - ${id} - ${target.uuid}`;

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tokenCenter = token.center;
const targetCenter = target.center;

const middle = {
    x: (targetCenter.x - tokenCenter.x) * 0.25,
    y: (targetCenter.y - tokenCenter.y) * 0.25,
};

const targetWidth = target.document.width;

const sequence = new Sequence();

sequence
    .effect()
    .file(closest("jb2a.sacred_flame.target.blue"))
    .atLocation(token, { offset: { y: 0 }, gridUnits: true })
    .scaleToObject(0.5)
    .playbackRate(2)
    .fadeOut(100)
    .zIndex(2)

    .effect()
    .file(closest("jb2a.token_border.circle.static.blue.012"))
    .attachTo(token)
    .opacity(0.75)
    .scaleToObject(2)
    .filter("ColorMatrix", { saturate: 0 })
    .fadeIn(500)
    .duration(1500)
    .belowTokens()
    .fadeOut(250)

    .effect()
    .file(closest("jb2a.particles.inward.blue.01.01"))
    .attachTo(token)
    .opacity(0.35)
    .scaleToObject(1.5)
    .filter("ColorMatrix", { saturate: 1 })
    .fadeIn(500)
    .duration(1500)
    .mask(token)
    .fadeOut(250)

    .wait(950)

    .canvasPan()
    .delay(250)
    .shake({ duration: 250, strength: 2, rotation: false })

    .effect()
    .file(closest("jb2a.swirling_leaves.outburst.01.pink"))
    .scaleIn(0, 500, { ease: "easeOutCubic" })
    .filter("ColorMatrix", { saturate: 1, hue: -105 })
    .scaleToObject(0.75)
    .fadeOut(2000)
    .atLocation(token)
    .zIndex(1)

    .motion(token)
    .moveBy(middle, { duration: 100, ease: "easeOutExpo" })
    .moveBy({ x: -middle.x, y: -middle.y }, { duration: 350, ease: "easeInOutQuad" })

    .effect()
    .file(closest("jb2a.impact.010.blue"))
    .scaleIn(0, 100, { ease: "easeOutCubic" })
    .scaleToObject(2.5)
    .atLocation(target)
    .randomRotation()

    .effect()
    .file(closest("jb2a.impact.ground_crack.blue.02"))
    .scaleIn(0, 100, { ease: "easeOutCubic" })
    .scaleToObject(2.5)
    .atLocation(target)
    .randomRotation()
    .belowTokens()

    .effect()
    .delay(200)
    .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
    .scaleIn(0, 100, { ease: "easeOutCubic" })
    .scaleToObject(1.75)
    .opacity(0.5)
    .atLocation(target)
    .belowTokens()

    .effect()
    .delay(200)
    .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
    .scaleIn(0, 100, { ease: "easeOutCubic" })
    .scaleToObject(2.5)
    .opacity(0.5)
    .atLocation(target)
    .belowTokens()

    .motion(target)
    .oscillate()

    .effect()
    .name(label)
    .delay(1000)
    .file(closest("jb2a.dizzy_stars.200px.yellow"))
    .scaleIn(0, 100, { ease: "easeOutCubic" })
    .scaleToObject(1)
    .opacity(1)
    .attachTo(target, { offset: { y: -0.5 * targetWidth }, gridUnits: true })
    .persist();

await sequence.play();

