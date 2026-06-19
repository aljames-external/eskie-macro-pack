import { BaseSystemAdapter } from "./base.js";

/**
 * Generic Fallback Adapter Class
 * Resolves rolls using regex keyword scans (ideal for PF1e, D&D 3.5, etc.)
 */
export class GenericAdapter extends BaseSystemAdapter {
    constructor() {
        super("generic");
    }

    extractRolls(message) {
        // Generic system rolls are disabled by default (no structured flags available)
        return [];
    }

    normalizeAbility(rawAbility, combinedText) {
        return super.normalizeAbility(rawAbility, combinedText);
    }
}
