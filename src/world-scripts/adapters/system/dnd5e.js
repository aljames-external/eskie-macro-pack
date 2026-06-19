import { parseAndNormalizeAbility } from "../helper.js";
import { midiQolAdapter } from "../module/midiQol.js";

/**
 * D&D 5e System Adapter
 * Supports core rolls and handles Midi-QOL automation via its module adapter.
 */
export const dnd5eAdapter = {
    id: "dnd5e",
    extractRolls(message) {
        const rolls = [];
        const flavorText = message.flavor?.toLowerCase() || "";
        const contentText = message.content || "";
        const contentLower = contentText.toLowerCase();
        const combinedText = `${flavorText} ${contentLower}`;

        // 1. Core System Flag Checks (rolls from character sheets)
        const rollFlags = message.flags?.dnd5e?.roll;
        if (rollFlags) {
            const isCoreValid = ["save", "ability", "skill"].includes(rollFlags.type);
            if (isCoreValid) {
                rolls.push({
                    source: "dnd5e-core-flags",
                    rawAbility: rollFlags.ability,
                    outcome: "indeterminant",
                    tokenId: null
                });
            }
        }

        // 2. Process Active Module Adapters (e.g. Midi-QOL)
        let moduleOutcome = "indeterminant";
        if (midiQolAdapter.isActive()) {
            const midiData = midiQolAdapter.extractRolls(message);
            if (midiData.rolls.length > 0) {
                rolls.push(...midiData.rolls);
            }
            moduleOutcome = midiData.outcome;
        }

        // 3. Fallback Keyword Strings (Only run if no rolls have been identified yet)
        if (rolls.length === 0) {
            const isItemUsage = message.flags?.dnd5e?.messageType === "usage";
            const isMidiAttack = midiQolAdapter.isActive() && ["attack", "damage", "item"].includes(message.flags?.["midi-qol"]?.messageType);
            
            if (!isItemUsage && !isMidiAttack) {
                const hasKeywords = /save|saving\s+throw|check|skill/.test(combinedText);
                if (hasKeywords) {
                    rolls.push({
                        source: "dnd5e-fallback-keywords",
                        rawAbility: null,
                        outcome: "indeterminant",
                        tokenId: null
                    });
                }
            }
        }

        // Distribute module-level outcome to core/fallback rolls if they are still indeterminant
        rolls.forEach(roll => {
            if (roll.outcome === "indeterminant" && moduleOutcome !== "indeterminant") {
                roll.outcome = moduleOutcome;
            }
        });

        return rolls;
    },

    normalizeAbility(rawAbility, combinedText) {
        // DnD 5e-specific skill and feature abbreviations
        const dnd5eMap = {
            ath: "strength",
            acr: "dexterity", ste: "dexterity", sle: "dexterity",
            arc: "intelligence", his: "intelligence", inv: "intelligence", nat: "intelligence", rel: "intelligence",
            ani: "wisdom", ins: "wisdom", med: "wisdom", per: "wisdom", sur: "wisdom",
            dec: "charisma", itm: "charisma", prf: "charisma", pers: "charisma"
        };
        return parseAndNormalizeAbility(rawAbility, combinedText, dnd5eMap);
    }
};
