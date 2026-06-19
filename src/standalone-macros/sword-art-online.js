// Standalone Macro: Sword Art Online Death
if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sword Art Online Shatter' macro requires the 'Sequencer' module to be installed and active!");
}
if (!game.modules.get("token-attacher")?.active) {
    return ui.notifications.error("The 'Sword Art Online Shatter' macro requires the 'Token Attacher' module to be installed and active!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the default path if running as a standalone copy-paste macro.
 */
const closest = (path) => {
    if (typeof eskie !== "undefined" && eskie.util?.file?.closest) {
        return eskie.util.file.closest(path);
    }
    return path;
};

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const id = 'swordArtOnlineShatter';
const label = `${id} - ${token.id}`;

// Check if effect is already playing
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;

if (isPlaying) {
    new Sequence().animation().on(token).opacity(1).show(true).play();
    Sequencer.EffectManager.endEffects({ name: label });
    
    // Cleanup orphaned tiles if toggle off is triggered manually
    const orphanedTileIds = token.document.getFlag('eskie-macros', 'sao-shatter-tiles');
    if (orphanedTileIds) {
        await canvas.scene.deleteEmbeddedDocuments('Tile', orphanedTileIds);
        await token.document.unsetFlag('eskie-macros', 'sao-shatter-tiles');
    }
} else {
    const tintColor = '#00FFFF';
    const duration = 1000;
    const shatterColor = 'blue';
    const deleteToken = false;
    const center = true;
    const rotation = 0;

    const tokenOverlayRaw = `eskie.wounds.token_mask.shatter.${center ? 'center' : 'side'}.01.${shatterColor}.no_base`;
    const revealOverlayRaw = `eskie.texture_mask.tile_base.shatter.${center ? 'center' : 'side'}.01`;
    
    const tokenOverlay = closest(tokenOverlayRaw);
    const revealOverlay = closest(revealOverlayRaw);
    
    let revealOverlayPath = revealOverlay;
    try { 
        const entry = Sequencer.Database.getEntry(revealOverlay, { softFail: true });
        revealOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || revealOverlay);
    } catch (e) {}

    let sequence = new Sequence()
        .animation()
        .on(token)
        .tint(tintColor)
        .fadeIn(duration)
        .duration(duration)
        .waitUntilFinished()
        .thenDo(async () => {
            const scaleXY = token.document.texture.scaleX;

            const overlayMaskUpdates = {
                'texture.src': revealOverlayPath,
                'alpha': 0,
                'hidden': false,
                'x': token.x - (canvas.grid.size * token.document.width * (scaleXY - 1) / 2),
                'y': token.y - (canvas.grid.size * token.document.height * (scaleXY - 1) / 2),
                'video': { autoplay: false, loop: false, volume: 0 },
                'width': canvas.grid.size * (token.document.width * scaleXY),
                'height': canvas.grid.size * (token.document.height * scaleXY),
                'rotation': rotation,
            };

            const tokenMaskUpdates = {
                'texture': token.document.texture,
                'alpha': 1,
                'hidden': false,
                'x': token.x,
                'y': token.y,
                'rotation': token.document.rotation,
                'width': canvas.grid.size * token.document.width,
                'height': canvas.grid.size * token.document.height,
            };

            // Create tiles using standard Foundry API
            const tiles = await canvas.scene.createEmbeddedDocuments('Tile', [overlayMaskUpdates, overlayMaskUpdates, tokenMaskUpdates]);
            const tokenRevealMask = canvas.scene.tiles.get(tiles[0].id);
            const sceneRevealMask = canvas.scene.tiles.get(tiles[1].id);
            const tokenShapeMask = canvas.scene.tiles.get(tiles[2].id);

            // Store tile IDs on the token to allow cleanup if interrupted or toggled off
            await token.document.setFlag('eskie-macros', 'sao-shatter-tiles', [tokenRevealMask.id, sceneRevealMask.id, tokenShapeMask.id]);

            // Attach to token (requires Token Attacher module)
            if (typeof tokenAttacher !== 'undefined') {
                await tokenAttacher.attachElementsToToken([tokenRevealMask, sceneRevealMask, tokenShapeMask], token, true);
            }

            // Wait for tiles to load and render with a safety timeout
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            let retries = 0;
            const maxRetries = 50; // 5 seconds maximum wait
            while (!(tokenRevealMask?._object?.sourceElement && sceneRevealMask?._object?.sourceElement && tokenShapeMask?._object?.mesh) && retries < maxRetries) {
                await sleep(100);
                retries++;
            }
            if (retries >= maxRetries) {
                // Cleanup tiles to prevent canvas clutter
                await canvas.scene.deleteEmbeddedDocuments('Tile', [tokenRevealMask.id, sceneRevealMask.id, tokenShapeMask.id]);
                await token.document.unsetFlag('eskie-macros', 'sao-shatter-tiles');
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

            shatterSeq = shatterSeq.animation()
                .delay(250)
                .on(token)
                .opacity(0)
                .show(false)

                .effect()
                .name(label)
                .copySprite(token)
                .tint(tintColor) // Uses the tint applied in the user's token-mask.js edit
                .attachTo(token, {bindAlpha: false, bindVisibility: false, bindRotation: true})
                .scaleToObject(1, { considerTokenScale: true })
                .spriteRotation(-token.document.rotation)
                .mask(tokenRevealMask._object)
                .persist()

                .wait(250)
                .thenDo(async () => {
                    return Promise.all([
                        sceneRevealMask.update({ alpha: 1 }),
                        tokenRevealMask.update({ alpha: 1, video: { autoplay: true } })
                    ]);
                })

                .effect()
                .file(tokenOverlay)
                .attachTo(token, {bindAlpha: false, bindVisibility: false, bindRotation: false})
                .mask(tokenShapeMask._object)
                .rotate(-rotation)
                .scaleToObject(scaleXY)
                .zIndex(1)
                .waitUntilFinished()

                .thenDo(async () => {
                    await Sequencer.EffectManager.endEffects({ name: label });
                    if (deleteToken) {
                        await token.document.delete();
                    } else {
                        await canvas.scene.deleteEmbeddedDocuments('Tile', [tokenRevealMask.id, sceneRevealMask.id, tokenShapeMask.id]);
                        await token.document.unsetFlag('eskie-macros', 'sao-shatter-tiles');
                    }
                });

            shatterSeq.play();
        });

    sequence.play();
}
