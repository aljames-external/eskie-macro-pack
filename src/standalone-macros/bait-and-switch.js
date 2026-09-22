// Standalone Macro: Bait and Switch
// Original Author: .eskie
// Modular Conversion & Sequencer 4.3.0+ .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Bait and Switch' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const tokenCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
const targetCenter = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

let blurDirectionX = 0;
let blurDirectionY = 0;
if (token.x === target.x) blurDirectionY = 15;
if (token.y === target.y) blurDirectionX = 20;

const sequence = new Sequence();

// Target position swap motion via Sequencer 4.3.0+ sequence.motion(target)
sequence.motion(target)
    .moveTo(tokenCenter, { rotate: false, ease: "easeInBack", delay: 250 })
    .moveSpeed(500)
    .duration(1000);

// Token position swap motion via Sequencer 4.3.0+ sequence.motion(token)
sequence.motion(token)
    .moveTo(targetCenter, { rotate: false, ease: "easeOutCubic", delay: 500 })
    .moveSpeed(300)
    .duration(1250);

sequence.effect()
    .copySprite(token)
    .scaleToObject(1, { considerTokenScale: true })
    .moveTowards(targetCenter, { rotate: false, ease: "easeOutCubic", delay: 500 })
    .moveSpeed(300)
    .duration(1250)
    .opacity(0.85)
    .fadeIn(50, { delay: 500 })
    .fadeOut(500, { ease: "easeOutQuint" })
    .filter("Blur", { blurX: blurDirectionX, blurY: blurDirectionY })
    .zIndex(0.1);

sequence.effect()
    .file(closest("eskie.smoke.01.white"))
    .atLocation(targetCenter)
    .rotateTowards(tokenCenter)
    .scaleToObject(1.5, { considerTokenScale: true })
    .belowTokens()
    .delay(750)
    .opacity(0.4)
    .spriteOffset({ x: -0.5 }, { gridUnits: true })
    .mirrorX()
    .spriteRotation(180);

await sequence.play();
