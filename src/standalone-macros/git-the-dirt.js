// Standalone Macro: Git the Dirt!
// Original Author: EskieMoh#2969
// Modular Conversion & .motion() Update: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Git the Dirt!' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

async function getPosition(templateDoc, config = {}) {
    if (templateDoc) {
        let primary;
        if (templateDoc.documentName === 'Region' || templateDoc.shapes) {
            const shape = templateDoc.shapes?.[0];
            primary = { x: shape?.x ?? 0, y: shape?.y ?? 0 };
        } else {
            const farpoint = templateDoc.object?.ray?.B;
            primary = { x: farpoint?.x ?? templateDoc.x, y: farpoint?.y ?? templateDoc.y };
        }
        return primary;
    } else {
        const position = await Sequencer.Crosshair.show(config);
        if (!position || position.cancelled) return null;
        return position;
    }
}

const cfg = {
    radius: 1,
    icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
    label: 'Git The Dirt!'
};

const position = await getPosition(scope?.template, cfg);
if (!position) return;

const sequence = new Sequence();

// Launch dust puff
sequence.effect()
    .delay(50)
    .file(closest('eskie.smoke.06.white'))
    .atLocation(token)
    .scaleToObject(1.1)
    .belowTokens()
    .playbackRate(1.5)
    .opacity(0.5);

// Motion shadow tracking under diving token
sequence.effect()
    .copySprite(token)
    .atLocation(token)
    .scaleToObject(0.85, { considerTokenScale: true })
    .moveTowards(position, { delay: 50, rotate: false, ease: 'easeOutQuint' })
    .duration(1200)
    .belowTokens()
    .filter('ColorMatrix', { saturate: -1, brightness: 0 })
    .filter('Blur', { blurX: 5, blurY: 10 })
    .opacity(0.5);

// Gunslinger dive jump trajectory and prone rotation tilt using Sequencer 4.3.0+ sequence.motion(token).rotateTo(90).moveBy()
sequence.motion(token)
    .rotateTo(90)
    .moveBy(position, { delay: 50, ease: 'easeOutQuint' });

// Target landing dirt impact puff
sequence.effect()
    .delay(800)
    .file(closest('eskie.smoke.01.white'))
    .atLocation(position)
    .rotateTowards(token)
    .scaleToObject(1.5)
    .belowTokens()
    .spriteOffset({ x: -1.25 }, { gridUnits: true })
    .opacity(0.5);

await sequence.play();
