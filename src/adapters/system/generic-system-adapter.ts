import { BaseSystemAdapter } from './base-system-adapter.js';
import { BaseFoundryAdapter } from '../foundry/base-foundry-adapter.js';

/**
 * Generic Fallback System Adapter Class
 * Resolves rolls using regex keyword scans (ideal for PF1e, D&D 3.5, unsupported d20 systems, etc.)
 */
export class GenericSystemAdapter extends BaseSystemAdapter {
    /**
     * @param {BaseFoundryAdapter} [foundry=null]
     */
    constructor(foundry: BaseFoundryAdapter | null = null) {
        super("generic", false, foundry);
    }

    /**
     * Semantically qualifies a chat message using regex keyword analysis.
     * @param {ChatMessage} message
     * @returns {string}
     */
    override qualifyMessage(message: any): string {
        const flavorText = (message?.flavor ?? "").toLowerCase();
        const contentText = message?.content ?? "";
        const contentLower = contentText.toLowerCase();
        const combinedText = `${flavorText} ${contentLower}`;

        const isAttack = /\b(attack|strike|to\s+hit|attack\s+roll)\b/.test(combinedText);
        const isDamage = /\b(damage|damage\s+roll)\b/.test(combinedText);
        const hasKeywords = /\b(save|saving\s+throw|check|skill)\b/.test(combinedText);
        const hasRolls = Boolean((message?.rolls && message.rolls.length > 0) || message?.roll);

        if (hasRolls && (isAttack || isDamage) && !combinedText.includes("saving throw") && !combinedText.includes("save")) {
            if (isAttack) return "attack";
            if (isDamage) return "damage";
        }

        if (hasRolls && !isAttack && !isDamage && hasKeywords) {
            if (/\b(save|saving\s+throw)\b/.test(combinedText)) return "saving throw";
            if (/\b(check|skill)\b/.test(combinedText)) return "ability check";
        }

        return super.qualifyMessage(message);
    }

    /**
     * Extracts generic roll results from a qualified chat message.
     * @param {ChatMessage} message
     * @returns {Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>}
     */
    override extractRolls(message: any): any[] {
        const qualified = this.qualifyMessage(message);
        if (qualified !== "saving throw" && qualified !== "ability check") {
            return [];
        }

        return [{
            source: "generic-keywords",
            rawAbility: null,
            outcome: "indeterminant",
            tokenId: null
        }];
    }
}
