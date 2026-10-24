import { BaseSystemAdapter } from './base-system-adapter.js';
import { BaseFoundryAdapter } from '../foundry/base-foundry-adapter.js';
import { midiQolAdapter } from '../modules/midi-qol/midi-qol-module-adapter.js';
import { log } from '../../lib/logger.js';

/**
 * D&D 5e System Adapter Class
 * Supports core D&D 5e rolls, flags, spell contracts, creature types, and handles Midi-QOL automation via its module adapter.
 */
export class Dnd5eSystemAdapter extends BaseSystemAdapter {
    /**
     * @param {BaseFoundryAdapter} [foundry=null]
     */
    constructor(foundry: BaseFoundryAdapter | null = null) {
        super("dnd5e", true, foundry);
    }

    /**
     * Semantically qualifies a chat message for D&D 5e.
     * @param {ChatMessage} message
     * @returns {string}
     */
    override qualifyMessage(message: any): string {
        log.debug(`Dnd5eSystemAdapter.qualifyMessage: message="${message?.id}"`, {
            rollType: message?.flags?.dnd5e?.roll?.type,
            messageType: message?.flags?.dnd5e?.messageType,
            midiMessageType: message?.flags?.["midi-qol"]?.messageType,
            midiType: message?.flags?.["midi-qol"]?.type,
            flavor: message?.flavor
        });

        const contentText = message?.content ?? "";

        // 1. Midi-QOL Resolved Target Saves Check
        // Classify as saving throw if Midi-QOL flagged this update as saves (type === 2)
        // or if actual resolved target saving throws exist in the saves display HTML.
        // Unresolved containers or attack/item templates containing empty saves displays must not trigger.
        if (midiQolAdapter.isActive()) {
            const midiFlags = message?.flags?.["midi-qol"];
            if (midiFlags?.type === 2) {
                return "saving throw";
            }
            if (contentText.includes("midi-qol-saves-display")) {
                const midiData = midiQolAdapter.extractRolls(message);
                if (midiData.rolls.some((r: any) => Boolean(r.tokenId))) {
                    return "saving throw";
                }
            }
        }

        // 2. Explicit Core & Midi Attack/Damage Flags
        const rollFlags = message?.flags?.dnd5e?.roll;
        if (rollFlags) {
            if (rollFlags.type === "attack") return "attack";
            if (rollFlags.type === "damage") return "damage";
        }

        const activity = message?.flags?.dnd5e?.activity;
        if (activity) {
            if (activity.type === "attack") return "attack";
            if (activity.type === "damage" || activity.type === "heal") return "damage";
            if (activity.actionType && ["mwak", "rwak", "msak", "rsak"].includes(activity.actionType)) return "attack";
        }

        const dndActionType = message?.flags?.dnd5e?.actionType;
        if (dndActionType && ["mwak", "rwak", "msak", "rsak"].includes(dndActionType)) {
            return "attack";
        }

        const primaryRoll = message?.rolls?.[0];
        const primaryRollOptions = primaryRoll?.options ?? {};
        const primaryRollType = primaryRollOptions.type;
        if (primaryRollType === "attack") return "attack";
        if (primaryRollType === "damage") return "damage";

        const primaryRollAction = primaryRollOptions.action;
        if (primaryRollAction === "attack") return "attack";
        if (primaryRollAction === "damage") return "damage";

        if (Boolean(primaryRoll?.isDamage)) return "damage";

        if (midiQolAdapter.isActive()) {
            const midiFlags = message?.flags?.["midi-qol"];
            const midiMessageType = midiFlags?.messageType;
            const midiType = midiFlags?.type;

            if (midiMessageType === "attack" || midiType === "attack" || midiType === 3) return "attack";
            if (midiMessageType === "damage" || midiType === "damage" || midiType === 4) return "damage";

            if (midiFlags?.actionType && ["mwak", "rwak", "msak", "rsak"].includes(midiFlags.actionType)) {
                return "attack";
            }
            if (Boolean(midiFlags?.hitTargets?.length) || Boolean(midiFlags?.isHit)) {
                return "attack";
            }
        }

        // 3. Core & Midi Item Usage Cards
        if (message?.flags?.dnd5e?.messageType === "usage") return "item description";
        if (midiQolAdapter.isActive()) {
            const midiFlags = message?.flags?.["midi-qol"];
            const midiMessageType = midiFlags?.messageType;
            const midiType = midiFlags?.type;
            if (midiMessageType === "item" || midiType === "item" || midiType === 0) return "item description";
        }

        // 4. Core & Midi Direct Saving Throw and Ability Check Flags
        if (rollFlags) {
            if (rollFlags.type === "save") return "saving throw";
            if (rollFlags.type === "ability" || rollFlags.type === "skill") return "ability check";
        }

        if (activity) {
            if (activity.type === "save") return "saving throw";
            if (activity.type === "check") return "ability check";
        }

        if (primaryRollType === "save") return "saving throw";
        if (primaryRollType && ["ability", "skill", "check", "tool"].includes(primaryRollType)) return "ability check";

        if (primaryRollAction === "save") return "saving throw";
        if (primaryRollAction && ["ability", "skill", "check", "tool"].includes(primaryRollAction)) return "ability check";

        if (midiQolAdapter.isActive()) {
            const midiFlags = message?.flags?.["midi-qol"];
            const midiMessageType = midiFlags?.messageType;
            const midiType = midiFlags?.type;
            if (midiMessageType === "save" || midiType === "save" || midiType === 2) return "saving throw";
            if (midiMessageType === "check" || midiType === "check") return "ability check";
        }

        // 5. Semantic Keyword & Flavor Analysis Fallback
        const flavorText = (message?.flavor ?? "").toLowerCase();
        const contentLower = contentText.toLowerCase();
        const combinedText = `${flavorText} ${contentLower}`;

        const isAttack = /\b(attack|strike|to\s+hit|attack\s+roll)\b/.test(combinedText);
        const isDamage = /\b(damage|damage\s+roll)\b/.test(combinedText);
        const hasKeywords = /\b(save|saving\s+throw|check|skill)\b/.test(combinedText);
        const hasRolls = Boolean((message?.rolls && message.rolls.length > 0) || message?.roll);

        if (hasRolls && (isAttack || isDamage)) {
            if (isAttack) return "attack";
            if (isDamage) return "damage";
        }

        if (hasRolls && !isAttack && !isDamage && hasKeywords) {
            if (/\b(save|saving\s+throw)\b/.test(combinedText)) return "saving throw";
            if (/\b(check|skill)\b/.test(combinedText)) return "ability check";
        }

        // 6. Default Fallback
        return super.qualifyMessage(message);
    }

    /**
     * Extracts raw roll results from a D&D 5e chat message.
     * @param {ChatMessage} message
     * @returns {Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>}
     */
    override extractRolls(message: any): any[] {
        const rolls: any[] = [];

        // Skip extraction entirely for messages classified as attack, damage, or item description
        const qualifiedType = this.qualifyMessage(message);
        if (qualifiedType === "attack" || qualifiedType === "damage" || qualifiedType === "item description") {
            log.debug(`Dnd5eSystemAdapter.extractRolls: message="${message?.id}" skipped (${qualifiedType})`);
            return [];
        }

        // 1. Core System Flag Checks (rolls from character sheets)
        const rollFlags = message?.flags?.dnd5e?.roll;
        if (rollFlags && (rollFlags.type === "save" || rollFlags.type === "ability" || rollFlags.type === "skill")) {
            rolls.push({
                source: "dnd5e-core-flags",
                rawAbility: rollFlags.ability ?? null,
                outcome: "indeterminant",
                tokenId: null
            });
        }

        // 2. Roll options on message.rolls (D20Roll instances in modern D&D 5e)
        if (rolls.length === 0 && message?.rolls && message.rolls.length > 0) {
            for (const roll of message.rolls) {
                if (Boolean(roll?.isDamage)) {
                    continue;
                }
                const rollOptions = roll?.options ?? {};
                const rollType = rollOptions.type;
                if (rollType && !["save", "ability", "skill", "check", "tool"].includes(rollType)) {
                    continue;
                }
                const rollAction = rollOptions.action;
                if (rollAction && !["save", "ability", "skill", "check", "tool"].includes(rollAction)) {
                    continue;
                }
                const rawAbility = typeof rollOptions.skill === "string"
                    ? rollOptions.skill
                    : (typeof rollOptions.ability === "string" ? rollOptions.ability : null);
                if (!rollType && !rollAction && !rawAbility) {
                    continue;
                }
                let outcome = "indeterminant";
                const target = typeof rollOptions.target === "number"
                    ? rollOptions.target
                    : (typeof rollOptions.dc === "number" ? rollOptions.dc : null);
                if (typeof roll?.total === "number" && typeof target === "number") {
                    outcome = roll.total >= target ? "success" : "failure";
                }
                rolls.push({
                    source: "dnd5e-roll-options",
                    rawAbility,
                    outcome,
                    tokenId: null
                });
            }
        }

        // 3. Process Active Module Adapters (e.g. Midi-QOL)
        let moduleOutcome = "indeterminant";
        if (midiQolAdapter.isActive()) {
            const midiData = midiQolAdapter.extractRolls(message);
            if (midiData.rolls.length > 0) {
                // If Midi-QOL extracted target-specific saving throw rolls, they are authoritative.
                // Replace any prior rolls (e.g. speaker fallback or damage roll placeholders) with the target rolls.
                rolls.length = 0;
                rolls.push(...midiData.rolls);
            }
            moduleOutcome = midiData.outcome;
        }

        // Distribute module-level outcome to core/fallback rolls if they are still indeterminant
        rolls.forEach((roll: any) => {
            if (roll.outcome === "indeterminant" && moduleOutcome !== "indeterminant") {
                roll.outcome = moduleOutcome;
            }
        });

        // 4. Fallback if semantic check/save was qualified from flavor text
        // Never fall back to ambient speaker (tokenId: null) on item usage cards, Midi-QOL workflow cards,
        // or saves display cards where the speaker is the caster/author, not a saving throw roller.
        const midiFlags = message?.flags?.["midi-qol"];
        const isDirectMidiSaveOrCheck = midiFlags?.messageType === "save" ||
            midiFlags?.messageType === "check" ||
            midiFlags?.type === "save" ||
            midiFlags?.type === "check";

        const isItemOrWorkflowCard = Boolean(
            message?.flags?.dnd5e?.messageType === "usage" ||
            message?.flags?.dnd5e?.item ||
            message?.flags?.dnd5e?.activity ||
            (Boolean(midiFlags) && !isDirectMidiSaveOrCheck) ||
            message?.content?.includes("midi-qol-saves-display")
        );

        if (!isItemOrWorkflowCard && rolls.length === 0 && Boolean((message?.rolls && message.rolls.length > 0) || message?.roll)) {
            if (qualifiedType === "saving throw" || qualifiedType === "ability check") {
                rolls.push({
                    source: "dnd5e-flavor-fallback",
                    rawAbility: null,
                    outcome: "indeterminant",
                    tokenId: null
                });
            }
        }

        log.debug(`Dnd5eSystemAdapter.extractRolls: message="${message?.id}"`, {
            coreRollFlags: rollFlags,
            midiActive: midiQolAdapter.isActive(),
            moduleOutcome,
            finalRolls: rolls
        });

        return rolls;
    }

    /**
     * Normalizes a D&D 5e ability or skill code into a standard ability name.
     * @param {string|null} rawAbility
     * @param {string} [combinedText=""]
     * @returns {string|null}
     */
    override normalizeAbility(rawAbility: any, combinedText: string = ""): string | null {
        const dnd5eMap = {
            ath: "strength", athletics: "strength",
            acr: "dexterity", acrobatics: "dexterity", ste: "dexterity", stealth: "dexterity", sle: "dexterity", "sleight of hand": "dexterity",
            arc: "intelligence", arcana: "intelligence", his: "intelligence", history: "intelligence", inv: "intelligence", investigation: "intelligence", nat: "intelligence", nature: "intelligence", rel: "intelligence", religion: "intelligence",
            ani: "wisdom", "animal handling": "wisdom", ins: "wisdom", insight: "wisdom", med: "wisdom", medicine: "wisdom", per: "wisdom", perception: "wisdom", prc: "wisdom", sur: "wisdom", survival: "wisdom",
            dec: "charisma", deception: "charisma", itm: "charisma", intimidation: "charisma", prf: "charisma", performance: "charisma", pers: "charisma", persuasion: "charisma"
        };
        return super.normalizeAbility(rawAbility, combinedText, dnd5eMap);
    }

    /**
     * Retrieve the spell level for an item or animation handler in D&D 5e.
     * @param {Object} config Configuration containing aaHandler or item
     * @returns {number|undefined}
     */
    override getSpellLevel(config: any = {}): number | undefined {
        return config?.aaHandler?.systemData?.spellLevel ?? config?.item?.system?.level ?? undefined;
    }

    /**
     * Retrieve normalized creature type string for a target actor in D&D 5e.
     * @param {Actor5e|Actor} actor Concrete Actor document
     * @returns {string|null}
     */
    override getCreatureType(actor: Actor5e | Actor): string | null {
        if (!actor) return null;
        const act = actor as Actor5e;
        const detailType = act.system?.details?.type;
        const rawType = typeof detailType === 'object' && detailType !== null ? detailType.value : detailType;
        return typeof rawType === 'string' ? rawType.toLowerCase() : null;
    }
}
