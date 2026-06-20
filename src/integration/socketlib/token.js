import { MODULE_ID } from "../../lib/constants.js"
import { closest } from "../../lib/filemanager.js"

/**
 * Edits an existing token document. To be registered in socketlib.
 * @param {string} id - The ID of the token to edit.
 * @param {object} [updates={}] - An object containing the updates to apply to the token.
 * @returns {Promise<TokenDocument>} The updated token document.
 */
async function editToken(id, updates = {}) {
    if (!canvas.tokens) return;
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
    const actorName = game.settings.get(MODULE_ID, "blankActorName") || "EMP Blank Actor";
    const actor = game.actors.getName(actorName);
    if (!actor) {
        throw new Error(`Eskie Macros | Spawning failed: Actor "${actorName}" required for token spawning not found.`);
    }
    if (!canvas.scene) {
        throw new Error(`Eskie Macros | Spawning failed: No active scene found to spawn token onto.`);
    }
    const tokenData = await actor.getTokenDocument({ ...position, ...updates });
    return canvas.scene.createEmbeddedDocuments("Token", [tokenData]);
}

/**
 * Deletes a token document. To be registered in socketlib.
 * @param {string} id - The ID of the token to delete.
 * @returns {Promise<TokenDocument[]>} An array containing the deleted token document.
 */
async function destroyToken(id) {
    if (!canvas.scene) return [];
    return canvas.scene.deleteEmbeddedDocuments("Token", [id]);
}

// Initialize tracking system on global eskie object
globalThis.eskie = globalThis.eskie || {};
globalThis.eskie.saoShatterTracker = globalThis.eskie.saoShatterTracker || new Map();

// Helper to clean up tiles from initiator side
async function cleanUpSaoShatter(tokenId) {
    const tracker = globalThis.eskie.saoShatterTracker.get(tokenId);
    if (!tracker) return;
    globalThis.eskie.saoShatterTracker.delete(tokenId);
    
    if (tracker.timeoutId) clearTimeout(tracker.timeoutId);
    
    console.log(`Eskie Macros | SAO Shatter | cleanUpSaoShatter | Initiating final database cleanup for token: ${tokenId}`);
    
    const token = canvas.tokens.get(tokenId);
    const { socket } = await import('../socketlib.js');
    
    if (tracker.deleteToken && token) {
        console.log(`Eskie Macros | SAO Shatter | cleanUpSaoShatter | Deleting token: ${token.id}`);
        await socket.token.destroy(token.id);
    } else {
        console.log(`Eskie Macros | SAO Shatter | cleanUpSaoShatter | Deleting tiles:`, tracker.tileIds);
        await Promise.all(tracker.tileIds.map(tileId => socket.tile.destroy(tileId)));
        if (token) {
            await socket.token.edit(token.id, { "flags.eskie-macros.-=sao-shatter-tiles": null });
        }
    }
    console.log(`Eskie Macros | SAO Shatter | cleanUpSaoShatter | Cleanup finished successfully.`);
}

// Socket function: called on every client
async function playSaoShatterLocal(tokenId, tileIds, initiatorUserId, config = {}) {
    console.log("Eskie Macros | SAO Shatter | playSaoShatterLocal | Received socket call:", {
        tokenId,
        tileIds,
        initiatorUserId,
        toggleOff: !!config.toggleOff,
        currentUser: game.user.name
    });

    const token = canvas.tokens.get(tokenId);
    if (!token) {
        return console.warn(`Eskie Macros | SAO Shatter | playSaoShatterLocal | Token with ID ${tokenId} not found in active scene.`);
    }

    const eskie = globalThis.eskie;
    if (!eskie?.effect?.swordArtOnlineDeath) {
        return console.error(`Eskie Macros | SAO Shatter | playSaoShatterLocal | eskie.effect.swordArtOnlineDeath API is not loaded!`);
    }

    if (config.toggleOff) {
        await eskie.effect.swordArtOnlineDeath.stop(token, {
            ...config,
            tileIds,
            initiatorUserId
        });
    } else {
        await eskie.effect.swordArtOnlineDeath.play(token, {
            ...config,
            tileIds,
            localOnly: true,
            initiatorUserId
        });
    }
}

// Socket function: called on initiator's client when a client finishes
async function saoShatterClientDone(tokenId, userId) {
    const tracker = globalThis.eskie.saoShatterTracker.get(tokenId);
    if (!tracker) return;
    tracker.received.add(userId);
    
    const expectedUsers = [...tracker.expected];
    const receivedUsers = [...tracker.received];
    console.log(`Eskie Macros | SAO Shatter | saoShatterClientDone | Initiator received completion signal from user: ${userId}. Tracker status:`, {
        expected: expectedUsers,
        received: receivedUsers
    });
    
    // Check if all expected active users have responded
    const allDone = expectedUsers.every(id => tracker.received.has(id));
    if (allDone) {
        console.log(`Eskie Macros | SAO Shatter | saoShatterClientDone | All users reported done! Starting cleanup.`);
        await cleanUpSaoShatter(tokenId);
    }
}

export const tokenSockets = {
    editToken,
    createToken,
    destroyToken,
    playSaoShatterLocal,
    saoShatterClientDone,
};

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
    if (game.user.isGM) return createToken(position, updates);
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
}
