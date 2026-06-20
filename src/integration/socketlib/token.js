import { MODULE_ID } from "../../lib/constants.js"

/**
 * Edits an existing token document. To be registered in socketlib.
 * @param {string} id - The ID of the token to edit.
 * @param {object} [updates={}] - An object containing the updates to apply to the token.
 * @returns {Promise<TokenDocument>} The updated token document.
 */
async function editToken(id, updates = {}) {
    const token = canvas.tokens.get(id);
    if (!token) return;
    return token.document.update(updates);
}

/**
 * Creates a new token document. To be registered in socketlib.
 * @param {object} [updates={}] - An object containing the data for the new token.
 * @returns {Promise<TokenDocument[]>} An array containing the new token document.
 */
async function createToken(position, updates = {}) {
    const actorName = "EMP Blank Actor"; // Change this to your Actor's name
    const actor = game.actors.getName(actorName);
    const tokenData = await actor.getTokenDocument(position);
    return canvas.scene.createEmbeddedDocuments("Token", [tokenData]);
}

/**
 * Deletes a token document. To be registered in socketlib.
 * @param {string} id - The ID of the token to delete.
 * @returns {Promise<TokenDocument[]>} An array containing the deleted token document.
 */
async function destroyToken(id) {
    return canvas.scene.deleteEmbeddedDocuments("Token", [id]);
}

export const tokenSockets = {
    editToken,
    createToken,
    destroyToken,
    playSaoShatterLocal,
    saoShatterClientDone,
    cleanUpSaoShatter
};

/**
 * Socketlib handler to execute local sequence rendering on a client.
 */
async function playSaoShatterLocal(tokenId, tileIds, initiatorUserId, config = {}) {
    console.log(`Eskie Macros | SAO Shatter | playSaoShatterLocal | Received socket call:`, {
        tokenId,
        tileIds,
        initiatorUserId,
        toggleOff: config.toggleOff,
        currentUser: game.user.name
    });

    const token = canvas.tokens.get(tokenId);
    if (!token) {
        return console.warn(`Eskie Macros | SAO Shatter | playSaoShatterLocal | Token ${tokenId} not found on this client!`);
    }

    if (config.toggleOff) {
        // Toggle off / stop the animation session locally
        return eskie.effect.swordArtOnlineDeath.stop(token, {
            ...config,
            localOnly: true
        });
    }

    // Play the animation session locally
    return eskie.effect.swordArtOnlineDeath.play(token, {
        ...config,
        tileIds,
        localOnly: true,
        initiatorUserId
    });
}

/**
 * Socketlib handler to report local animation completion back to the initiator.
 */
async function saoShatterClientDone(tokenId, userId, animationId) {
    const tracker = globalThis.eskie?.saoShatterTracker?.get(animationId);
    if (tracker) {
        tracker.received.add(userId);
        console.log(`Eskie Macros | SAO Shatter | saoShatterClientDone | Received completion signal from user ${userId} for session ${animationId}. Progress: ${tracker.received.size}/${tracker.expected.size}`);
        
        // Check if all expected users have completed
        const allCompleted = [...tracker.expected].every(id => tracker.received.has(id));
        if (allCompleted) {
            console.log(`Eskie Macros | SAO Shatter | saoShatterClientDone | All clients reported completion for session ${animationId}! Triggering database cleanup...`);
            clearTimeout(tracker.timeoutId);
            globalThis.eskie.saoShatterTracker.delete(animationId);
            
            // Clean up using the GM-level cleanup
            await cleanUpSaoShatter(tokenId, animationId, tracker.tileIds, tracker.deleteToken);
        }
    }
}

/**
 * Clean up the session tiles and token flags as GM.
 */
async function cleanUpSaoShatter(tokenId, animationId, tileIds, deleteToken) {
    if (!game.user.isGM) {
        const socket = game.modules.get(MODULE_ID).socketlib;
        if (socket) {
            return socket.executeAsGM("cleanUpSaoShatter", tokenId, animationId, tileIds, deleteToken);
        }
    }
    
    console.log(`Eskie Macros | SAO Shatter | cleanUpSaoShatter | Cleaning up database for token ${tokenId} (Session: ${animationId}). Delete token: ${deleteToken}`);
    
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
                [`flags.eskie-macros.sao-shatters.-=${animationId}`]: null
            });
        }
    }
}

/**
 * Checks if socketlib is initialized and ready.
 * @param {any} socket - The socket instance.
 * @returns {boolean} True if the socket is initialized, false otherwise.
 */
function initialized(socket) {
    if (!socket) { ui.notifications.error("Eskie Macros | socketlib is not initialized"); }
    return !!socket;
}

/**
 * Edits a token, executing as GM if the user is not a GM.
 * @param {string} id - The ID of the token to edit.
 * @param {object} [updates={}] - An object containing the updates to apply to the token.
 * @returns {Promise<TokenDocument>} The updated token document.
 */
async function edit(id, updates = {}) {
    if (game.user.isGM) return editToken(id, updates);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("editToken", id, updates);
}

/**
 * Creates a token, executing as GM if the user is not a GM.
 * @param {object} [updates={}] - An object containing the data for the new token.
 * @returns {Promise<TokenDocument[]>} An array containing the new token document.
 */
async function create(position, updates = {}) {
    if (game.user.isGM) return createToken(updates);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("createToken", position, updates);
}

/**
 * Deletes a token, executing as GM if the user is not a GM.
 * @param {string} id - The ID of the token to delete.
 * @returns {Promise<TokenDocument[]>} An array containing the deleted token document.
 */
async function destroy(id) {
    if (game.user.isGM) return destroyToken(id);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("destroyToken", id);
}

export const token = {
    edit,
    create,
    destroy,
    cleanUpSaoShatter
}
