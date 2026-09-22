// Standalone Macro: Hit the Dirt
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Hit the Dirt' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "hit-the-dirt";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `Hit the Dirt - ${tokenId}`;
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

// Toggle / re-entrant persistent effect handling: end evasive cover state if active
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    await new Sequence()
        .animation()
            .on(token)
            .rotate(tokenRotation - 90)
        .play();
    return;
}

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
    size: 1,
    icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
    label: 'Hit The Dirt!',
    tag: 'Hit The Dirt!',
    drawIcon: true,
    drawOutline: true,
    rememberControlled: true,
};

const position = await getPosition(scope?.template, cfg);
if (!position) return;

const sequence = new Sequence();

// Departure dust puff at launch location
sequence.effect()
    .delay(100)
    .file(closest("eskie.smoke.06.white"))
    .atLocation(token)
    .scaleToObject(1.1)
    .belowTokens()
    .playbackRate(1.5)
    .opacity(0.5);

// Motion shadow tracking underneath the diving character
sequence.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .atLocation(token)
    .scaleToObject(0.85, { considerTokenScale: true })
    .moveTowards(position, { delay: 100, rotate: false, ease: "easeOutQuint" })
    .duration(1600)
    .belowTokens()
    .filter("ColorMatrix", { saturate: -1, brightness: 0 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .opacity(0.5);

// Target dirt impact puff as token lands hit-the-dirt
sequence.effect()
    .delay(900)
    .file(closest("eskie.smoke.01.white"))
    .atLocation(position)
    .rotateTowards(token)
    .scaleToObject(1.5)
    .belowTokens()
    .spriteOffset({ x: -1.25 }, { gridUnits: true })
    .spriteRotation(-180)
    .opacity(0.5);

// Dive prone tilt and movement using Sequencer 4.3.0+ sequence.motion(token).rotateTo(90, { duration: 300 }).moveBy()
sequence.motion(token)
    .rotateTo(90, { duration: 300 })
    .moveBy(position, { duration: 800, delay: 100, ease: 'easeOutQuint' });

// Persistent tracking effect for staying low evasive cover state & macro toggle support
sequence.effect()
    .name(label)
    .attachTo(token)
    .persist()
    .private();

await sequence.play();

