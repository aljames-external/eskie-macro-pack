import { MODULE_ID } from "../../lib/constants.js"
import { socketlib } from "../socketlib.js"

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
};

/**
 * Edits a token, executing as GM if the user is not a GM.
 * @param {string} id - The ID of the token to edit.
 * @param {object} [updates={}] - An object containing the updates to apply to the token.
 * @returns {Promise<TokenDocument>} The updated token document.
 */
async function edit(id, updates = {}) {
    if (game.user.isGM) return editToken(id, updates);
    return socketlib.executeAsGM("editToken", id, updates);
}

/**
 * Creates a token, executing as GM if the user is not a GM.
 * @param {object} [updates={}] - An object containing the data for the new token.
 * @returns {Promise<TokenDocument[]>} An array containing the new token document.
 */
async function create(position, updates = {}) {
    if (game.user.isGM) return createToken(updates);
    return socketlib.executeAsGM("createToken", position, updates);
}

/**
 * Deletes a token, executing as GM if the user is not a GM.
 * @param {string} id - The ID of the token to delete.
 * @returns {Promise<TokenDocument[]>} An array containing the deleted token document.
 */
async function destroy(id) {
    if (game.user.isGM) return destroyToken(id);
    return socketlib.executeAsGM("destroyToken", id);
}

export const token = {
    edit,
    create,
    destroy,
}
