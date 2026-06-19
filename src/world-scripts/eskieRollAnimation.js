/**
 * World Script: Eskie Roll Animations
 * Plays a custom d20 roll animation sequence above tokens during saving throws and ability checks.
 * Supports D&D 5e (with or without Midi-QOL), Pathfinder 2e (PF2e), and generic d20 systems.
 */

import { Dnd5eAdapter } from "./adapters/system/dnd5e.js";
import { Pf2eAdapter } from "./adapters/system/pf2e.js";
import { GenericAdapter } from "./adapters/system/generic.js";
import { closest } from "../lib/filemanager.js";
import { debug } from "../lib/debug.js";

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

    const rollPath = closest(`eskie.ui.ability_check.d20.01.roll.${rollType}.${color}`);
    const smokePath = closest(`eskie.smoke.07.white`);
    const dieSize = 100; 

    const verticalOffset = -(token.h * 0.80);
    const locationOptions = { offset: { x: 0, y: verticalOffset } };

    debug.log(`Playing animation: rollPath="${rollPath}", token="${token.name}", outcome="${outcome}"`);

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
        this._activeAdapter = null;
        this.localAnimatedTokens = new Map();
    }

    get activeAdapter() {
        if (!this._activeAdapter) {
            // Instantiate polymorphic system adapter dynamically based on active system
            const systemId = game.system.id;
            if (systemId === "dnd5e") {
                this._activeAdapter = new Dnd5eAdapter();
            } else if (systemId === "pf2e") {
                this._activeAdapter = new Pf2eAdapter();
            } else {
                this._activeAdapter = new GenericAdapter();
            }
        }
        return this._activeAdapter;
    }

    /**
     * Dynamically registers hooks to turn the feature ON in real-time.
     */
    enable() {
        if (this.hookIds.length > 0) return; // Already enabled

        debug.log(`Enabling Eskie Roll Animations. Active System: "${this.activeAdapter.id}"`);

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

        debug.log("Disabling Eskie Roll Animations");

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
        if (!canvas.ready || !canvas.tokens) return null;
        if (extractedTokenId) {
            const htmlTarget = canvas.tokens.get(extractedTokenId);
            if (htmlTarget) return htmlTarget;
        }
        return canvas.tokens.get(message.speaker.token) 
               || canvas.tokens.controlled[0] 
               || game.user.character?.getActiveTokens()[0];
    }

    /**
     * Semantically classifies a chat message to determine its purpose.
     * @returns {string} The message classification.
     */
    qualifyMessage(message) {
        return this.activeAdapter.qualifyMessage(message);
    }

    /**
     * Evaluates the message and triggers animations for unplayed rolls.
     */
    async processMessageAndPlay(message, userId) {
        // Only run validation calculations once on the user machine modifying the doc
        if (game.user.id !== userId) return;

        // Centralized Qualification Gate: Only proceed for saving throws and ability checks
        const messageType = this.qualifyMessage(message);
        if (!["saving throw", "ability check"].includes(messageType)) return;

        const rolls = this.getRollDetails(message);
        if (rolls.length === 0) return;

        const messageId = message.id;
        if (!this.localAnimatedTokens.has(messageId)) {
            // Prune map if it grows too large to prevent memory leaks (keep cache under 100 messages)
            if (this.localAnimatedTokens.size > 100) {
                const oldestKey = this.localAnimatedTokens.keys().next().value;
                this.localAnimatedTokens.delete(oldestKey);
            }
            this.localAnimatedTokens.set(messageId, new Set());
        }
        const localFired = this.localAnimatedTokens.get(messageId);

        // Retrieve the list of token IDs that have already animated for this message
        const firedTokens = message.flags?.world?.eskieAnimatedTokens || [];
        
        // Checking newFiredTokens and localFired dynamically prevents race conditions
        // during rapid updates where multiple hooks fire before database flag write completes.
        const newFiredTokens = [...firedTokens];
        let updatedFlags = false;

        for (const roll of rolls) {
            const token = this.getSpeakerToken(message, roll.tokenId);
            if (!token) continue;

            // Check if we've already animated this specific token
            if (newFiredTokens.includes(token.id) || localFired.has(token.id)) continue;

            // Trigger the sequence
            playEskieRollAnimation(token, {
                rollType: roll.ability || "default",
                outcome: roll.outcome
            });

            newFiredTokens.push(token.id);
            localFired.add(token.id);
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
