/**
 * World Script: Eskie Roll Animations
 * Plays a custom d20 roll animation sequence above tokens during saving throws and ability checks.
 * Supports D&D 5e (with or without Midi-QOL), Pathfinder 2e (PF2e), and generic d20 systems.
 */

import { adapter } from "../adapters/index.js";
import { closest } from "../lib/filemanager.js";
import { log } from '../lib/logger.js';

// ============================================================================
// SEQUENCER ANIMATION TRIGGER
// ============================================================================

export interface RollAnimationConfig {
    rollType?: string;
    outcome?: string;
    users?: string[];
    [key: string]: unknown;
}

async function playRollAnimation(token: Token, config: RollAnimationConfig = {}) {
    if (!token) {
        log.debug("playRollAnimation: aborted, no token provided", config);
        return;
    }

    const rollType = config.rollType ?? "default";
    const outcome = config.outcome ?? "indeterminant";
    const users = config.users;

    let color = "white";
    if (outcome === "success") color = "green";
    if (outcome === "failure") color = "red";

    const rollKey = `eskie.ui.ability_check.d20.01.roll.${rollType}.${color}`;
    const smokeKey = `eskie.smoke.07.white`;
    const rollPath = closest(rollKey);
    const smokePath = closest(smokeKey);
    const dieSize = 100; 

    const verticalOffset = -(token.h * 0.80);
    const locationOptions = { offset: { x: 0, y: verticalOffset } };

    log.debug(`playRollAnimation: preparing animation for token="${token.name}"`, {
        tokenId: token.id,
        rollType,
        outcome,
        color,
        rollKey,
        rollPath,
        smokeKey,
        smokePath,
        verticalOffset,
        users
    });

    if (!rollPath) {
        log.warn(`playRollAnimation: roll asset path could not be resolved for key "${rollKey}"`);
        return;
    }

    try {
        const sequence = new Sequence();

        const rollEffect = sequence.effect()
            .file(rollPath)
            .atLocation(token, locationOptions)
            .anchor({ x: 0.5, y: 0.5 })
            .size(dieSize) 
            .duration(1500)
            .belowTokens(false)
            .elevation(10);

        if (users && users.length > 0) {
            log.debug(`playRollAnimation: restricting playback to ${users.length} users:`, users);
            rollEffect.forUsers(users);
        }

        if (smokePath) {
            const smokeEffect = sequence.effect()
                .file(smokePath)
                .atLocation(token, locationOptions)
                .delay(0)       
                .duration(1000) 
                .size(dieSize * 1.5) 
                .belowTokens(false)
                .elevation(11);

            if (users && users.length > 0) {
                smokeEffect.forUsers(users);
            }
        }

        log.debug(`playRollAnimation: executing sequence.play() for token "${token.name}"`);
        const playPromise = sequence.play();
        log.debug(`playRollAnimation: sequence.play dispatched for token "${token.name}"`);
        return playPromise;
    } catch (err) {
        log.error(`playRollAnimation: failed to play animation on token "${token.name}":`, err);
    }
}

// ============================================================================
// ESKIE ROLL TRACKER CLASS (ORCHESTRATOR)
// ============================================================================

export class RollTracker {
    hookIds: Array<{ name: string; id: number }>;
    localAnimatedTokens: Map<string, Set<string>>;

    constructor() {
        this.hookIds = [];
        this.localAnimatedTokens = new Map();
    }

    get activeAdapter() {
        return adapter.system;
    }

    /**
     * Dynamically registers hooks to turn the feature ON in real-time.
     */
    enable() {
        if (this.hookIds.length > 0) return; // Already enabled

        log.debug(`Enabling Eskie Roll Animations. Active System: "${this.activeAdapter.id}"`);

        const createId = Hooks.on("createChatMessage" as any, (message: ChatMessage, _options: unknown, userId: string) => {
            log.debug(`RollTracker: createChatMessage hook fired`, {
                messageId: message?.id,
                userId,
                currentUserId: game.user?.id,
                isLocalUser: game.user?.id === userId
            });
            this.processMessageAndPlay(message, userId);
        });

        const updateId = Hooks.on("updateChatMessage" as any, (message: ChatMessage, updateData: { content?: string; [key: string]: unknown }, _options: unknown, userId: string) => {
            log.debug(`RollTracker: updateChatMessage hook fired`, {
                messageId: message?.id,
                updateDataKeys: Object.keys(updateData ?? {}),
                hasContent: Boolean(updateData?.content),
                userId,
                currentUserId: game.user?.id,
                isLocalUser: game.user?.id === userId
            });
            if (!updateData.content) {
                log.debug(`RollTracker: updateChatMessage ignored (no content update) for message="${message?.id}"`);
                return;
            }
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

        log.debug("Disabling Eskie Roll Animations");

        for (const hook of this.hookIds) {
            Hooks.off(hook.name as any, hook.id);
        }
        this.hookIds = [];
    }

    /**
     * Parses raw chat text, flavor, and flags using the system adapter
     * to determine if this card contains actionable rolls.
     */
    getRollDetails(message: ChatMessage): any[] {
        // Extract raw rolls from the system adapter
        const rolls: any[] = this.activeAdapter.extractRolls(message);
        log.debug(`RollTracker.getRollDetails: raw rolls from adapter for message="${message?.id}":`, rolls);
        if (rolls.length === 0) return [];

        const flavorText = (message?.flavor ?? "").toLowerCase();
        const contentText = message?.content ?? "";
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

        log.debug(`RollTracker.getRollDetails: normalized rolls for message="${message?.id}":`, rolls);
        return rolls;
    }

    /**
     * Pinpoints the exact rolling token document via the unified adapter.
     */
    getSpeakerToken(message: ChatMessage, extractedTokenId: string | null = null): Token | null {
        const token = adapter.getSpeakerToken(message, extractedTokenId);
        log.debug(`RollTracker.getSpeakerToken: message="${message?.id}", extractedTokenId="${extractedTokenId}", resolvedToken="${token?.name ?? null}" (id: "${token?.id ?? null}")`);
        return token;
    }

    /**
     * Determines which users have visibility permission to see this roll.
     * @param {ChatMessage} message Chat message triggering the roll
     * @returns {string[]} Array of User IDs permitted to see the roll
     */
    getMessageVisibilityUsers(message: ChatMessage): string[] {
        const users = adapter.getMessageVisibilityUsers(message);
        log.debug(`RollTracker.getMessageVisibilityUsers: resolved users for message="${message?.id}":`, {
            whisper: message?.whisper,
            author: (message?.author as any)?.id ?? message?.author,
            currentUserId: game.user?.id,
            currentUserPermitted: users.includes(game.user?.id ?? ""),
            permittedUsers: users
        });
        return users;
    }

    /**
     * Semantically classifies a chat message to determine its purpose.
     * @returns {string} The message classification.
     */
    qualifyMessage(message: ChatMessage): string {
        const messageType = this.activeAdapter.qualifyMessage(message);
        log.debug(`RollTracker.qualifyMessage: message="${message?.id}" classified as "${messageType}"`);
        return messageType;
    }

    /**
     * Evaluates the message and triggers animations for unplayed rolls.
     */
    async processMessageAndPlay(message: ChatMessage, userId: string) {
        log.debug(`RollTracker.processMessageAndPlay: evaluating message="${message?.id}"`, {
            userId,
            currentUserId: game.user?.id,
            isLocalUser: game.user?.id === userId
        });

        // Only run validation calculations once on the user machine modifying the doc
        if (game.user?.id !== userId) {
            log.debug(`RollTracker.processMessageAndPlay: skipped message="${message?.id}" (current client "${game.user?.id}" is not triggering client "${userId}")`);
            return;
        }

        // Centralized Qualification Gate: Only proceed for saving throws and ability checks
        const messageType = this.qualifyMessage(message);
        if (!["saving throw", "ability check"].includes(messageType)) {
            log.debug(`RollTracker.processMessageAndPlay: message="${message?.id}" rejected (type "${messageType}" is not saving throw or ability check)`);
            return;
        }

        const rolls = this.getRollDetails(message);
        if (rolls.length === 0) {
            log.debug(`RollTracker.processMessageAndPlay: message="${message?.id}" rejected (no rolls found)`);
            return;
        }

        const messageId = message.id;
        if (!messageId) {
            log.debug(`RollTracker.processMessageAndPlay: message has no id, aborted`);
            return;
        }
        if (!this.localAnimatedTokens.has(messageId)) {
            // Prune map if it grows too large to prevent memory leaks (keep cache under 100 messages)
            if (this.localAnimatedTokens.size > 100) {
                const oldestKey = this.localAnimatedTokens.keys().next().value;
                if (oldestKey) this.localAnimatedTokens.delete(oldestKey);
            }
            this.localAnimatedTokens.set(messageId, new Set());
        }
        const localFired = this.localAnimatedTokens.get(messageId);

        // Retrieve the list of token IDs that have already animated for this message
        const firedTokens = message?.flags?.world?.rollAnimatedTokens ?? [];
        log.debug(`RollTracker.processMessageAndPlay: message="${messageId}" dedup status`, {
            firedTokens,
            localFired: localFired ? Array.from(localFired) : []
        });
        
        // Checking newFiredTokens and localFired dynamically prevents race conditions
        // during rapid updates where multiple hooks fire before database flag write completes.
        const newFiredTokens = [...firedTokens];
        let updatedFlags = false;

        // If the card is an item/spell usage card or contains target-specific rolls (e.g. multi-target saves display),
        // only animate those explicit targets; filter out any ambient speaker rolls (tokenId: null)
        // so the caster or attacker never animates during spells prompting target saving throws or attack cards.
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

        const hasTargetSpecificRolls = rolls.some(r => Boolean(r.tokenId));
        const actionableRolls = (isItemOrWorkflowCard || hasTargetSpecificRolls)
            ? rolls.filter(r => Boolean(r.tokenId))
            : rolls;
        const visibleUsers = this.getMessageVisibilityUsers(message);

        for (const roll of actionableRolls) {
            const token = this.getSpeakerToken(message, roll.tokenId);
            if (!token || !token.id) {
                log.debug(`RollTracker.processMessageAndPlay: roll skipped (no token found on canvas)`, {
                    tokenId: roll.tokenId,
                    speaker: message?.speaker
                });
                continue;
            }

            // Check if we've already animated this specific token
            if (newFiredTokens.includes(token.id) || localFired?.has(token.id)) {
                log.debug(`RollTracker.processMessageAndPlay: roll skipped (token "${token.name}" [${token.id}] already animated for message "${messageId}")`);
                continue;
            }

            // Trigger the sequence
            log.debug(`RollTracker.processMessageAndPlay: triggering animation for token "${token.name}"`, {
                ability: roll.ability ?? "default",
                outcome: roll.outcome,
                users: visibleUsers
            });

            playRollAnimation(token, {
                rollType: roll.ability ?? "default",
                outcome: roll.outcome,
                users: visibleUsers
            });

            newFiredTokens.push(token.id);
            localFired?.add(token.id);
            updatedFlags = true;
        }

        // Update the message flags if we played any new animations
        if (updatedFlags) {
            log.debug(`RollTracker.processMessageAndPlay: updating flags.world.rollAnimatedTokens for message="${messageId}":`, newFiredTokens);
            await message.setFlag("world", "rollAnimatedTokens", newFiredTokens);
        }
    }
}

// Instantiate a single global tracker instance
export const rollTracker = new RollTracker();
