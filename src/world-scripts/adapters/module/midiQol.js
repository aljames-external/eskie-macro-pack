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

        // 2. Parse multi-target saves display HTML using Foundry's built-in jQuery
        if (contentText.includes("midi-qol")) {
            const $content = $(contentText);
            const $saveDisplay = $content.find(".midi-qol-saves-display");
            
            if ($saveDisplay.length) {
                const $targetLis = $saveDisplay.find("li.midi-qol-target-select");
                
                // Parse the short ability code from the save display block text
                let saveAbility = null;
                const textContext = $saveDisplay.text().toLowerCase();
                const abilityRegex = /(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha|acr|ath|per|ste)/;
                const match = textContext.match(abilityRegex);
                if (match) saveAbility = match[1];

                $targetLis.each((index, el) => {
                    const $li = $(el);
                    const tokenId = el.dataset.id;
                    let targetOutcome = "indeterminant";
                    let isResolved = false;

                    if ($li.hasClass("success") || $li.find(".fa-check").length > 0) {
                        targetOutcome = "success";
                        isResolved = true;
                    } else if ($li.hasClass("failure") || $li.find(".fa-times").length > 0) {
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
