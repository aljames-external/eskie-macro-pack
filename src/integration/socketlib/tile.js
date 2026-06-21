import { MODULE_ID } from "../../lib/constants.js"

/**
 * Edits an existing tile document. To be registered in socketlib.
 * @param {string} id - The ID of the tile to edit.
 * @param {object} [updates={}] - An object containing the updates to apply to the tile.
 * @returns {Promise<TileDocument>} The updated tile document.
 */
async function editTile(id, updates = {}) {
    const tile = canvas.tiles.get(id);
    if (!tile) return;
    return tile.document.update(updates);
}

/**
 * Creates a new tile document. To be registered in socketlib.
 * @param {object} [updates={}] - An object containing the data for the new tile.
 * @returns {Promise<TileDocument[]>} An array containing the new tile document.
 */
async function createTile(updates = {}) {
    const DEFAULT_TILE_UPDATES = {
        width: 1,
        height: 1
    };
    updates = foundry.utils.mergeObject(DEFAULT_TILE_UPDATES, updates, { inplace: false });
    return canvas.scene.createEmbeddedDocuments("Tile", [updates]);
}

/**
 * Deletes multiple tile documents. To be registered in socketlib.
 * @param {string[]} ids - An array of IDs of the tiles to delete.
 * @returns {Promise<TileDocument[]>} An array containing the deleted tile documents.
 */
async function destroyTiles(ids) {
    if (!canvas.scene) return [];
    const arrayIds = Array.isArray(ids) ? ids : [ids];
    return canvas.scene.deleteEmbeddedDocuments("Tile", arrayIds);
}

export const tileSockets = {
    editTile,
    createTile,
    destroyTiles,
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
 * Edits a tile, executing as GM if the user is not a GM.
 * @param {string} id - The ID of the tile to edit.
 * @param {object} [updates={}] - An object containing the updates to apply to the tile.
 * @returns {Promise<TileDocument>} The updated tile document.
 */
async function edit(id, updates = {}) {
    if (game.user.isGM) return editTile(id, updates);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("editTile", id, updates);
}

/**
 * Creates a tile, executing as GM if the user is not a GM.
 * @param {object} [updates={}] - An object containing the data for the new tile.
 * @returns {Promise<TileDocument[]>} An array containing the new tile document.
 */
async function create(updates = {}) {
    if (game.user.isGM) return createTile(updates);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("createTile", updates);
}

/**
 * Deletes tiles, executing as GM if the user is not a GM.
 * @param {string|string[]} id - The ID of the tile to delete, or an array of IDs.
 * @returns {Promise<TileDocument[]>} An array containing the deleted tile document.
 */
async function destroy(id) {
    const ids = Array.isArray(id) ? id : [id];
    if (game.user.isGM) return destroyTiles(ids);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("destroyTiles", ids);
}

export const tile = {
    edit,
    create,
    destroy
}
