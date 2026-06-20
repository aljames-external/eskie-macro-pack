import { shatterMask } from '../token-mask/shatter-mask.js';

const DEFAULT_CONFIG = {
    id: 'swordArtOnlineShatter',
    tintColor: '#00FFFF',
    duration: 1000,
    shatterColor: 'blue',
    deleteToken: false
};

async function create(source, config = {}) {
    const { tintColor, duration, shatterColor, deleteToken, tileIds, localOnly, initiatorUserId, ...rest } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    let sequence = new Sequence()
        .animation()
        .on(source)
        .tint(tintColor)
        .fadeIn(duration)
        .duration(duration)
        .waitUntilFinished()
        .thenDo(async () => {
            const shatterSeq = await shatterMask.create(source, { 
                color: shatterColor, 
                tint: tintColor, 
                deleteToken,
                tileIds,
                localOnly,
                initiatorUserId,
                ...rest
            });
            if (shatterSeq) return shatterSeq.play({ remote: false });
        });

    return sequence;
}

async function play(token, config = {}) {
    const eskieModule = game.modules.get('eskie-macros');
    
    console.log("Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Triggered:", {
        tokenName: token.name,
        tokenId: token.id,
        localOnly: config.localOnly,
        isGM: game.user.isGM,
        config
    });

    if (eskieModule?.socketlib && !config.localOnly) {
        const center = true;
        const rotation = 0;
        const shatterColor = config.shatterColor || DEFAULT_CONFIG.shatterColor;
        const duration = config.duration || DEFAULT_CONFIG.duration;
        const deleteToken = config.deleteToken || DEFAULT_CONFIG.deleteToken;
        const revealOverlay = `eskie.texture_mask.tile_base.shatter.${center ? 'center' : 'side'}.01`;
        const tokenOverlay = `eskie.wounds.token_mask.shatter.${center ? 'center' : 'side'}.01.${shatterColor}.no_base`;

        // Pre-resolve tokenOverlayPath on the initiator client
        const tokenOverlayConfig = eskie.util.file.closest(tokenOverlay);
        let tokenOverlayPath = tokenOverlayConfig;
        try {
            const entry = Sequencer.Database.getEntry(tokenOverlayConfig, { softFail: true });
            tokenOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || tokenOverlayConfig);
        } catch (e) {}
        console.log("Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Pre-resolved tokenOverlayPath on initiator:", tokenOverlayPath);

        // Create the tiles (using the GM-socketed tile creation)
        const { createTiles } = await import('../token-mask/token-mask.js');
        const tiles = await createTiles(token, { revealOverlay, rotation });
        const tileIds = tiles.map(t => t.id);
        console.log("Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Pre-created tiles on initiator:", tileIds);

        // Store tile IDs on the token flag
        await eskie.util.token.edit(token.id, { "flags.eskie-macros.sao-shatter-tiles": tileIds });

        // Attach to token
        if (typeof tokenAttacher !== 'undefined') {
            await tokenAttacher.attachElementsToToken(tiles, token, true);
        }

        // Initialize completion tracker on initiator client
        globalThis.eskie = globalThis.eskie || {};
        globalThis.eskie.saoShatterTracker = globalThis.eskie.saoShatterTracker || new Map();
        
        const activeUserIds = game.users.filter(u => u.active).map(u => u.id);
        console.log("Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Initializing tracker. Active users expected to report completion:", activeUserIds);
        
        globalThis.eskie.saoShatterTracker.set(token.id, {
            expected: new Set(activeUserIds),
            received: new Set(),
            tileIds: tileIds,
            deleteToken: deleteToken,
            timeoutId: setTimeout(async () => {
                const tracker = globalThis.eskie.saoShatterTracker.get(token.id);
                if (tracker) {
                    console.warn(`Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Tracker TIMEOUT hit for token ${token.id}! Deleting tiles now.`);
                    globalThis.eskie.saoShatterTracker.delete(token.id);
                    await Promise.all(tracker.tileIds.map(tileId => eskie.util.tile.destroy(tileId)));
                    await eskie.util.token.edit(token.id, { "flags.eskie-macros.-=sao-shatter-tiles": null });
                }
            }, duration + 5000)
        });

        // Trigger execution on everyone's client
        console.log("Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Broadcasting playSaoShatterLocal socket call to everyone.");
        await eskieModule.socketlib.executeForEveryone('playSaoShatterLocal', token.id, tileIds, game.user.id, {
            ...config,
            tokenOverlayPath
        });
        return;
    }

    const sequence = await create(token, config);
    if (sequence) {
        if (config.localOnly) {
            console.log("Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Starting local sequence execution.");
            return sequence.play({ remote: false });
        }
        console.log("Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Starting standard sequence execution.");
        return sequence.play();
    }
}

async function stop(token, config = {}) {
    const eskieModule = game.modules.get('eskie-macros');
    if (eskieModule?.socketlib && !config.localOnly) {
        const orphanedTileIds = token.document.getFlag('eskie-macros', 'sao-shatter-tiles');
        if (orphanedTileIds) {
            await eskieModule.socketlib.executeForEveryone('playSaoShatterLocal', token.id, orphanedTileIds, game.user.id, {
                ...config,
                toggleOff: true
            });
        }
        return;
    }

    const { shatterColor, deleteToken } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    return shatterMask.stop(token, { color: shatterColor, deleteToken });
}

export const swordArtOnlineDeath = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};
