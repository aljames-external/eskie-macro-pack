// Standalone Macro: Sword Art Online Death
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn('Please select a token!');

const id = 'swordArtOnlineShatter';
const label = `${id} - ${token.id}`;

// Check if effect is already playing
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;

if (isPlaying) {
    new Sequence().animation().on(token).opacity(1).show(true).play();
    Sequencer.EffectManager.endEffects({ name: label });
} else {
    const tintColor = '#00FFFF';
    const duration = 1000;
    const shatterColor = 'blue';
    const deleteToken = false;
    const center = true;
    const rotation = 0;

    const tokenOverlay = `eskie.wounds.token_mask.shatter.${center ? 'center' : 'side'}.01.${shatterColor}.no_base`;
    const revealOverlay = `eskie.texture_mask.tile_base.shatter.${center ? 'center' : 'side'}.01`;
    
    let revealOverlayPath = revealOverlay;
    try { 
        revealOverlayPath = Sequencer.Database.getEntry(revealOverlay).originalData; 
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

            // Attach to token (requires Token Attacher module)
            if (typeof tokenAttacher !== 'undefined') {
                await tokenAttacher.attachElementsToToken([tokenRevealMask, sceneRevealMask, tokenShapeMask], token, true);
            }

            // Wait for tiles to load and render
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            while (!(tokenRevealMask?._object?.sourceElement && sceneRevealMask?._object?.sourceElement)) {
                await sleep(100);
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
                    .mask(sceneRevealMask)
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
                .mask(tokenRevealMask)
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
                .mask(tokenShapeMask)
                .rotate(-rotation)
                .scaleToObject(scaleXY)
                .zIndex(1)
                .waitUntilFinished()

                .thenDo(async () => {
                    if (deleteToken) {
                        await token.document.delete();
                    } else {
                        await canvas.scene.deleteEmbeddedDocuments('Tile', [tokenRevealMask.id, sceneRevealMask.id, tokenShapeMask.id]);
                    }
                    await Sequencer.EffectManager.endEffects({ name: label });
                });

            shatterSeq.play();
        });

    sequence.play();
}
