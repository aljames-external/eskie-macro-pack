import { MODULE_ID } from "../../lib/constants.js"

/* To be registered in socketlib */
async function editTile(id, updates = {}) {
    const tile = canvas.tiles.get(id);
    if (!tile) return;
    return tile.document.update(updates);
}

async function createTile(updates = {}) {
    const DEFAULT_TILE_UPDATES = {
        width: 1,
        height: 1
    };
    updates = foundry.utils.mergeObject(DEFAULT_TILE_UPDATES, updates, { inplace: false });
    
    return canvas.scene.createEmbeddedDocuments("Tile", [updates]);
}

async function destroyTile(id) {
    return canvas.scene.deleteEmbeddedDocuments("Tile", [id]);
}

export const tileSockets = {
    editTile,
    createTile,
    destroyTile,
};

function initialized(socket) {
    if (!socket) { ui.notifications.error("Eskie Macros | socketlib is not initialized"); }
    return !!socket;
}

async function edit(id, updates = {}) {
    if (game.user.isGM) return editTile(id, updates);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("editTile", id, updates);
}

async function create(updates = {}) {
    if (game.user.isGM) return createTile(updates);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("createTile", updates);
}

async function destroy(id) {
    if (game.user.isGM) return destroyTile(id);
    const socket = game.modules.get(MODULE_ID).socketlib;
    if (!initialized(socket)) return;
    return socket.executeAsGM("destroyTile", id);
}

export const tile = {
    edit,
    create,
    destroy,
}
