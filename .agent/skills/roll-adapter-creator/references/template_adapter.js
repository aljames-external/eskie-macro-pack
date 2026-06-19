import { BaseSystemAdapter } from "./base.js";

/**
 * Template System Adapter Class
 * Use this as a boilerplate for building new system-specific roll adapters.
 * Replace "Template" and "template" with the actual system name (e.g., Lancer, Cypher).
 */
export class TemplateAdapter extends BaseSystemAdapter {
    constructor() {
        // Initialize the superclass with the unique system ID (matches game.system.id)
        super("template-system-id");
    }

    /**
     * Extracts raw roll results from a chat message.
     * @param {ChatMessage} message The VTT ChatMessage document
     * @returns {Array} List of extracted rolls: [{ source, rawAbility, outcome, tokenId }]
     */
    extractRolls(message) {
        const rolls = [];

        // 1. Gather all message text for keyword matching
        const flavorText = message.flavor?.toLowerCase() || "";
        const contentText = message.content || "";
        const contentLower = contentText.toLowerCase();
        const combinedText = `${flavorText} ${contentLower}`;

        // 2. Identify the casting token
        // Use message.speaker to find the speaker token in the scene
        const speaker = message.speaker;
        const tokenId = speaker?.token || null;

        // 3. Extract rolls using System Flags (Character Sheet Rolls)
        // Check the system-specific flags on the message document.
        // For example, if the system stores roll data under message.flags.template:
        const systemFlags = message.flags?.["template-system-id"];
        if (systemFlags) {
            // Identify if the roll is an ability check, skill, or saving throw
            const isCheck = ["skill", "ability"].includes(systemFlags.type);
            if (isCheck) {
                rolls.push({
                    source: "template-core-flags",
                    rawAbility: systemFlags.abilityKey, // E.g., 'str', 'acr'
                    outcome: "indeterminant",          // Success/failure is resolved downstream or if flags provide it
                    tokenId: tokenId
                });
            }
        }

        // 4. Fallback Keyword Strings
        // If no flags were matched, search the text for action-defining keywords
        if (rolls.length === 0) {
            const hasKeywords = /save|check|skill|roll/.test(combinedText);
            if (hasKeywords) {
                // Parse ability or skill names out of the text
                rolls.push({
                    source: "template-fallback-keywords",
                    rawAbility: null, // Will be extracted from text in normalizeAbility
                    outcome: "indeterminant",
                    tokenId: tokenId
                });
            }
        }

        return rolls;
    }

    /**
     * Normalizes a system-specific ability string into the canonical Eskie asset name.
     * @param {string} rawAbility The raw string extracted from flags (e.g., 'ath')
     * @param {string} combinedText The full text of the chat message (for regex fallbacks)
     * @returns {string|null} The normalized asset key (e.g., 'strength', 'wisdom')
     */
    normalizeAbility(rawAbility, combinedText) {
        // System-specific abbreviations and skill-to-ability mappings
        const systemCustomMap = {
            // E.g., map local skills or custom attributes:
            // ath: "strength",
            // acr: "dexterity",
            // ste: "dexterity",
        };
        
        // Pass the custom map to the base helper, which merges it with the standard 6 attributes
        return super.normalizeAbility(rawAbility, combinedText, systemCustomMap);
    }
}
