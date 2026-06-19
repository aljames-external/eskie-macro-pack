import { parseAndNormalizeAbility } from "../helper.js";

/**
 * Generic Fallback Adapter
 * Resolves rolls using regex keyword scans (ideal for PF1e, D&D 3.5, etc.)
 */
export const genericAdapter = {
    id: "generic",
    extractRolls(message) {
        const rolls = [];
        const flavorText = message.flavor?.toLowerCase() || "";
        const contentText = message.content || "";
        const contentLower = contentText.toLowerCase();
        const combinedText = `${flavorText} ${contentLower}`;

        const hasKeywords = /save|saving\s+throw|check|skill/.test(combinedText);
        const isAttackOrDamage = /attack|strike|damage|damage\s+roll/.test(combinedText);

        if (hasKeywords && !isAttackOrDamage) {
            rolls.push({
                source: "generic-keywords",
                rawAbility: null,
                outcome: "indeterminant",
                tokenId: null
            });
        }

        return rolls;
    },

    normalizeAbility(rawAbility, combinedText) {
        return parseAndNormalizeAbility(rawAbility, combinedText);
    }
};
