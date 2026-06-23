import { dependency } from './dependency.js';
import { log } from './logger.js';

/**
 * Gets the native Foundry VTT document name of a placeable object or document.
 * Safe and compatible across all Foundry versions.
 * @param {PlaceableObject|Document} object - The object to inspect.
 * @returns {string|undefined} The document name (e.g., "Token", "Tile") or undefined.
 */
export function getDocumentName(object) {
    return object?.document?.documentName ?? object?.documentName;
}

/**
 * Attaches elements to a target PlaceableObject (Token or Tile).
 * If the target is a Tile, uses Baileywiki Mass Edit if active.
 * If the target is a Token, falls back to Token Attacher or Mass Edit.
 * @param {Array} elements - Elements to attach.
 * @param {PlaceableObject} target - Target Token or Tile.
 */
async function attach(elements, target) {
    const isTile = getDocumentName(target) === 'Tile';

    if (isTile) {
        if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
            return Promise.all(elements.map(element => MassEdit.linker.link([element, target])));
        }
        log.warn("object.attach | Cannot attach elements to a Tile without Baileywiki Mass Edit active.");
        return;
    }

    // Default Token behavior
    if (dependency.isActivated({ id: 'token-attacher', ref: "Token Attacher" })) {
        return tokenAttacher.attachElementsToToken(elements, target, true);
    } else if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
        return Promise.all(elements.map(element => MassEdit.linker.link([element, target])));
    }

    dependency.someRequired([
        { id: 'token-attacher', ref: "Token Attacher" },
        { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
    ]);
}

/**
 * Detaches elements from a target PlaceableObject (Token or Tile).
 * @param {Array} elements - Elements to detach.
 * @param {PlaceableObject} target - Target Token or Tile.
 */
async function detach(elements, target) {
    const isTile = getDocumentName(target) === 'Tile';

    if (isTile) {
        if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
            return Promise.all(elements.map(element => MassEdit.linker.removeLinks([element, target])));
        }
        return;
    }

    // Default Token behavior
    if (dependency.isActivated({ id: 'token-attacher', ref: "Token Attacher" })) {
        return tokenAttacher.detachElementsFromToken(elements, target, true);
    } else if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
        return Promise.all(elements.map(element => MassEdit.linker.removeLinks([element, target])));
    }

    dependency.someRequired([
        { id: 'token-attacher', ref: "Token Attacher" },
        { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
    ]);
}

export const object = {
    attach,
    detach,
    detatch: detach // Robust support for both spellings
};
