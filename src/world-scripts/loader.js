import { MODULE_ID } from "../lib/constants.js";
import { initialize as initEskieRollAnimation } from "./eskieRollAnimation.js";

/**
 * Centrally loads and initializes all enabled world scripts.
 */
export function loadWorldScripts() {
    console.log("EMP | Loading World Scripts...");
    const config = game.settings.get(MODULE_ID, "worldScriptsConfig") || {};
    
    if (config.eskieRollAnimation) {
        try {
            initEskieRollAnimation();
        } catch (e) {
            console.error("EMP | Error initializing Eskie Roll Animations:", e);
        }
    }
}
