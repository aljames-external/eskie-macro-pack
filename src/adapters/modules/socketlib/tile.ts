import { MODULE_ID } from "../../../lib/constants.js";
import { log } from "../../../lib/logger.js";
import { socketlib } from "./socketlib-module-adapter.js";
import { adapter } from "../../index.js";

const tileTrackers = new Map();

/**
 * Helper function to wait for a tile to be replicated and loaded on all active players' clients.
 */
async function waitForTileReplication(tileId: any) {
    const activeUsers = game.users.filter(u => u.active);
    const expectedUserIds = activeUsers.map(u => u.id);
    
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    const trackerId = adapter.randomID();
    
    // Safety timeout (10 seconds)
    const timeoutId = setTimeout(() => {
        const tracker = tileTrackers.get(trackerId);
        if (tracker) {
            log.warn(`waitForTileReplication | Timeout waiting for tile ${tileId} to replicate to all players.`);
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
async function verifyTileReceivedLocal(tileId: any, gmUserId: any, trackerId: any) {
    const hasTile = () => canvas.scene?.tiles?.has(tileId);
    
    const sleep = (ms: any) => new Promise(r => setTimeout(r, ms));
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
async function reportTileReceived(tileId: any, userId: any, trackerId: any) {
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
 */
async function waitForTileReplicationGM(tileId: any) {
    if (!game.user.isGM) return;
    return waitForTileReplication(tileId);
}

/**
 * Edits an existing tile document. To be registered in socketlib.
 * @param {string} id - The ID of the tile to edit.
 * @param {object} [updates={}] - An object containing the updates to apply to the tile.
 * @returns {Promise<TileDocument>} The updated tile document.
 */
async function editTile(id: any, updates: any = {}) {
    const tile = canvas.tiles.get(id);
    if (!tile) return;
    return tile.document.update(updates);
}

/**
 * Creates a new tile document. To be registered in socketlib.
 * @param {object} [updates={}] - An object containing the data for the new tile.
 * @returns {Promise<TileDocument[]>} An array containing the new tile document.
 */
async function createTile(updates: any = {}) {
    const DEFAULT_TILE_UPDATES = {
        width: 1,
        height: 1
    };
    updates = adapter.mergeObject(DEFAULT_TILE_UPDATES, updates);
    return (canvas as any).scene?.createEmbeddedDocuments("Tile", [updates as any]) ?? [];
}

/**
 * Deletes multiple tile documents. To be registered in socketlib.
 * Attempts to detach tiles from attached parent placeables before deletion unless options.detach === false.
 * @param {string[]} ids - An array of IDs of the tiles to delete.
 * @param {object} [options={}] - Options object: { detach?: boolean }
 * @returns {Promise<TileDocument[]>} An array containing the deleted tile documents.
 */
async function destroyTiles(ids: any, options: any = {}) {
    if (!canvas.scene) return [];
    const tileIds = [ids].flat().filter(Boolean);
    if (tileIds.length === 0) return [];

    const shouldDetach = options?.detach !== false;
    if (shouldDetach) {
        const tiles = tileIds.map((id: string) => (canvas as any).scene?.tiles?.get(id)).filter(Boolean);
        if (tiles.length > 0) {
            try {
                await adapter.detachPlaceableElements(tiles, null);
            } catch (err) {
                log.warn(`destroyTiles | Error detaching tiles before deletion:`, err);
            }
        }
    }

    return canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
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
async function edit(id: any, updates: any = {}) {
    if (game.user.isGM) return editTile(id, updates);
    return socketlib.executeAsGM("editTile", id, updates);
}

/**
 * Creates a tile, executing as GM if the user is not a GM.
 * @param {object} [updates={}] - An object containing the data for the new tile.
 * @returns {Promise<TileDocument[]>} An array containing the new tile document.
 */
async function create(updates: any = {}) {
    if (game.user.isGM) return createTile(updates);
    return socketlib.executeAsGM("createTile", updates);
}

/**
 * Deletes tiles, executing as GM if the user is not a GM.
 * Attempts to detach tiles before deletion by default unless options.detach === false.
 * @param {string|string[]} id - The ID of the tile to delete, or an array of IDs.
 * @param {object} [options={ detach: true }] - Deletion options object.
 * @returns {Promise<TileDocument[]>} An array containing the deleted tile document.
 */
async function destroy(id: any, options: any = {}) {
    const ids = [id].flat().filter(Boolean);
    if (ids.length === 0) return [];
    if (game.user.isGM) return destroyTiles(ids, options);
    return socketlib.executeAsGM("destroyTiles", ids, options);
}

/**
 * Synchronizes the tile to all active clients, waiting until it exists locally for everyone.
 * @param {string} tileId - The ID of the tile to synchronize.
 * @returns {Promise<void>}
 */
async function sync(tileId: any) {
    if (game.user.isGM) return waitForTileReplication(tileId);
    return socketlib.executeAsGM("waitForTileReplicationGM", tileId);
}

export const tile = {
    edit,
    create,
    destroy,
    sync,
}
