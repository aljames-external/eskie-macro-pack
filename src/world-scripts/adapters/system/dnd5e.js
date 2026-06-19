import { BaseSystemAdapter } from "./base.js";
import { midiQolAdapter } from "../module/midiQol.js";
import { debug } from "../../../lib/debug.js";

/**
 * D&D 5e System Adapter Class
 * Supports core rolls and handles Midi-QOL automation via its module adapter.
 */
export class Dnd5eAdapter extends BaseSystemAdapter {
    constructor() {
        super("dnd5e");
    }

    qualifyMessage(message) {
        // Add debug logging
        debug.log(`Dnd5eAdapter.qualifyMessage: message="${message.id}"`, {
            rollType: message.flags?.dnd5e?.roll?.type,
            messageType: message.flags?.dnd5e?.messageType,
            midiMessageType: message.flags?.["midi-qol"]?.messageType,
            midiType: message.flags?.["midi-qol"]?.type,
            flavor: message.flavor
        });

        // 1. Midi-QOL Saves Display HTML Check (High Priority)
        // Midi-QOL main workflow cards (messageType: "attack" / "item") can dynamically contain target saving throw outcomes
        if (midiQolAdapter.isActive()) {
            const contentText = message.content || "";
            if (contentText.includes("midi-qol") && contentText.includes("midi-qol-saves-display")) {
                return "saving throw";
            }
        }

        // 2. Core D&D 5e Roll Flags
        const rollFlags = message.flags?.dnd5e?.roll;
        if (rollFlags) {
            if (rollFlags.type === "save") return "saving throw";
            if (["ability", "skill"].includes(rollFlags.type)) return "ability check";
            if (rollFlags.type === "attack") return "attack";
            if (rollFlags.type === "damage") return "damage";
        }

        // 3. Core Item Usage
        if (message.flags?.dnd5e?.messageType === "usage") return "item description";

        // 4. Midi-QOL Flags
        if (midiQolAdapter.isActive()) {
            const midiFlags = message.flags?.["midi-qol"];
            const messageType = midiFlags?.messageType || midiFlags?.type;
            if (messageType) {
                if (messageType === "save") return "saving throw";
                if (messageType === "check") return "ability check";
                if (messageType === "attack") return "attack";
                if (messageType === "damage") return "damage";
                if (messageType === "item") return "item description";
            }
        }

        // 4. Default Fallback
        return super.qualifyMessage(message);
    }

    extractRolls(message) {
        const rolls = [];

        // 1. Core System Flag Checks (rolls from character sheets)
        const rollFlags = message.flags?.dnd5e?.roll;
        if (rollFlags) {
            rolls.push({
                source: "dnd5e-core-flags",
                rawAbility: rollFlags.ability,
                outcome: "indeterminant",
                tokenId: null
            });
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



        // Distribute module-level outcome to core/fallback rolls if they are still indeterminant
        rolls.forEach(roll => {
            if (roll.outcome === "indeterminant" && moduleOutcome !== "indeterminant") {
                roll.outcome = moduleOutcome;
            }
        });

        return rolls;
    }

    normalizeAbility(rawAbility, combinedText) {
        // DnD 5e-specific skill and feature abbreviations
        const dnd5eMap = {
            ath: "strength",
            acr: "dexterity", ste: "dexterity", sle: "dexterity",
            arc: "intelligence", his: "intelligence", inv: "intelligence", nat: "intelligence", rel: "intelligence",
            ani: "wisdom", ins: "wisdom", med: "wisdom", per: "wisdom", sur: "wisdom",
            dec: "charisma", itm: "charisma", prf: "charisma", pers: "charisma"
        };
        return super.normalizeAbility(rawAbility, combinedText, dnd5eMap);
    }
}
