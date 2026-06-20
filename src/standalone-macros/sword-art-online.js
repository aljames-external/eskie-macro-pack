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

const eskieModule = game.modules.get('eskie-macros');

// Configuration
const tintColor = '#00FFFF';
const duration = 1000;
const shatterColor = 'blue';
const deleteToken = false;
const center = true;
const rotation = 0;

const config = {
    tintColor,
    duration,
    shatterColor,
    deleteToken,
    center,
    rotation
};

if (eskieModule?.socketlib) {
    const isPlaying = token.document.getFlag('eskie-macros', 'sao-shatter-tiles') !== undefined;
    if (isPlaying) {
        await eskie.effect.swordArtOnlineDeath.stop(token, config);
    } else {
        await eskie.effect.swordArtOnlineDeath.play(token, config);
    }
} else {
    // Fallback for standalone use without the module active (executes locally on this client only)
    const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;

    if (isPlaying) {
        new Sequence().animation().on(token).opacity(1).show(true).play({ remote: false });
        Sequencer.EffectManager.endEffects({ name: label });
        
        const orphanedTileIds = token.document.getFlag('eskie-macros', 'sao-shatter-tiles');
        if (orphanedTileIds) {
            await canvas.scene.deleteEmbeddedDocuments('Tile', orphanedTileIds);
            await token.document.unsetFlag('eskie-macros', 'sao-shatter-tiles');
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
                    'alpha': 0,
                    'hidden': false,
                    'x': token.x,
                    'y': token.y,
                    'rotation': token.document.rotation,
                    'width': canvas.grid.size * token.document.width,
                    'height': canvas.grid.size * token.document.height,
                };

                const tiles = await canvas.scene.createEmbeddedDocuments('Tile', [overlayMaskUpdates, overlayMaskUpdates, tokenMaskUpdates]);
                const tokenRevealMask = canvas.scene.tiles.get(tiles[0].id);
                const sceneRevealMask = canvas.scene.tiles.get(tiles[1].id);
                const tokenShapeMask = canvas.scene.tiles.get(tiles[2].id);

                await token.document.setFlag('eskie-macros', 'sao-shatter-tiles', [tokenRevealMask.id, sceneRevealMask.id, tokenShapeMask.id]);

                if (typeof tokenAttacher !== 'undefined') {
                    await tokenAttacher.attachElementsToToken([tokenRevealMask, sceneRevealMask, tokenShapeMask], token, true);
                }

                const sleep = (ms) => new Promise(r => setTimeout(r, ms));
                let retries = 0;
                const maxRetries = 50;
                while (!(tokenRevealMask?._object?.sourceElement && sceneRevealMask?._object?.sourceElement && tokenShapeMask?._object?.mesh) && retries < maxRetries) {
                    await sleep(100);
                    retries++;
                }
                if (retries >= maxRetries) {
                    await canvas.scene.deleteEmbeddedDocuments('Tile', [tokenRevealMask.id, sceneRevealMask.id, tokenShapeMask.id]);
                    await token.document.unsetFlag('eskie-macros', 'sao-shatter-tiles');
                    return ui.notifications.error("Failed to load SAO shatter video elements in time!");
                }

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
                        tokenRevealMask._object.visible = false;
                        sceneRevealMask._object.visible = false;
                        tokenShapeMask._object.visible = false;

                        await Sequencer.EffectManager.endEffects({ name: label });
                        await sleep(1000);

                        if (deleteToken) {
                            await token.document.delete();
                        } else {
                            await canvas.scene.deleteEmbeddedDocuments('Tile', [tokenRevealMask.id, sceneRevealMask.id, tokenShapeMask.id]);
                            await token.document.unsetFlag('eskie-macros', 'sao-shatter-tiles');
                        }
                    });

                shatterSeq.play({ remote: false });
            });

        sequence.play({ remote: false });
    }
}
