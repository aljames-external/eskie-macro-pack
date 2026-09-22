// Standalone Macro: Black Powder Boost
// Author: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Black Powder Boost' macro requires the 'Sequencer' module to be installed and active!");
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
    icon: 'icons/skills/movement/feet-boost-jumped-yellow.webp',
    label: 'Black Powder Boost'
};

const position = await getPosition(scope?.template, cfg);
if (!position) return;

const sequence = new Sequence();

// Launch blast at origin
sequence.effect()
    .file(closest('eskie.smoke.06.white'))
    .atLocation(token)
    .scaleToObject(1.4)
    .belowTokens()
    .playbackRate(1.5)
    .opacity(0.7);

const tokenPlaceable = token?.object ?? token;

// Gunslinger token propulsion using Sequencer 4.3.0+ .motion()
sequence.motion(tokenPlaceable)
    .moveTo(position, { duration: 500, ease: 'easeOutExpo' });

// Landing smoke impact puff
sequence.effect()
    .delay(400)
    .file(closest('eskie.smoke.01.white'))
    .atLocation(position)
    .size(1.5, { gridUnits: true })
    .belowTokens()
    .opacity(0.6);

await sequence.play();
