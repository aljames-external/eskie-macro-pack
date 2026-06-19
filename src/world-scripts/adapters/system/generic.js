import { BaseSystemAdapter } from "./base.js";

/**
 * Generic Fallback Adapter Class
 * Resolves rolls using regex keyword scans (ideal for PF1e, D&D 3.5, etc.)
 */
export class GenericAdapter extends BaseSystemAdapter {
    constructor() {
        super("generic");
    }

    qualifyMessage(message) {
        const flavorText = message.flavor?.toLowerCase() || "";
        const contentText = message.content || "";
        const contentLower = contentText.toLowerCase();
        const combinedText = `${flavorText} ${contentLower}`;

        const hasKeywords = /save|saving\s+throw|check|skill/.test(combinedText);
        const isAttackOrDamage = /attack|strike|damage|damage\s+roll/.test(combinedText);
        const hasRolls = (message.rolls && message.rolls.length > 0) || message.roll;

        if (hasRolls && !isAttackOrDamage && hasKeywords) {
            if (/save|saving\s+throw/.test(combinedText)) return "saving throw";
            if (/check|skill/.test(combinedText)) return "ability check";
        }

        return super.qualifyMessage(message);
    }

    extractRolls(message) {
        // Since the message was already qualified, we can return a generic roll structure
        return [{
            source: "generic-keywords",
            rawAbility: null,
            outcome: "indeterminant",
            tokenId: null
        }];
    }

    normalizeAbility(rawAbility, combinedText) {
        return super.normalizeAbility(rawAbility, combinedText);
    }
}
