import { BaseSystemAdapter } from "./base.js";

/**
 * Pathfinder 2e (PF2e) System Adapter Class
 * Supports PF2e ruleset roll flags and degrees of success context.
 */
export class Pf2eAdapter extends BaseSystemAdapter {
    constructor() {
        super("pf2e");
    }

    qualifyMessage(message) {
        const pf2eContext = message.flags?.pf2e?.context;
        if (pf2eContext) {
            const type = pf2eContext.type;
            if (type === "saving-throw") return "saving throw";
            if (["skill-check", "perception-check", "ability-check"].includes(type)) return "ability check";
            if (type === "attack-roll") return "attack";
        }
        return super.qualifyMessage(message);
    }

    extractRolls(message) {
        const rolls = [];
        const pf2eContext = message.flags?.pf2e?.context;
        const pf2eFlags = message.flags?.pf2e;

        if (pf2eContext) {
            let outcome = "indeterminant";
            const pf2eOutcome = pf2eContext.outcome; // 'success', 'criticalSuccess', 'failure', 'criticalFailure'
            
            if (pf2eOutcome) {
                if (["success", "criticalSuccess"].includes(pf2eOutcome)) outcome = "success";
                if (["failure", "criticalFailure"].includes(pf2eOutcome)) outcome = "failure";
            }

            // Extract ability robustly: first from context, then from modifiers list, and finally fallback to modifierName
            let rawAbility = pf2eContext.ability || null;
            if (!rawAbility && pf2eFlags) {
                const abilityModifier = pf2eFlags.modifiers?.find(m => m.type === "ability");
                if (abilityModifier) {
                    rawAbility = abilityModifier.ability; // e.g., 'con', 'dex', 'wis'
                } else {
                    rawAbility = pf2eFlags.modifierName || null; // e.g., 'fortitude', 'reflex', 'will'
                }
            }

            rolls.push({
                source: "pf2e-flags",
                rawAbility: rawAbility,
                outcome: outcome,
                tokenId: message.speaker.token || null
            });
        }

        return rolls;
    }

    normalizeAbility(rawAbility, combinedText) {
        // PF2e-specific perception/skill checks and saving throws mapping
        const pf2eMap = {
            perception: "wisdom", prc: "wisdom",
            fortitude: "constitution",
            reflex: "dexterity",
            will: "wisdom"
        };
        return super.normalizeAbility(rawAbility, combinedText, pf2eMap);
    }
}
