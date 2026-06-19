/**
 * Midi-QOL Module Adapter
 * Handles Midi-QOL specific flag checks and multi-target saves display HTML parsing.
 */
export const midiQolAdapter = {
    isActive() {
        return game.modules.get("midi-qol")?.active;
    },
    extractRolls(message) {
        const rolls = [];
        const contentText = message.content || "";

        // 1. Check for single target outcome flags
        let outcome = "indeterminant";
        if (message.flags?.["midi-qol"]?.isSuccess) outcome = "success";
        else if (message.flags?.["midi-qol"]?.isFailure) outcome = "failure";

        // 2. Parse multi-target saves display HTML using modern native DOMParser
        if (contentText.includes("midi-qol")) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(contentText, "text/html");
            const saveDisplay = doc.querySelector(".midi-qol-saves-display");
            
            if (saveDisplay) {
                const targetLis = saveDisplay.querySelectorAll("li.midi-qol-target-select");
                
                // Parse the short ability code from the save display block text
                let saveAbility = null;
                const textContext = saveDisplay.textContent.toLowerCase();
                const abilityRegex = /(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha|acr|ath|per|ste)/;
                const match = textContext.match(abilityRegex);
                if (match) saveAbility = match[1];

                targetLis.forEach(el => {
                    const tokenId = el.dataset.id;
                    let targetOutcome = "indeterminant";
                    let isResolved = false;

                    const hasCheck = el.querySelector(".fa-check") !== null;
                    const hasTimes = el.querySelector(".fa-times") !== null;

                    if (el.classList.contains("success") || hasCheck) {
                        targetOutcome = "success";
                        isResolved = true;
                    } else if (el.classList.contains("failure") || hasTimes) {
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

        // If flag outcomes exist but no HTML saves (e.g., single-target roll card updates)
        if (rolls.length === 0 && outcome !== "indeterminant") {
            rolls.push({
                source: "midi-qol-flags",
                rawAbility: null,
                outcome: outcome,
                tokenId: null
            });
        }

        return { rolls, outcome };
    }
};
