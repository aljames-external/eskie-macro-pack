import { MODULE_ID } from "../../lib/constants.js"

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

export const tokenSockets = {
    editToken,
    createToken,
    destroyToken,
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
