import { MODULE_ID } from "../lib/constants.js"

export function settingsOverride(config = {}) {
    if (!game.settings.get(MODULE_ID, 'enableSounds')) {
        config = foundry.utils.mergeObject(config, { sound: { enabled: false } });
    }
    return config;
}