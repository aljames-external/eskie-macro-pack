// Standalone Macro: Shattering Shot
// Author: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Shattering Shot' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const targetToken = Array.from(game.user.targets)[0];
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

let targetPos = targetToken ? { x: targetToken.center.x, y: targetToken.center.y } : null;
if (!targetPos) {
    const cfg = {
        radius: 1,
        icon: 'icons/magic/defensive/shield-barrier-glowing-triangle-orange.webp',
        label: 'Shattering Shot'
    };
    targetPos = await getPosition(scope?.template, cfg);
    if (!targetPos) return;
}

const tokenPlaceable = token?.object ?? token;

const sequence = new Sequence();

// Heavy shooter recoil motion via Sequencer 4.3.0+ .motion()
sequence.motion(tokenPlaceable)
    .moveBy({ x: -20, y: 0 }, { duration: 200, ease: 'easeOutQuad' })
    .moveBy({ x: 20, y: 0 }, { duration: 200, ease: 'easeInQuad' });

// High velocity armor piercing projectile beam
sequence.effect()
    .file(closest('jb2a.disintegrate.orange'))
    .atLocation(token)
    .stretchTo(targetPos)
    .playbackRate(1.5)
    .opacity(0.95);

// Armor shattering blast and fragments on target
sequence.effect()
    .delay(200)
    .file(closest('jb2a.shatter.orange'))
    .atLocation(targetPos)
    .scaleToObject(2.0, { considerTokenScale: true });

await sequence.play();
