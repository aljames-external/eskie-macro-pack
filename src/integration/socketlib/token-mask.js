import { MODULE_ID } from "../../lib/constants.js";
import { debug } from "../../lib/debug.js";
import { tokenMaskEffect } from "../../animation/effects/token-mask/token-mask.js";

/**
 * Socketlib handler to execute local sequence rendering on a client.
 */
async function playTokenMaskLocal(tokenId, tileIds, initiatorUserId, config = {}) {
    debug.log(`playTokenMaskLocal | Received socket call:`, {
        tokenId,
        tileIds,
        initiatorUserId,
        currentUser: game.user.name,
        animationId: config.animationId
    });

    const token = canvas.tokens.get(tokenId);
    if (!token) {
        console.warn(`Eskie Macros | tokenMaskEffect | playTokenMaskLocal | Token ${tokenId} not found on this client!`);
        // Report completion immediately to not block the initiator
        const eskieModule = game.modules.get('eskie-macros');
        if (eskieModule?.socketlib) {
            await eskieModule.socketlib.executeForUsers('tokenMaskClientDone', [initiatorUserId], tokenId, game.user.id, config.animationId);
        }
        return;
    }

    try {
        // Play the animation locally
        await tokenMaskEffect.play(token, {
            ...config,
            tileIds,
            localOnly: true,
            initiatorUserId
        });
    } catch (err) {
        console.error("Eskie Macros | tokenMaskEffect | playTokenMaskLocal | Error playing local animation:", err);
        // Report completion in case of failure
        const eskieModule = game.modules.get('eskie-macros');
        if (eskieModule?.socketlib) {
            await eskieModule.socketlib.executeForUsers('tokenMaskClientDone', [initiatorUserId], token.id, game.user.id, config.animationId);
        }
    }
}

/**
 * Socketlib handler to report local animation completion back to the initiator.
 */
async function tokenMaskClientDone(tokenId, userId, animationId) {
    const tracker = globalThis.eskie?.tokenMaskTracker?.get(animationId);
    if (tracker) {
        tracker.received.add(userId);
        debug.log(`tokenMaskClientDone | Received completion signal from user ${userId} for session ${animationId}. Progress: ${tracker.received.size}/${tracker.expected.size}`);
        
        // Check if all expected users have completed
        const allCompleted = [...tracker.expected].every(id => tracker.received.has(id));
        if (allCompleted) {
            debug.log(`tokenMaskClientDone | All clients reported completion for session ${animationId}! Triggering database cleanup...`);
            
            // Clean up using the GM-level cleanup
            await cleanUpTokenMask(tokenId, animationId, tracker.tileIds, tracker.deleteToken);
            
            // Resolve the initiator's promise
            tracker.resolve();
        }
    }
}

/**
 * Clean up the session tiles and token flags as GM.
 */
async function cleanUpTokenMask(tokenId, animationId, tileIds, deleteToken) {
    if (!game.user.isGM) {
        const eskieModule = game.modules.get('eskie-macros');
        if (eskieModule?.socketlib) {
            return eskieModule.socketlib.executeAsGM("cleanUpTokenMask", tokenId, animationId, tileIds, deleteToken);
        }
    }
    
    debug.log(`cleanUpTokenMask | Cleaning up database for token ${tokenId} (Session: ${animationId}). Delete token: ${deleteToken}`);
    
    if (deleteToken) {
        const token = canvas.tokens.get(tokenId);
        if (token) {
            await token.document.delete();
        }
    } else {
        // Delete the tiles
        if (tileIds && tileIds.length > 0) {
            const { tile } = await import('./tile.js');
            await Promise.all(tileIds.map(tileId => tile.destroy(tileId)));
        }
        // Remove only this specific animationId session's flag
        const token = canvas.tokens.get(tokenId);
        if (token) {
            await token.document.update({
                [`flags.eskie-macros.token-masks.-=${animationId}`]: null
            });
        }
    }
}

export const tokenMaskSockets = {
    playTokenMaskLocal,
    tokenMaskClientDone,
    cleanUpTokenMask,
};
