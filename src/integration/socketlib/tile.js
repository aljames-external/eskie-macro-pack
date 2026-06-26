import { MODULE_ID } from "../../lib/constants.js"
import { socketlib } from "../socketlib.js"

const tileTrackers = new Map();

/**
 * Helper function to wait for tiles to be replicated and loaded on all active players' clients.
 * @param {string|string[]} tileIds - The ID(s) of the tile(s) to synchronize.
 */
async function waitForTileReplication(tileIds) {
    const arrayIds = Array.isArray(tileIds) ? tileIds : [tileIds];
    const activeUsers = game.users.filter(u => u.active);
    const expectedUserIds = activeUsers.map(u => u.id);
    
    let resolvePromise;
    const promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    const trackerId = foundry.utils.randomID();
    
    // Safety timeout (10 seconds)
    const timeoutId = setTimeout(() => {
        const tracker = tileTrackers.get(trackerId);
        if (tracker) {
            console.warn(`Eskie Macros | waitForTileReplication | Timeout waiting for tiles ${arrayIds.join(", ")} to replicate to all players.`);
            tracker.resolve();
        }
    }, 10000);

    tileTrackers.set(trackerId, {
        expected: new Set(expectedUserIds),
        received: new Set(),
        resolve: () => {
            clearTimeout(timeoutId);
            tileTrackers.delete(trackerId);
            resolvePromise();
        }
    });

    // Broadcast verification request to everyone
    await socketlib.executeForEveryone("verifyTileReceivedLocal", arrayIds, game.user.id, trackerId);

    return promise;
}

/**
 * Socketlib handler to locally verify tiles exist in the client's scene.
 * @param {string|string[]} tileIds - The ID(s) of the tile(s) to verify.
 * @param {string} gmUserId - The GM's user ID.
 * @param {string} trackerId - The tracker ID.
 */
async function verifyTileReceivedLocal(tileIds, gmUserId, trackerId) {
    const arrayIds = Array.isArray(tileIds) ? tileIds : [tileIds];
    const hasAllTiles = () => arrayIds.every(id => canvas.scene?.tiles?.has(id));
    
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let attempts = 0;
    while (!hasAllTiles() && attempts < 100) { // Max 5 seconds
        await sleep(50);
        attempts++;
    }
    
    await socketlib.executeForUsers("reportTileReceived", [gmUserId], arrayIds, game.user.id, trackerId);
}

/**
 * Socketlib handler for clients to report back tile replication completion.
 * @param {string|string[]} tileIds - The ID(s) of the tile(s) that were verified.
 * @param {string} userId - The client user ID reporting back.
 * @param {string} trackerId - The tracker ID.
 */
async function reportTileReceived(tileIds, userId, trackerId) {
    const tracker = tileTrackers.get(trackerId);
    if (tracker) {
        tracker.received.add(userId);
        const allCompleted = [...tracker.expected].every(id => tracker.received.has(id));
        if (allCompleted) {
            tracker.resolve();
        }
    }
}

/**
 * Socketlib handler to execute waitForTileReplication as GM.
 * @param {string|string[]} tileIds - The ID(s) of the tile(s) to synchronize.
 */
async function waitForTileReplicationGM(tileIds) {
    if (!game.user.isGM) return;
    return waitForTileReplication(tileIds);
}

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
    verifyTileReceivedLocal,
    reportTileReceived,
    waitForTileReplicationGM,
};

/**
 * Edits a tile, executing as GM if the user is not a GM.
 * @param {string} id - The ID of the tile to edit.
 * @param {object} [updates={}] - An object containing the updates to apply to the tile.
 * @returns {Promise<TileDocument>} The updated tile document.
 */
async function edit(id, updates = {}) {
    if (game.user.isGM) return editTile(id, updates);
    return socketlib.executeAsGM("editTile", id, updates);
}

/**
 * Creates a tile, executing as GM if the user is not a GM.
 * @param {object} [updates={}] - An object containing the data for the new tile.
 * @returns {Promise<TileDocument[]>} An array containing the new tile document.
 */
async function create(updates = {}) {
    if (game.user.isGM) return createTile(updates);
    return socketlib.executeAsGM("createTile", updates);
}

/**
 * Deletes tiles, executing as GM if the user is not a GM.
 * @param {string|string[]} id - The ID of the tile to delete, or an array of IDs.
 * @returns {Promise<TileDocument[]>} An array containing the deleted tile document.
 */
async function destroy(id) {
    const ids = Array.isArray(id) ? id : [id];
    if (game.user.isGM) return destroyTiles(ids);
    return socketlib.executeAsGM("destroyTiles", ids);
}

/**
 * Synchronizes the tile(s) to all active clients, waiting until they exist locally for everyone.
 * @param {string|string[]} tileIds - The ID(s) of the tile(s) to synchronize.
 * @returns {Promise<void>}
 */
async function sync(tileIds) {
    if (game.user.isGM) return waitForTileReplication(tileIds);
    return socketlib.executeAsGM("waitForTileReplicationGM", tileIds);
}

export const tile = {
    edit,
    create,
    destroy,
    sync,
}
