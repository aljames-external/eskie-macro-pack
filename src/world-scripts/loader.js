import { MODULE_ID } from "../lib/constants.js";
import { rollTracker } from "./rollAnimation.js";

// Registry of all available world-script features
export const worldScripts = {
    rollAnimation: rollTracker
};

/**
 * Centrally loads and initializes all enabled world scripts on startup.
 */
export function loadWorldScripts() {
    console.log("EMP | Loading World Scripts...");
    updateWorldScripts();

    // Listen for settings updates broadcast by the server to sync all clients in real-time!
    Hooks.on("updateSetting", (setting, changes, options, userId) => {
        if (setting.key === `${MODULE_ID}.worldScriptsConfig`) {
            updateWorldScripts();
        }
    });
}

/**
 * Updates the active/inactive state of all world scripts dynamically in real-time.
 * Can be called whenever settings are updated to toggle features instantly without a reload!
 */
export function updateWorldScripts() {
    const config = game.settings.get(MODULE_ID, "worldScriptsConfig") || {};
    
    for (const [scriptId, scriptInstance] of Object.entries(worldScripts)) {
        const shouldEnable = !!config[scriptId];
        if (shouldEnable) {
            scriptInstance.enable();
        } else {
            scriptInstance.disable();
        }
    }
}
