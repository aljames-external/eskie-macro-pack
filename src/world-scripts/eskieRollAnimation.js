/**
 * World Script: Eskie Roll Animations
 * Plays a custom d20 roll animation sequence above tokens during saving throws and ability checks.
 * Supports D&D 5e (with or without Midi-QOL), Pathfinder 2e (PF2e), and generic d20 systems.
 */

import { Dnd5eAdapter } from "./adapters/system/dnd5e.js";
import { Pf2eAdapter } from "./adapters/system/pf2e.js";
import { GenericAdapter } from "./adapters/system/generic.js";

// ============================================================================
// SEQUENCER ANIMATION TRIGGER
// ============================================================================

async function playEskieRollAnimation(token, config = {}) {
    if (!token) return;

    const rollType = config.rollType || "default";
    const outcome = config.outcome || "indeterminant";

    let color = "white";
    if (outcome === "success") color = "green";
    if (outcome === "failure") color = "red";

    const rollPath = `eskie.ui.ability_check.d20.01.roll.${rollType}.${color}`;
    const smokePath = `eskie.smoke.07.white`;
    const dieSize = 100; 

    const verticalOffset = -(token.h * 0.80);
    const locationOptions = { offset: { x: 0, y: verticalOffset } };

    console.log(`[Eskie Animation] Playing animation: rollPath="${rollPath}", token="${token.name}", outcome="${outcome}"`);

    new Sequence()
        .effect()
            .file(rollPath)
            .atLocation(token, locationOptions)
            .anchor({ x: 0.5, y: 0.5 })
            .size(dieSize) 
            .duration(1500)
            .belowTokens(false)
            .elevation(10)
        .effect()
            .file(smokePath)
            .atLocation(token, locationOptions)
            .delay(0)       
            .duration(1000) 
            .size(dieSize * 1.5) 
            .belowTokens(false)
            .elevation(11)  
        .play({ remote: true }); 
}

// ============================================================================
// ESKIE ROLL TRACKER CLASS (ORCHESTRATOR)
// ============================================================================

export class EskieRollTracker {
    constructor() {
        this.hookIds = [];
        this.activeAdapter = null;

        // Instantiate polymorphic system adapters
        const adapters = {
            "dnd5e": new Dnd5eAdapter(),
            "pf2e": new Pf2eAdapter(),
            "generic": new GenericAdapter()
        };

        const systemId = game.system.id;
        this.activeAdapter = adapters[systemId] || adapters["generic"];
    }

    /**
     * Dynamically registers hooks to turn the feature ON in real-time.
     */
    enable() {
        if (this.hookIds.length > 0) return; // Already enabled

        console.log(`EMP | Enabling Eskie Roll Animations. Active System: "${this.activeAdapter.id}"`);

        const createId = Hooks.on("createChatMessage", (message, options, userId) => {
            this.processMessageAndPlay(message, userId);
        });

        const updateId = Hooks.on("updateChatMessage", (message, updateData, options, userId) => {
            if (!updateData.content) return;
            this.processMessageAndPlay(message, userId);
        });

        // Store hook IDs to allow dynamic deregistration
        this.hookIds.push({ name: "createChatMessage", id: createId });
        this.hookIds.push({ name: "updateChatMessage", id: updateId });
    }

    /**
     * Dynamically unregisters hooks to turn the feature OFF instantly without a reload.
     */
    disable() {
        if (this.hookIds.length === 0) return; // Already disabled

        console.log("EMP | Disabling Eskie Roll Animations");

        for (const hook of this.hookIds) {
            Hooks.off(hook.name, hook.id);
        }
        this.hookIds = [];
    }

    /**
     * Parses raw chat text, flavor, and flags using the system adapter
     * to determine if this card contains actionable rolls.
     */
    getRollDetails(message) {
        // Extract raw rolls from the system adapter
        const rolls = this.activeAdapter.extractRolls(message);
        if (rolls.length === 0) return [];

        const flavorText = message.flavor?.toLowerCase() || "";
        const contentText = message.content || "";
        const contentLower = contentText.toLowerCase();
        const combinedText = `${flavorText} ${contentLower}`;

        // Normalize outcomes and abilities
        rolls.forEach(roll => {
            // Normalize Outcome
            if (roll.outcome === "indeterminant") {
                const successMatch = /success|pass/.exec(combinedText);
                const failureMatch = /failure|fail/.exec(combinedText);
                if (successMatch) {
                    roll.outcome = "success";
                } else if (failureMatch) {
                    roll.outcome = "failure";
                }
            }

            // Normalize Ability using the adapter
            roll.ability = this.activeAdapter.normalizeAbility(roll.rawAbility, combinedText);
        });

        return rolls;
    }

    /**
     * Pinpoints the exact rolling token document.
     */
    getSpeakerToken(message, extractedTokenId) {
        if (extractedTokenId) {
            const htmlTarget = canvas.tokens.get(extractedTokenId);
            if (htmlTarget) return htmlTarget;
        }
        return canvas.tokens.get(message.speaker.token) 
               || canvas.tokens.controlled[0] 
               || game.user.character?.getActiveTokens()[0];
    }

    /**
     * Evaluates the message and triggers animations for unplayed rolls.
     */
    async processMessageAndPlay(message, userId) {
        // Only run validation calculations once on the user machine modifying the doc
        if (game.user.id !== userId) return;

        const rolls = this.getRollDetails(message);
        if (rolls.length === 0) return;

        // Retrieve the list of token IDs that have already animated for this message
        const firedTokens = message.flags?.world?.eskieAnimatedTokens || [];
        
        // Checking newFiredTokens dynamically instead of firedTokens ensures that if
        // multiple roll records for the same token are extracted in a single update,
        // we deduplicate in real-time and only play the animation ONCE.
        const newFiredTokens = [...firedTokens];
        let updatedFlags = false;

        for (const roll of rolls) {
            const token = this.getSpeakerToken(message, roll.tokenId);
            if (!token) continue;

            // Check if we've already animated this specific token (in a previous update OR earlier in this loop)
            if (newFiredTokens.includes(token.id)) continue;

            // Trigger the sequence
            playEskieRollAnimation(token, {
                rollType: roll.ability || "default",
                outcome: roll.outcome
            });

            newFiredTokens.push(token.id);
            updatedFlags = true;
        }

        // Update the message flags if we played any new animations
        if (updatedFlags) {
            await message.setFlag("world", "eskieAnimatedTokens", newFiredTokens);
        }
    }
}

// Instantiate a single global tracker instance
export const eskieRollTracker = new EskieRollTracker();
