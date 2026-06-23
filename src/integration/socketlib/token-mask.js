import { MODULE_ID } from "../../lib/constants.js";
import { log } from '../../lib/logger.js';
import { socket, socketlib } from "../socketlib.js";
import { object as objectAttachment } from "../../lib/object.js";
import { tokenMaskEffect, tokenMaskTracker, playLocal, stopLocal } from "../../animation/mask/token-mask.js";

/**
 * Socketlib handler to execute local sequence rendering on a client.
 */
async function playTokenMaskLocal(tokenId, tileIds, initiatorUserId, config = {}) {
    log.debug(`playTokenMaskLocal | Received socket call:`, {
        tokenId,
        tileIds,
        initiatorUserId,
        currentUser: game.user.name,
        animationId: config.animationId
    });

    const object = canvas.tokens.get(tokenId) || canvas.tiles.get(tokenId);
    if (!object) {
        console.warn(`Eskie Macros | tokenMaskEffect | playTokenMaskLocal | Object ${tokenId} not found on this client!`);
        // Report completion immediately to not block the initiator
        await socketlib.executeForUsers('tokenMaskClientDone', [initiatorUserId], tokenId, game.user.id, config.animationId);
        return;
    }

    try {
        if (config.toggleOff) {
            await stopLocal(object, config);
            return;
        }

        // Play the animation locally
        await playLocal(object, tileIds, {
            ...config,
            initiatorUserId
        });
    } catch (err) {
        console.error("Eskie Macros | tokenMaskEffect | playTokenMaskLocal | Error playing local animation:", err);
        // Report completion in case of failure
        await socketlib.executeForUsers('tokenMaskClientDone', [initiatorUserId], object.id, game.user.id, config.animationId);
    }
}

/**
 * Socketlib handler to report local animation completion back to the initiator.
 */
async function tokenMaskClientDone(tokenId, userId, animationId) {
    const tracker = tokenMaskTracker.get(animationId);
    if (tracker) {
        tracker.received.add(userId);
        log.debug(`tokenMaskClientDone | Received completion signal from user ${userId} for session ${animationId}. Progress: ${tracker.received.size}/${tracker.expected.size}`);
        
        // Check if all expected users have completed
        const allCompleted = [...tracker.expected].every(id => tracker.received.has(id));
        if (allCompleted) {
            log.debug(`tokenMaskClientDone | All clients reported completion for session ${animationId}! Triggering database cleanup...`);
            
            // Clean up using the GM-level cleanup
            await cleanUpTokenMask(tokenId, animationId, tracker.tileIds, tracker.deleteObject);
            
            // Resolve the initiator's promise
            tracker.resolve();
        }
    }
}

/**
 * Clean up the session tiles and token flags as GM.
 */
async function cleanUpTokenMask(tokenId, animationId, tileIds, deleteObject) {
    if (!game.user.isGM) {
        return socketlib.executeAsGM("cleanUpTokenMask", tokenId, animationId, tileIds, deleteObject);
    }
    
    log.debug(`cleanUpTokenMask | Cleaning up database for object ${tokenId} (Session: ${animationId}). Delete object: ${deleteObject}`);
    
    const object = canvas.tokens.get(tokenId) || canvas.tiles.get(tokenId);
    if (object) {
        // Resolve tiles and detach them in the database
        const tiles = tileIds ? tileIds.map(id => canvas.scene.tiles.get(id)).filter(t => t) : [];
        if (tiles.length > 0) {
            await objectAttachment.detach(tiles, object);
        }

        if (deleteObject) {
            await object.document.delete();
        } else {
            // Delete the tiles
            if (tileIds && tileIds.length > 0) {
                const { tile } = await import('./tile.js');
                await Promise.all(tileIds.map(tileId => tile.destroy(tileId)));
            }
            // Remove only this specific animationId session's flag
            await object.document.update({
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
