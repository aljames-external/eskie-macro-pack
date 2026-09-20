
import { log } from '../../../lib/logger.js';
import { socket, socketlib } from "./socketlib-module-adapter.js";
import { tokenMaskEffect, tokenMaskTracker, playLocal, stopLocal } from "../../../animation/mask/token-mask.js";
import { tile } from "./tile.js";
import { adapter } from "../../index.js";

/**
 * Socketlib handler to execute local sequence rendering on a client.
 */
async function playTokenMaskLocal(tokenId: string, tileIds: any, initiatorUserId: string, config: any = {}) {
    log.debug(`playTokenMaskLocal | Received socket call:`, {
        tokenId,
        tileIds,
        initiatorUserId,
        currentUser: game.user.name,
        animationId: config.animationId
    });

    const object = adapter.getPlaceable(tokenId);
    if (!object) {
        log.warn(`playTokenMaskLocal | Object ${tokenId} not found on this client!`);
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
        await playLocal(object, tileIds, config.animationId, {
            ...config,
            initiatorUserId
        });
    } catch (err) {
        log.error("playTokenMaskLocal | Error playing local animation:", err);
        // Report completion in case of failure
        await socketlib.executeForUsers('tokenMaskClientDone', [initiatorUserId], object.id, game.user.id, config.animationId);
    }
}

/**
 * Socketlib handler to report local animation completion back to the initiator.
 */
async function tokenMaskClientDone(tokenId: any, userId: any, animationId: any) {
    const tracker = tokenMaskTracker.get(animationId);
    if (tracker) {
        tracker.received.add(userId);
        log.debug(`tokenMaskClientDone | Received completion signal from user ${userId} for session ${animationId}. Progress: ${tracker.received.size}/${tracker.expected.size}`);
        
        // Check if all expected users have completed
        const allCompleted = [...tracker.expected].every(id => tracker.received.has(id));
        if (allCompleted) {
            log.debug(`tokenMaskClientDone | All clients reported completion for session ${animationId}! Triggering database cleanup...`);
            
            try {
                // Clean up using the GM-level cleanup
                await cleanUpTokenMask(tokenId, animationId, tracker.tileIds, tracker.deleteObject);
            } catch (err) {
                log.error(`tokenMaskClientDone | Error during cleanUpTokenMask for session ${animationId}:`, err);
            } finally {
                // Guarantee the initiator's promise is resolved to clear safety timeout
                tracker.resolve();
            }
        }
    }
}

/**
 * Clean up the session tiles and token flags as GM.
 */
async function cleanUpTokenMask(tokenId: any, animationId: any, tileIds: any, deleteObject: any): Promise<any> {
    if (!game.user.isGM) {
        return socketlib.executeAsGM("cleanUpTokenMask", tokenId, animationId, tileIds, deleteObject);
    }
    
    log.debug(`cleanUpTokenMask | Cleaning up database for object ${tokenId} (Session: ${animationId}). Delete object: ${deleteObject}`);

    // Direct tile destruction: tile.destroy automatically detaches each tile before deletion
    if (tileIds && tileIds.length > 0) {
        try {
            await Promise.all(tileIds.map((tileId: any) => tile.destroy(tileId)));
        } catch (err) {
            log.warn(`cleanUpTokenMask | Error deleting temporary tiles for session ${animationId}:`, err);
        }
    }

    const object = adapter.getPlaceable(tokenId);
    if (object) {
        const doc = object.document ?? object;
        if (deleteObject) {
            try {
                await doc.delete();
            } catch (err) {
                log.warn(`cleanUpTokenMask | Error deleting target object ${tokenId}:`, err);
            }
        } else if (animationId && typeof doc.unsetFlag === 'function') {
            try {
                await doc.unsetFlag('eskie-macros', `token-masks.${animationId}`);
            } catch (err) {
                log.warn(`cleanUpTokenMask | Error unsetting flag for session ${animationId}:`, err);
            }
        }
    }
}

/**
 * Socketlib handler to execute coordinated token mask playback as GM.
 */
async function playTokenMaskGM(tokenId: any, config: any = {}) {
    if (!game.user.isGM) return;
    const object = adapter.getPlaceable(tokenId);
    if (!object) return;
    return tokenMaskEffect.play(object, config);
}

export const tokenMaskSockets = {
    playTokenMaskLocal,
    tokenMaskClientDone,
    cleanUpTokenMask,
    playTokenMaskGM,
};
