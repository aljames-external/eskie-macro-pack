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
    
    const token = canvas.tokens.get(tokenId);
    const { socket } = await import('../socketlib.js');
    
    if (tracker.deleteToken && token) {
        await socket.token.destroy(token.id);
    } else {
        await Promise.all(tracker.tileIds.map(tileId => socket.tile.destroy(tileId)));
        if (token) {
            await socket.token.edit(token.id, { "flags.eskie-macros.-=sao-shatter-tiles": null });
        }
    }
}

// Socket function: called on every client
async function playSaoShatterLocal(tokenId, tileIds, initiatorUserId, config = {}) {
    const token = canvas.tokens.get(tokenId);
    if (!token) return;

    const {
        tintColor = '#00FFFF',
        duration = 1000,
        shatterColor = 'blue',
        deleteToken = false,
        center = true,
        rotation = 0,
        toggleOff = false
    } = config;

    const id = 'swordArtOnlineShatter';
    const label = `${id} - ${token.id}`;
    const { socket } = await import('../socketlib.js');

    if (toggleOff) {
        new Sequence().animation().on(token).opacity(1).show(true).play({ remote: false });
        Sequencer.EffectManager.endEffects({ name: label });
        
        if (game.user.id === initiatorUserId) {
            await Promise.all(tileIds.map(tileId => socket.tile.destroy(tileId)));
            await socket.token.edit(token.id, { "flags.eskie-macros.-=sao-shatter-tiles": null });
        }
    } else {
        const tokenOverlayRaw = `eskie.wounds.token_mask.shatter.${center ? 'center' : 'side'}.01.${shatterColor}.no_base`;
        const revealOverlayRaw = `eskie.texture_mask.tile_base.shatter.${center ? 'center' : 'side'}.01`;
        
        const tokenOverlay = closest(tokenOverlayRaw);
        const revealOverlay = closest(revealOverlayRaw);
        
        let revealOverlayPath = revealOverlay;
        try { 
            const entry = Sequencer.Database.getEntry(revealOverlay, { softFail: true });
            revealOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || revealOverlay);
        } catch (e) {}

        let tokenOverlayPath = tokenOverlay;
        try { 
            const entry = Sequencer.Database.getEntry(tokenOverlay, { softFail: true });
            tokenOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || tokenOverlay);
        } catch (e) {}

        const tokenRevealMask = canvas.scene.tiles.get(tileIds[0]);
        const sceneRevealMask = canvas.scene.tiles.get(tileIds[1]);
        const tokenShapeMask = canvas.scene.tiles.get(tileIds[2]);

        if (!tokenRevealMask || !sceneRevealMask || !tokenShapeMask) return;

        let sequence = new Sequence()
            .animation()
            .on(token)
            .tint(tintColor)
            .fadeIn(duration)
            .duration(duration)
            .waitUntilFinished()
            .thenDo(async () => {
                const scaleXY = token.document.texture.scaleX;

                // Wait for tiles to load and render locally
                const sleep = (ms) => new Promise(r => setTimeout(r, ms));
                let retries = 0;
                const maxRetries = 50;
                while (!(tokenRevealMask?._object?.sourceElement && sceneRevealMask?._object?.sourceElement && tokenShapeMask?._object?.mesh) && retries < maxRetries) {
                    await sleep(100);
                    retries++;
                }
                if (retries >= maxRetries) {
                    if (game.user.id === initiatorUserId) {
                        await Promise.all([
                            socket.tile.destroy(tokenRevealMask.id),
                            socket.tile.destroy(sceneRevealMask.id),
                            socket.tile.destroy(tokenShapeMask.id)
                        ]);
                        await socket.token.edit(token.id, { "flags.eskie-macros.-=sao-shatter-tiles": null });
                    }
                    return ui.notifications.error("Failed to load SAO shatter video elements in time!");
                }

                // Reset video to start
                tokenRevealMask._object.sourceElement.currentTime = 0;
                sceneRevealMask._object.sourceElement.currentTime = 0;

                let shatterSeq = new Sequence();
                
                if (canvas.scene.background.src) {
                    shatterSeq = shatterSeq.effect()
                        .name(label)
                        .file(canvas.scene.background.src)
                        .atLocation({x: (canvas.dimensions.width) / 2, y: (canvas.dimensions.height) / 2})
                        .size({width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size}, {gridUnits: true})
                        .persist()
                        .belowTokens()
                        .mask(sceneRevealMask._object)
                        .spriteOffset({x: -canvas.scene.background.offsetX, y: -canvas.scene.background.offsetY});
                }

                shatterSeq = shatterSeq.effect()
                    .name(label)
                    .copySprite(token)
                    .tint(tintColor)
                    .attachTo(token, {bindAlpha: false, bindVisibility: false, bindRotation: true})
                    .scaleToObject(1, { considerTokenScale: true })
                    .spriteRotation(-token.document.rotation)
                    .mask(tokenRevealMask._object)
                    .persist()

                    .animation()
                    .delay(250)
                    .on(token)
                    .opacity(0)
                    .show(false)

                    .wait(250)
                    .thenDo(async () => {
                        // Make all three video masks visible ONLY locally on this client
                        tokenRevealMask._object.alpha = 1;
                        sceneRevealMask._object.alpha = 1;
                        tokenShapeMask._object.alpha = 1;

                        tokenRevealMask._object.sourceElement.currentTime = 0;
                        tokenRevealMask._object.sourceElement.play().catch(() => {});
                        sceneRevealMask._object.sourceElement.currentTime = 0;
                        sceneRevealMask._object.sourceElement.play().catch(() => {});
                    })

                    .effect()
                    .file(tokenOverlayPath)
                    .attachTo(token, {bindAlpha: false, bindVisibility: false, bindRotation: false})
                    .mask(tokenShapeMask._object)
                    .rotate(-rotation)
                    .scaleToObject(scaleXY)
                    .zIndex(1)
                    .waitUntilFinished()

                    .thenDo(async () => {
                        // Hide tiles locally
                        tokenRevealMask._object.visible = false;
                        sceneRevealMask._object.visible = false;
                        tokenShapeMask._object.visible = false;

                        await Sequencer.EffectManager.endEffects({ name: label });
                        
                        // Signal back to initiator that this client is done!
                        const eskieModule = game.modules.get('eskie-macros');
                        if (eskieModule?.socketlib) {
                            await eskieModule.socketlib.executeForUsers('saoShatterClientDone', [initiatorUserId], token.id, game.user.id);
                        } else {
                            // Fallback if standalone/no-socket
                            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
                            await sleep(1000);
                            if (deleteToken) {
                                await token.document.delete();
                            } else {
                                await canvas.scene.deleteEmbeddedDocuments('Tile', [tokenRevealMask.id, sceneRevealMask.id, tokenShapeMask.id]);
                            }
                        }
                    });

                shatterSeq.play({ remote: false });
            });

        sequence.play({ remote: false });
    }
}

// Socket function: called on initiator's client when a client finishes
async function saoShatterClientDone(tokenId, userId) {
    const tracker = globalThis.eskie.saoShatterTracker.get(tokenId);
    if (!tracker) return;
    tracker.received.add(userId);
    
    // Check if all expected active users have responded
    const allDone = [...tracker.expected].every(id => tracker.received.has(id));
    if (allDone) {
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
