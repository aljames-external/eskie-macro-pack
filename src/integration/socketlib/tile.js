import { MODULE_ID } from "../../lib/constants.js"
import { socketlib } from "../socketlib.js"

const tileTrackers = new Map();

/**
 * Helper function to wait for a tile to be replicated and loaded on all active players' clients.
 */
async function waitForTileReplication(tileId) {
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
            console.warn(`Eskie Macros | waitForTileReplication | Timeout waiting for tile ${tileId} to replicate to all players.`);
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
    await socketlib.executeForEveryone("verifyTileReceivedLocal", tileId, game.user.id, trackerId);

    return promise;
}

/**
 * Socketlib handler to locally verify a tile exists in the client's scene.
 */
async function verifyTileReceivedLocal(tileId, gmUserId, trackerId) {
    const hasTile = () => canvas.scene?.tiles?.has(tileId);
    
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let attempts = 0;
    while (!hasTile() && attempts < 100) { // Max 5 seconds
        await sleep(50);
        attempts++;
    }
    
    await socketlib.executeForUsers("reportTileReceived", [gmUserId], tileId, game.user.id, trackerId);
}

/**
 * Socketlib handler for clients to report back tile replication completion.
 */
async function reportTileReceived(tileId, userId, trackerId) {
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
 * @param {object} [options={}] - Options for tile creation, including waitForPlayers.
 * @returns {Promise<TileDocument[]>} An array containing the new tile document.
 */
async function createTile(updates = {}, options = {}) {
    const DEFAULT_TILE_UPDATES = {
        width: 1,
        height: 1
    };
    updates = foundry.utils.mergeObject(DEFAULT_TILE_UPDATES, updates, { inplace: false });
    const docs = await canvas.scene.createEmbeddedDocuments("Tile", [updates]);
    const doc = docs[0];
    if (doc && options.waitForPlayers) {
        await waitForTileReplication(doc.id);
    }
    return docs;
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
 * @param {object} [options={}] - Options, e.g. { waitForPlayers: true }
 * @returns {Promise<TileDocument[]>} An array containing the new tile document.
 */
async function create(updates = {}, options = {}) {
    if (game.user.isGM) return createTile(updates, options);
    return socketlib.executeAsGM("createTile", updates, options);
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

export const tile = {
    edit,
    create,
    destroy
}
