import { MODULE_ID } from "../lib/constants.js";
import { updateWorldScripts } from "./loader.js";

export const WORLD_SCRIPTS_REGISTRY = [
    {
        id: "eskieRollAnimation",
        name: "EMP.worldScripts.eskieRollAnimation.name",
        description: "EMP.worldScripts.eskieRollAnimation.hint",
        icon: "fa-solid fa-dice-d20"
    }
];

export class WorldScriptsFormApplication extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "eskie-world-scripts-menu",
            title: game.i18n.localize("EMP.worldScripts.menuTitle"),
            template: `modules/${MODULE_ID}/src/world-scripts/worldScriptsMenu.html`,
            classes: ["eskie-world-scripts-form"],
            width: 580,
            height: "auto",
            closeOnSubmit: true
        });
    }

    async getData(options) {
        const currentConfig = game.settings.get(MODULE_ID, "worldScriptsConfig") || {};
        
        const scripts = WORLD_SCRIPTS_REGISTRY.map(script => ({
            ...script,
            name: game.i18n.localize(script.name),
            description: game.i18n.localize(script.description),
            enabled: !!currentConfig[script.id]
        }));

        return {
            scripts,
            menuHint: game.i18n.localize("EMP.worldScripts.menuHint")
        };
    }

    async _updateObject(event, formData) {
        console.log("EMP | Saving World Scripts Configuration:", formData);
        
        // 1. Save the settings object
        await game.settings.set(MODULE_ID, "worldScriptsConfig", formData);
        
        // 2. Dynamically enable/disable scripts in real-time (no page reload required!)
        updateWorldScripts();
        
        // 3. Show a friendly notification
        ui.notifications.info(game.i18n.localize("EMP.worldScripts.savedNotify"));
    }
}
