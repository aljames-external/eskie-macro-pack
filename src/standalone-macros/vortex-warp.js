// Standalone Macro: Vortex Warp
// Original Author: EskieMoh#2969
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Vortex Warp' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target a token to warp!");

const label = "Vortex Warp";
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: target });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    return;
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const targetWidth = target.document?.width ?? 1;
const gridSize = canvas.grid?.size ?? 100;
const crosshairConfig = {
    size: (target.w ?? (targetWidth * gridSize)) / gridSize,
    icon: 'icons/magic/air/wind-vortex-swirl-blue.webp',
    label: label,
    tag: label,
    drawIcon: true,
    drawOutline: true,
    interval: targetWidth % 2 === 0 ? 1 : -1,
    rememberControlled: true,
};

const position = await Sequencer.Crosshair.show(crosshairConfig);
if (!position || position.cancelled || !position.x) return;

const portalFile = closest("jb2a.portals.horizontal.vortex.purple");

let sequence = new Sequence();

// Vortex out
sequence = sequence.effect()
    .name(label)
    .file(portalFile)
    .atLocation(target)
    .scaleToObject(2.5)
    .rotateIn(-360, 500, { ease: "easeOutCubic" })
    .rotateOut(360, 500, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeInOutCirc" })
    .scaleOut(0, 600, { ease: "easeOutCubic" })
    .opacity(1)
    .duration(2000)
    .belowTokens()
    .waitUntilFinished(-500);

sequence = sequence.motion(target)
    .moveTo(position, { duration: 500 });

// Vortex in
sequence = sequence.effect()
    .name(label)
    .file(portalFile)
    .atLocation(position)
    .scaleToObject(2.5)
    .rotateIn(-360, 500, { ease: "easeOutCubic" })
    .rotateOut(360, 500, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeInOutCirc" })
    .scaleOut(0, 600, { ease: "easeOutCubic" })
    .opacity(1)
    .duration(2000)
    .waitUntilFinished(-500);

await sequence.play();

