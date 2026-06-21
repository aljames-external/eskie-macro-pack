import { MODULE_ID } from "../../lib/constants.js";
import { EMP_AA_Menu } from "../autoanimations.js";
import { log } from '../../lib/logger.js';

export async function generateAutorecUpdate(autorec) {
    log.group("Autorecognition Menu Check", 'debug');
    let settings = {};
    const menuKeys = ["melee", "range", "ontoken", "templatefx", "preset", "aura", "aefx"];
    for (const key of menuKeys) {
        settings[key] = [...new Map(await game.settings.get("autoanimations", `aaAutorec-${key}`).map((v) => [v.id, v])).values()];
    }

    let updatedEntries = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let missingEntries = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let custom = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let same = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let customNew = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };

    // 1st Loop - Check incoming animations against existing settings
    for (const key of menuKeys) {
        if (!autorec[key] || !Array.isArray(autorec[key])) continue;
        autorec[key].forEach(newEntry => {
            const existingEntry = settings[key]?.find(e => e.label === newEntry.label);
            if (existingEntry) {
                if (existingEntry.metaData?.name === "Eskie Macro Pack") {
                    if (foundry.utils.isNewerVersion(newEntry.metaData.version, existingEntry.metaData.version ?? "0.0.0")) {
                        updatedEntries[key].push(newEntry);
                    } else {
                        same[key].push(existingEntry);
                    }
                } else {
                    custom[key].push(existingEntry); // This is a conflict
                }
            } else {
                missingEntries[key].push(newEntry);
            }
        });
    }

    // 2nd Loop - Check existing settings for custom animations to preserve
    for (const key of menuKeys) {
        if (!settings[key] || !Array.isArray(settings[key])) continue;
        settings[key].forEach(existingEntry => {
            const isConflict = custom[key].some(e => e.id === existingEntry.id);
            if (isConflict) return;

            const isSame = same[key].some(e => e.id === existingEntry.id);
            if (isSame) return;

            const isInNew = autorec[key]?.some(e => e.label === existingEntry.label);
            if (isInNew) return; 

            if (existingEntry.metaData?.name !== "Eskie Macro Pack") {
                 customNew[key].push(existingEntry);
            }
        });
    }

    log.debug("The following effects did not exist before. They will be ADDED.", missingEntries);
    log.debug("The following effects will be UPDATED to a new version.", updatedEntries);
    log.debug("The following effects are already up-to-date.", same);
    log.debug("The following effects cannot be added or updated, due to a name conflict with an effect from another source. They will be IGNORED.", custom);
    log.debug("The following custom effects will be preserved.", customNew);
    log.groupEnd();
    
    // Create lists for the dialog
    let missingEntriesList = Object.values(missingEntries).flat().map(e => `${e.label} <i class="emp-animations-muted">(${e.menu})</i>`).sort();
    let updatedEntriesList = Object.values(updatedEntries).flat().map(e => `${e.label} <i class="emp-animations-muted">(${e.menu})</i>`).sort();
    let customEntriesList = Object.values(custom).flat().map(e => `${e.label} <i class="emp-animations-muted">(${e.menu})</i>`).sort();

    // Construct the new settings that will be saved
    let newSettings = {};
    for (const key of menuKeys) {
        const newEntriesForKey = [
            ...(missingEntries[key] ?? []),
            ...(updatedEntries[key] ?? []),
            ...(custom[key] ?? []),
            ...(same[key] ?? []),
            ...(customNew[key] ?? []),
        ];
        newSettings[key] = [...new Map(newEntriesForKey.map((v) => [v.id, v])).values()].sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    }
    newSettings.version = await game.settings.get("autoanimations", "aaAutorec").version;

    return {
        newSettings,
        missingEntriesList,
        updatedEntriesList,
        customEntriesList,
    };
}
    
async function generateAutorecUpdateHTML(autorec) {
    const {
        missingEntriesList,
        updatedEntriesList,
        customEntriesList,
    } = await generateAutorecUpdate(autorec);
    let html = `<h1 style="text-align: center; font-weight: bold;">Eskie Macro Pack AA Integration Update Menu</h1>`;

    if (missingEntriesList.length || updatedEntriesList.length || customEntriesList.length) {
        if (missingEntriesList.length) {
            html += `
            <div class="emp-animations-autorec-update-child">
                <p class="emp-animations-autorec-update-text">${game.i18n.localize("EMP.updateMenu.added")}</p>
                <ul class="emp-animations-autorec-update-ul ${missingEntriesList.length % 3 === 0 ? "emp-animations-columns-3" : ""}">
                    ${missingEntriesList.map((x) => `<li>${x}</li>`).join("")}
                </ul>
            </div>
            `;
        }
        if (customEntriesList.length) {
            html += `
            <div class="emp-animations-autorec-update-child">
                <p class="emp-animations-autorec-update-text">${game.i18n.localize("EMP.updateMenu.custom")}</p>
                <p class="emp-animations-autorec-update-text">${game.i18n.localize("EMP.updateMenu.customHint")}</p>
                <ul class="emp-animations-autorec-update-ul ${customEntriesList.length % 3 === 0 ? "emp-animations-columns-3" : ""}">
                    ${customEntriesList.map((x) => `<li>${x}</li>`).join("")}
                </ul>
            </div>
            `;
        }
        if (updatedEntriesList.length) {
            html += `
            <div class="emp-animations-autorec-update-child">
                <p class="emp-animations-autorec-update-text">${game.i18n.localize("EMP.updateMenu.updated")}</p>
                <ul class="emp-animations-autorec-update-ul ${updatedEntriesList.length % 3 === 0 ? "emp-animations-columns-3" : ""}">
                    ${updatedEntriesList.map((x) => `<li>${x}</li>`).join("")}
                </ul>
            </div>
            `;
        }
        html += `<p style="text-align: center; font-size: 1.2em; font-weight: bold;">${game.i18n.localize("EMP.updateMenu.warning")}</p>`;
    } else {
        html = `<p class="emp-animations-autorec-update-text">${game.i18n.localize("EMP.updateMenu.nothing")}</p>`;
    }
    return html;
}

export class autorecUpdateFormApplication extends FormApplication {
    constructor(autorec) {
        super();
        this.autorec = autorec ?? EMP_AA_Menu;
    }

    async html() {
        return await generateAutorecUpdateHTML(this.autorec);
    }

    async settings() {
        return await generateAutorecUpdate(this.autorec);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["form"],
            popOut: true,
            template: `modules/${MODULE_ID}/src/integration/autoanimations/autorecUpdateMenu.html`,
            id: "empAutorecUpdateMenu",
            title: "Eskie Macro Pack AA Update",
        });
    }

    async getData() {
        // Send data to the template
        return { literallyEverything: await this.html() };
    }

    async activateListeners(html) {
        const {
            missingEntriesList,
            updatedEntriesList,
            customEntriesList,
        } = await this.settings();
        if (!(missingEntriesList.length || updatedEntriesList.length || customEntriesList.length))
            $('[name="update"]').remove();
        super.activateListeners(html);

        html.find('button[name="cancel"]').on('click', () => this.close());
    }

    async _updateObject(event) {
        $(".emp-animations-autorec-update-buttons").attr("disabled", true);
        if (event.submitter.name === "update") {
            log.group("Autorecognition Menu Update");
            const { newSettings } = await this.settings();
            if (Object.keys(newSettings).length === 0)
                return log.debug("Nothing to update!");

            await AutomatedAnimations.AutorecManager.overwriteMenus(JSON.stringify(newSettings), { submitAll: true });
            log.info("Animations have been updated in Automated Animations.");
            log.groupEnd();
        }
    }
}