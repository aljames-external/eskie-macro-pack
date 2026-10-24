import { BaseModuleAdapter } from '../base-module-adapter.js';
import { log } from '../../../lib/logger.js';

/**
 * Midi-QOL Module Adapter
 * Handles Midi-QOL automation workflow card detection, target saving throw outcome parsing, and roll extraction.
 */
export class MidiQolModuleAdapter extends BaseModuleAdapter {
    constructor() {
        super("midi-qol");
    }

    /**
     * Extracts raw rolls or outcomes from a chat message managed by Midi-QOL.
     * @param {ChatMessage} message The chat message document to inspect
     * @returns {{ rolls: Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>, outcome: string }}
     */
    override extractRolls(message: any): { rolls: Array<{ source: string, rawAbility: string | null, outcome: string, tokenId: string | null }>, outcome: string } {
        const rolls: Array<{ source: string, rawAbility: string | null, outcome: string, tokenId: string | null }> = [];
        const contentText = message?.content ?? "";
        const midiFlags = message?.flags?.["midi-qol"];

        log.debug(`Midi-QOL Extract Rolls Check:`, {
            messageId: message?.id,
            messageType: midiFlags?.messageType,
            type: midiFlags?.type,
            isSuccess: midiFlags?.isSuccess,
            isFailure: midiFlags?.isFailure,
            flavor: message?.flavor
        });

        // Ignore attack, damage, and item usage cards (unless they dynamically contain a target saves display)
        const midiMessageType = midiFlags?.messageType;
        const midiType = typeof midiFlags?.type === "string" ? midiFlags.type : null;
        const actionType = midiFlags?.actionType;
        const isAttackAction = ["mwak", "rwak", "msak", "rsak"].includes(actionType);
        const hasSavesDisplay = contentText.includes("midi-qol-saves-display");
        const hasAttackType = ["attack", "damage", "item"].includes(midiMessageType) || (midiType !== null && ["attack", "damage", "item"].includes(midiType));
        const isAttackOrDamage = isAttackAction || hasAttackType || Boolean(midiFlags?.hitTargets?.length) || Boolean(midiFlags?.isHit);

        if (isAttackOrDamage && !hasSavesDisplay) {
            log.debug(`Midi-QOL: Ignoring attack/damage/item card for message="${message?.id}"`);
            return { rolls: [], outcome: "indeterminant" };
        }

        // 1. Check for single target outcome flags
        let outcome = "indeterminant";
        if (midiFlags?.isSuccess) outcome = "success";
        else if (midiFlags?.isFailure) outcome = "failure";

        // 2. Parse multi-target saves display HTML using modern native DOMParser
        if (contentText.includes("midi-qol") && typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(contentText, "text/html");
            const saveDisplay = doc.querySelector(".midi-qol-saves-display");

            if (saveDisplay) {
                const targetLis = saveDisplay.querySelectorAll("li.midi-qol-target-select");

                // Parse the short ability code from the save display block text
                let saveAbility: string | null = null;
                const textContext = (saveDisplay.textContent ?? "").toLowerCase();
                const abilityRegex = /\b(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha|acr|ath|per|ste)\b/i;
                const match = textContext.match(abilityRegex);
                if (match) saveAbility = match[1]?.toLowerCase() ?? null;

                targetLis.forEach((el: any) => {
                    const tokenId = el.dataset?.id ?? el.getAttribute?.('data-id');
                    let targetOutcome = "indeterminant";
                    let isResolved = false;

                    const hasCheck = el.querySelector(".fa-check") !== null;
                    const hasFail = el.querySelector(".fa-times") !== null || el.querySelector(".fa-xmark") !== null;

                    if (el.classList.contains("success") || hasCheck) {
                        targetOutcome = "success";
                        isResolved = true;
                    } else if (el.classList.contains("failure") || hasFail) {
                        targetOutcome = "failure";
                        isResolved = true;
                    }

                    if (isResolved && tokenId) {
                        rolls.push({
                            source: "midi-qol-html",
                            rawAbility: saveAbility,
                            outcome: targetOutcome,
                            tokenId: tokenId
                        });
                    }
                });
            }
        }

        // If flag outcomes exist but no HTML saves (e.g. single-target save card updates)
        // Strictly ensure we only push if the card is explicitly a saving throw or ability check
        const isSaveOrCheck = midiMessageType === "save" || midiMessageType === "check" || midiType === "save" || midiType === "check" || Boolean(midiFlags?.save);
        if (rolls.length === 0 && outcome !== "indeterminant" && isSaveOrCheck) {
            rolls.push({
                source: "midi-qol-flags",
                rawAbility: null,
                outcome: outcome,
                tokenId: null
            });
        }

        return { rolls, outcome };
    }
}

export const midiQolAdapter = new MidiQolModuleAdapter();
