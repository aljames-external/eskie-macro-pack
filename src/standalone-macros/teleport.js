// Standalone Macro: Teleportation Circle / Group Teleport & Recall
// Original Author: EskieMoh#2969, Unknown (from Discord)
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Teleport' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = "Teleportation Circle";

// Check if effect is already playing (toggle / re-entrant persistent effect handling)
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// Check for existing saved recall anchor flag
const savedAnchor = token.document?.getFlag("world", "teleportRecallAnchor");

// Helper dialog for Wizard Teleportation Circle & Recall options
async function showTeleportDialog() {
    const hasAnchor = Boolean(savedAnchor?.x && savedAnchor?.y);
    const targetedCount = game.user.targets.size;
    const groupDefault = targetedCount > 0 ? "party" : "solo";

        const content = `
            <form style="padding: 5px;">
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Spell Operation Mode:</label>
                    <select id="teleport-mode" style="width: 100%; height: 28px;">
                        <option value="teleport" selected>Wizard Teleport (Choose Destination via Crosshair)</option>
                        ${hasAnchor ? `<option value="recall">Word of Recall (Return to Saved Circle: X:${Math.round(savedAnchor.x)}, Y:${Math.round(savedAnchor.y)})</option>` : ''}
                        <option value="set-anchor">Set / Update Recall Anchor at Current Location</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Transport Scope:</label>
                    <select id="teleport-scope" style="width: 100%; height: 28px;">
                        <option value="party" ${groupDefault === "party" ? "selected" : ""}>Party Group (Caster + ${targetedCount} Targeted Creature${targetedCount !== 1 ? 's' : ''})</option>
                        <option value="solo" ${groupDefault === "solo" ? "selected" : ""}>Solo (Caster Only)</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 5px;">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <input type="checkbox" id="save-anchor" ${!hasAnchor ? "checked" : ""}>
                        <span>Save Departure Location as Recall Anchor</span>
                    </label>
                </div>
            </form>
        `;

    const dialogCls = foundry.applications?.api?.DialogV2;
    if (dialogCls?.prompt) {
        return dialogCls.prompt({
            window: { title: "Wizard Teleportation Circle & Group Recall" },
            content,
            ok: {
                label: "Cast Spell",
                icon: "fa-solid fa-wand-magic-sparkles",
                callback: (event, button, dialog) => {
                    const form = button.form;
                    return {
                        mode: form?.elements?.['teleport-mode']?.value ?? form?.querySelector?.('#teleport-mode')?.value ?? "teleport",
                        scope: form?.elements?.['teleport-scope']?.value ?? form?.querySelector?.('#teleport-scope')?.value ?? groupDefault,
                        saveAnchor: Boolean(form?.querySelector?.('#save-anchor')?.checked)
                    };
                }
            },
            rejectClose: false
        });
    }

    return new Promise((resolve) => {
        new Dialog({
            title: "Wizard Teleportation Circle & Group Recall",
            content: content,
            buttons: {
                cast: {
                    icon: '<i class="fas fa-magic"></i>',
                    label: "Cast Spell",
                    callback: (html) => {
                        resolve({
                            mode: html.find("#teleport-mode").val(),
                            scope: html.find("#teleport-scope").val(),
                            saveAnchor: html.find("#save-anchor").is(":checked")
                        });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => resolve(null)
                }
            },
            default: "cast",
            close: () => resolve(null)
        }).render(true);
    });
}

const choices = await showTeleportDialog();
if (!choices) return;

if (choices.mode === "set-anchor") {
    const currentPos = { x: token.center?.x ?? token.x, y: token.center?.y ?? token.y };
    await token.document?.setFlag("world", "teleportRecallAnchor", currentPos);
    ui.notifications.info(`Saved recall anchor for ${token.name} at coordinates (${Math.round(currentPos.x)}, ${Math.round(currentPos.y)}).`);
    return;
}

// Determine group participants
const partyTargets = (choices.scope === "party")
    ? Array.from(game.user.targets).filter(t => t.id !== token.id)
    : [];

// Save departure anchor if option selected
if (choices.saveAnchor) {
    const departurePos = { x: token.center?.x ?? token.x, y: token.center?.y ?? token.y };
    await token.document?.setFlag("world", "teleportRecallAnchor", departurePos);
}

// Determine destination coordinates
let destination = null;
if (choices.mode === "recall" && savedAnchor?.x && savedAnchor?.y) {
    destination = { x: savedAnchor.x, y: savedAnchor.y };
} else {
    const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
    const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;

    const crosshairConfig = {
        size: token.document?.width ?? 1,
        icon: portalPath,
        label: 'Teleportation Circle Destination',
        tag: label,
        rememberControlled: true
    };
    const crosshairPos = await Sequencer.Crosshair.show(crosshairConfig);
    if (!crosshairPos || crosshairPos.cancelled) return;
    destination = crosshairPos;
}

const gridSize = canvas.grid?.size ?? canvas.dimensions?.size ?? 100;
const allTokens = [token, ...partyTargets];
const maxDistance = (allTokens.length > 1)
    ? Math.max(...allTokens.map(t => 3 * Math.max(Math.abs(t.x - token.x), Math.abs(t.y - token.y)) / gridSize + 1))
    : 1.5;

const tokenCenter = { x: token.center?.x ?? token.x, y: token.center?.y ?? token.y };

let sequence = new Sequence();

// ==========================================
// DEPARTURE: Wizard Teleportation Circle Formation
// ==========================================

// Outward dimensional particles around caster
sequence = sequence.effect()
    .name(label)
    .file(closest("jb2a.particles.outward.blue.01.05"))
    .atLocation(token)
    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
    .scaleToObject(1.7)
    .fadeIn(3000, { ease: "easeInExpo" })
    .duration(5500);

sequence = sequence.effect()
    .name(label)
    .file(closest("jb2a.particles.outward.blue.01.05"))
    .atLocation(token)
    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
    .scaleToObject(4)
    .belowTokens()
    .fadeIn(3000, { ease: "easeInExpo" })
    .duration(5500);

// Wizard Teleportation Circle intro formation at departure site
sequence = sequence.effect()
    .name(label)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.intro.blue"))
    .atLocation(token)
    .belowTokens()
    .scaleToObject(maxDistance)
    .filter("ColorMatrix", { saturate: -0.25, brightness: 1 })
    .opacity(0.8)
    .waitUntilFinished(-1000);

// Wizard Teleportation Circle loop active rotation
sequence = sequence.effect()
    .name(label)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
    .atLocation(token)
    .filter("ColorMatrix", { saturate: -0.5, brightness: 1.5 })
    .opacity(0.65)
    .belowTokens()
    .scaleToObject(maxDistance)
    .duration(2500);

sequence = sequence.wait(2500);

// ==========================================
// ARRIVAL: Teleportation Circle & Planar Magic Flash
// ==========================================

// Destination Wizard Teleportation Circle intro formation
sequence = sequence.effect()
    .name(label)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.intro.blue"))
    .atLocation(destination)
    .belowTokens()
    .scaleToObject(maxDistance)
    .filter("ColorMatrix", { saturate: -0.25, brightness: 1 })
    .opacity(0.8)
    .waitUntilFinished(-500);

// Destination Wizard Teleportation Circle loop energy
sequence = sequence.effect()
    .name(label)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
    .atLocation(destination)
    .filter("ColorMatrix", { saturate: -0.5, brightness: 1.5 })
    .opacity(0.65)
    .belowTokens()
    .scaleToObject(maxDistance)
    .duration(2500)
    .waitUntilFinished(-1500);

// Sequencer 4.3.0+ motion arrival for caster
sequence = sequence.motion(token)
    .moveTo(destination, { duration: 500, offset: { x: -1, y: -1 } });

// Sequencer 4.3.0+ motion arrival for each party target
partyTargets.forEach(target => {
    const targetCenterX = target.center?.x ?? target.x;
    const targetCenterY = target.center?.y ?? target.y;
    const offsetX = targetCenterX - tokenCenter.x;
    const offsetY = targetCenterY - tokenCenter.y;
    const targetDest = { x: destination.x + offsetX, y: destination.y + offsetY };

    sequence = sequence.motion(target)
        .moveTo(targetDest, { duration: 500, offset: { x: -1, y: -1 } });
});

// Flash bloom impact blue wave on arrival
sequence = sequence.effect()
    .name(label)
    .file(closest("jb2a.impact.004.blue"))
    .atLocation(destination)
    .scaleToObject(maxDistance)
    .belowTokens();

sequence = sequence.wait(500);

await sequence.play();
