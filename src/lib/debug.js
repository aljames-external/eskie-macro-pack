import { MODULE_ID, MODULE_TLA } from "./constants.js";

export const debug = {
    get enable() {
        try {
            return game.settings.get(MODULE_ID, "debugEnabled") || false;
        } catch (e) {
            return false;
        }
    },
    set enable(val) {
        game.settings.set(MODULE_ID, "debugEnabled", !!val);
    },
    log(...args) {
        if (this.enable) {
            console.log(`%c[${MODULE_TLA} Debug]`, "color: #38bdf8; font-weight: bold;", ...args);
        }
    }
};
