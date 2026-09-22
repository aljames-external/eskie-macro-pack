// Standalone Macro: Ricochet Shot
// Author: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Ricochet Shot' macro requires the 'Sequencer' module to be installed and active!");
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

let finalPos = targetToken ? { x: targetToken.center.x, y: targetToken.center.y } : null;
if (!finalPos) {
    const cfg = {
        radius: 1,
        icon: 'icons/weapons/guns/rifle-scope-red.webp',
        label: 'Ricochet Shot'
    };
    finalPos = await getPosition(scope?.template, cfg);
    if (!finalPos) return;
}

const casterCenter = token.center ?? { x: token.x, y: token.y };
const bouncePos = {
    x: (casterCenter.x + finalPos.x) / 2 + 100,
    y: (casterCenter.y + finalPos.y) / 2 - 100
};

const tokenPlaceable = token?.object ?? token;

const sequence = new Sequence();

// Caster recoil via Sequencer 4.3.0+ .motion()
sequence.motion(tokenPlaceable)
    .moveBy({ x: -10, y: 0 }, { duration: 125, ease: 'easeOutQuad' })
    .moveBy({ x: 10, y: 0 }, { duration: 125, ease: 'easeInQuad' });

// Primary shot streak to ricochet point
sequence.effect()
    .file(closest('jb2a.bullet.01.orange'))
    .atLocation(token)
    .stretchTo(bouncePos)
    .playbackRate(2);

// Ricochet spark burst at bounce point
sequence.effect()
    .delay(150)
    .file(closest('jb2a.sparks.orange'))
    .atLocation(bouncePos)
    .scaleToObject(1.2);

// Secondary ricochet streak to target
sequence.effect()
    .delay(200)
    .file(closest('jb2a.bullet.01.orange'))
    .atLocation(bouncePos)
    .stretchTo(finalPos)
    .playbackRate(2);

// Final target hit spark
sequence.effect()
    .delay(350)
    .file(closest('jb2a.impact.orange'))
    .atLocation(finalPos)
    .scaleToObject(1.4, { considerTokenScale: true });

await sequence.play();
