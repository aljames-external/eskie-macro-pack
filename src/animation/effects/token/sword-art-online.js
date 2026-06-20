import { shatterMask } from '../token-mask/shatter-mask.js';
import { settingsOverride } from "../../../lib/settings.js";
import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'swordArtOnlineShatter',
    tintColor: '#00BFFF',
    duration: 600,
    shatterColor: 'blue',
    deleteToken: false,
    sound: {
        enabled: false,
        volume: 0.3,
        file: "SAO/sfx/saoexplo.mp3",   // Replace this with a file in some asset library (PSFX, etc)
    }
};

async function create(source, config = {}) {
    config = settingsOverride(config);
    const { id, tintColor, duration, shatterColor, deleteToken, sound, ...rest } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id}-${source.id}`;

    let sequence = new Sequence();
    if (sound.enabled) {
        sequence = sequence.sound()
            .file(sound.file)
            .volume(sound.volume)
            .fadeInAudio(50)
            .fadeOutAudio(500);
    }

    sequence = sequence
        // 🔵 Aura AVANT shatter
        .effect()
        .file(closest("jaamod.spells_effects.antilife_shell"))
        .attachTo(source)
        .scaleToObject(1.1)
        .opacity(0.15)
        .filter("ColorMatrix", {
            hue: 510,
            saturate: 1.2,
            brightness: 15
        })
        .fadeIn(duration)
        .belowTokens(true)
        .name(label)
        .persist()

        // 🎨 Tint token
        .animation()
        .on(source)
        .tint(tintColor)
        .fadeIn(duration)
        .duration(duration)

        .waitUntilFinished()

        // 💥 SHATTER + PARTICULES
        .thenDo(async () => {
            // 💥 particules synchronisées
            let particleSeq = new Sequence()
                .effect()
                .file(closest("eskie.particle.05.blue"))
                .delay(950)
                .atLocation(source.center)        // 🔥 important
                .size({
                    width: source.document.width * 2.5,
                    height: source.document.height * 2.5
                }, { gridUnits: true })
                .playbackRate(0.5)
                .filter("Glow", {
                    distance: 1,      // Number, distance of the glow in pixels
                    outerStrength: 2,  // Number, strength of the glow outward from the edge of the sprite
                    innerStrength: 0,  // Number, strength of the glow inward from the edge of the sprite
                    color: 0x1FFFA3,   // Hexadecimal, color of the glow
                    quality: 0.1,      // Number, describes the quality of the glow (0 to 1) - the higher the number the less performant
                    knockout: false    // Boolean, toggle to hide the contents and only show glow (effectively hides the sprite)
                })
                .belowTokens(true);

            // Token Overlay colorMatrix for shatter mask
            function colorMatrix(seq) {
                return seq.tint('#03e8fc')
                    .filter("ColorMatrix", { brightness: 1.5 })
                    .filter("Glow", {
                        distance: 8,
                        outerStrength: 4,
                        innerStrength: 0,
                        color: 0x1FFFA3,
                        quality: 0.1,
                        knockout: false
                    });
            }
            // Shatter Mask sequence
            const shatterSeq = await shatterMask.create(source, {
                id,
                color: shatterColor,
                tint: tintColor,
                deleteToken,
                callback: {
                    tokenOverlay: colorMatrix
                },
                overlay: {
                    token: "eskie.texture_mask.tile_base.shatter.center.01",
                    reveal: "eskie.texture_mask.tile_base.shatter.center.01",
                },
                ...rest
            });

            if (particleSeq && shatterSeq) return particleSeq.addSequence(shatterSeq).play();
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

        // Generate a unique session ID for this animation run
        const animationId = randomID();

        // Pre-resolve tokenOverlayPath on the initiator client
        const tokenOverlayConfig = eskie.util.file.closest(tokenOverlay);
        let tokenOverlayPath = tokenOverlayConfig;
        try {
            const entry = Sequencer.Database.getEntry(tokenOverlayConfig, { softFail: true });
            tokenOverlayPath = (typeof entry === 'string') ? entry : (entry?.file || entry?.files?.[0] || tokenOverlayConfig);
        } catch (e) {}
        console.log(`Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Pre-resolved tokenOverlayPath on initiator (Session: ${animationId}):`, tokenOverlayPath);

        // Create the tiles (using the GM-socketed tile creation)
        const { createTiles } = await import('../token-mask/token-mask.js');
        const tiles = await createTiles(token, { revealOverlay, rotation });
        const tileIds = tiles.map(t => t.id);
        console.log(`Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Pre-created tiles on initiator (Session: ${animationId}):`, tileIds);

        // Store tile IDs on the token flag under the unique animationId key
        await eskie.util.token.edit(token.id, { [`flags.eskie-macros.sao-shatters.${animationId}`]: tileIds });

        // Attach to token
        if (typeof tokenAttacher !== 'undefined') {
            await tokenAttacher.attachElementsToToken(tiles, token, true);
        }

        // Initialize completion tracker on initiator client keyed by animationId
        globalThis.eskie = globalThis.eskie || {};
        globalThis.eskie.saoShatterTracker = globalThis.eskie.saoShatterTracker || new Map();
        
        const activeUserIds = game.users.filter(u => u.active).map(u => u.id);
        console.log(`Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Initializing tracker (Session: ${animationId}). Expected users:`, activeUserIds);
        
        globalThis.eskie.saoShatterTracker.set(animationId, {
            expected: new Set(activeUserIds),
            received: new Set(),
            tileIds: tileIds,
            deleteToken: deleteToken,
            timeoutId: setTimeout(async () => {
                const tracker = globalThis.eskie.saoShatterTracker.get(animationId);
                if (tracker) {
                    console.warn(`Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Tracker TIMEOUT hit for token ${token.id} (Session: ${animationId})! Cleaning up.`);
                    globalThis.eskie.saoShatterTracker.delete(animationId);
                    const { token: tokenUtil } = await import('../../integration/socketlib/token.js');
                    await tokenUtil.cleanUpSaoShatter(token.id, animationId, tracker.tileIds, tracker.deleteToken);
                }
            }, duration + 8000)
        });

        // Trigger execution on everyone's client
        console.log(`Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Broadcasting playSaoShatterLocal (Session: ${animationId}) to everyone.`);
        await eskieModule.socketlib.executeForEveryone('playSaoShatterLocal', token.id, tileIds, game.user.id, {
            ...config,
            tokenOverlayPath,
            animationId
        });
        return;
    }

    const sequence = await create(token, config);
    if (sequence) {
        if (config.localOnly) {
            console.log(`Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Starting local sequence execution (Session: ${config.animationId}).`);
            return sequence.play({ remote: false });
        }
        console.log("Eskie Macros | SAO Shatter | swordArtOnlineDeath.play | Starting standard sequence execution.");
        return sequence.play();
    }
}

async function stop(token, config = {}) {
    const eskieModule = game.modules.get('eskie-macros');
    if (eskieModule?.socketlib && !config.localOnly) {
        // Stop all active animation sessions currently registered on this token
        const shatters = token.document.getFlag('eskie-macros', 'sao-shatters') || {};
        const activeAnimationIds = Object.keys(shatters);
        if (activeAnimationIds.length > 0) {
            console.log(`Eskie Macros | SAO Shatter | swordArtOnlineDeath.stop | Requesting stop for all active shatters:`, activeAnimationIds);
            for (const [animationId, tileIds] of Object.entries(shatters)) {
                await eskieModule.socketlib.executeForEveryone('playSaoShatterLocal', token.id, tileIds, game.user.id, {
                    ...config,
                    toggleOff: true,
                    animationId
                });
            }
        }
        return;
    }

    const { id, shatterColor, deleteToken, ...rest } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id}-${token.id}`;

    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: label }),
        shatterMask.stop(token, { id, color: shatterColor, deleteToken, ...rest })
    ]);
}

export const swordArtOnlineDeath = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};