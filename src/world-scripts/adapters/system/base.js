import { parseAndNormalizeAbility } from "../helper.js";

/**
 * Base System Adapter Class
 * Defines the polymorphic interface and shared normalization routines for all system adapters.
 */
export class BaseSystemAdapter {
    constructor(id) {
        this.id = id;
    }

    /**
     * Semantically classifies a chat message to determine its purpose.
     * Returns a string representing the type: "saving throw", "ability check", "attack", "damage", "item description", "text", or "unknown".
     * @returns {string} The message classification.
     */
    qualifyMessage(message) {
        const hasRolls = (message.rolls && message.rolls.length > 0) || message.roll;
        if (!hasRolls) return "text";
        return "unknown";
    }

    /**
     * Extracts raw roll results from a chat message.
     * Must be implemented by subclasses.
     * @returns {Array} List of rolls: [{ source, rawAbility, outcome, tokenId }]
     */
    extractRolls(message) {
        throw new Error(`[Eskie Animation] extractRolls(message) must be implemented by subclass of BaseSystemAdapter`);
    }

    /**
     * Normalizes a system-specific ability string using base and custom mappings.
     */
    normalizeAbility(rawAbility, combinedText, customMap = {}) {
        return parseAndNormalizeAbility(rawAbility, combinedText, customMap);
    }
}
