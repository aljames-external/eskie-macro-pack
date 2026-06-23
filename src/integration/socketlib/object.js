import { token } from './token.js';
import { tile } from './tile.js';

/**
 * Generalized edit function that dynamically updates either a Token or a Tile
 * based on which layer the object exists on in the active canvas scene.
 * @param {string} id - The ID of the object (Token or Tile) to edit.
 * @param {object} [updates={}] - The updates to apply.
 */
async function edit(id, updates = {}) {
    const isToken = !!canvas.tokens.get(id);
    const isTile = !!canvas.tiles.get(id);

    if (isToken) {
        return token.edit(id, updates);
    } else if (isTile) {
        return tile.edit(id, updates);
    }
    
    console.warn(`socket.object.edit | Object ${id} not found on this client's canvas!`);
}

export const object = {
    edit
};
