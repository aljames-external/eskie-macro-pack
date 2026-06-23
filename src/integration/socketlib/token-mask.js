import { log } from '../../lib/logger.js';
import { socketlib } from "../socketlib.js";
import { playLocal, stopLocal } from "../../animation/mask/token-mask.js";

/**
 * Socketlib handler to execute local sequence rendering on a client.
 * Called on all clients when an animation is triggered.
 */
async function playTokenMaskLocal(tokenId, config = {}) {
    log.debug(`playTokenMaskLocal | Received socket call:`, {
        tokenId,
        currentUser: game.user.name,
    });

    const object = canvas.tokens.get(tokenId) || canvas.tiles.get(tokenId);
    if (!object) {
        log.warn(`playTokenMaskLocal | Object ${tokenId} not found on this client!`);
        return;
    }

    try {
        if (config.toggleOff) {
            await stopLocal(object, config);
            return;
        }

        // Play the animation locally on this client
        await playLocal(object, config);
    } catch (err) {
        log.error("playTokenMaskLocal | Error playing local animation:", err);
    }
}

/**
 * Socketlib handler to delete a token or tile from the database.
 * Executed exclusively on the GM's client when requested by a player.
 */
async function deleteTokenGM(tokenId) {
    if (!game.user.isGM) return;
    log.debug(`deleteTokenGM | Received delete request for object ${tokenId}`);
    const object = canvas.tokens.get(tokenId) || canvas.tiles.get(tokenId);
    if (object) {
        await object.document.delete();
    }
}

export const tokenMaskSockets = {
    playTokenMaskLocal,
    deleteTokenGM,
};
