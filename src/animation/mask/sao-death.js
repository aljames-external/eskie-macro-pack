import { shatterMask } from './shatter-mask.js';
import { settingsOverride } from "../../lib/settings.js";
import { closest } from "../../lib/filemanager.js";
import { socket } from "../../integration/socketlib.js";
import { log } from "../../lib/logger.js";
import { getDocumentName } from "../../lib/object.js";

const DEFAULT_CONFIG = {
    id: 'swordArtOnlineShatter',
    tintColor: '#00BFFF',
    duration: 600,
    shatterColor: 'blue',
    deleteObject: false,
    sound: {
        enabled: false,
        volume: 0.2,
        file: "SAO/sfx/saoexplo.mp3",   // Replace this with a file in some asset library (PSFX, etc)
    }
};

async function create(object, config = {}) {
    config = settingsOverride(config);
    const { id, tintColor, duration, shatterColor, deleteObject, sound } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id}-${object.id}`;

    let sequence = new Sequence();
    if (sound.enabled) {
        sequence = sequence.sound()
            .file(closest(sound.file))
            .volume(sound.volume)
            .fadeInAudio(50)
            .fadeOutAudio(500);
    }

    const widthAdjustment = (getDocumentName(object) === 'Token') ? canvas.grid.size : 1;
    const [visibleTile] = await socket.tile.create({
        "texture.src": null,
        "alpha": 1,                // Alphe must be 1 or else the animation will not render
        "hidden": false,
        "x": object.x,
        "y": object.y,
        "width": object.document.width * widthAdjustment,
        "height": object.document.height * widthAdjustment,
        "rotation": object.document.rotation,
        "overhead": true,
    }, { waitForPlayers: true });

    sequence = sequence
        // 🔵 Aura AVANT shatter
        .effect()
        .file(closest("jaamod.spells_effects.antilife_shell"))
        .attachTo(visibleTile)
        .scaleToObject(1.1)
        .opacity(1)
        .filter("ColorMatrix", {
            hue: 510,
            saturate: 1.2,
            brightness: 15
        })
        .fadeIn(duration)
        .belowTokens(false)
        .name(label)
        .persist()

        // 🎨 Tint token
        .animation()
        .on(object)
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
                .atLocation(visibleTile)        // 🔥 important
                .size({
                    width: object.document.width * 2.5,
                    height: object.document.height * 2.5
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
                .belowTokens(true)

                .effect()
                .file(closest("jb2a.markers.circle_of_stars.blue"))
                .size({
                    width: object.document.width * 1.8,
                    height: object.document.height * 1.8
                }, { gridUnits: true })
                .delay(1050)
                .fadeIn(600)
                .scaleIn(0.1, 400)
                .fadeOut(600)
                .duration(1800)
                .atLocation(object)        // 🔥 important
                .filter("Glow", {
                    distance: 1,      // Number, distance of the glow in pixels
                    outerStrength: 1,  // Number, strength of the glow outward from the edge of the sprite
                    innerStrength: 0,  // Number, strength of the glow inward from the edge of the sprite
                    color: 0x1FFFA3,   // Hexadecimal, color of the glow
                    quality: 0.1,      // Number, describes the quality of the glow (0 to 1) - the higher the number the less performant
                    knockout: false    // Boolean, toggle to hide the contents and only show glow (effectively hides the sprite)
                })
                .belowTokens(false);

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
            const shatterSeq = await shatterMask.create(object, {
                id,
                color: shatterColor,
                tint: tintColor,
                deleteObject,
                callback: {
                    tokenOverlay: colorMatrix
                },
                overlay: {
                    token: "eskie.texture_mask.tile_base.shatter.center.01",
                    reveal: "eskie.texture_mask.tile_base.shatter.center.01",
                }
            });

            if (!particleSeq || !shatterSeq) return log.error("tokenMaskEffect.createLocal: Failed to create particle or shatter sequence.");
            particleSeq.addSequence(shatterSeq)
                .thenDo(async () => {
                    // Clean up the antilife shell tile after shatter animation
                    log.debug(visibleTile);
                    log.debug(visibleTile.id);
                    await socket.tile.destroy(visibleTile.id);
                }).play();
        });

    return sequence;
}

async function play(object, config = {}) {
    const sequence = await create(object, config);
    if (sequence) return sequence.play();
}

async function stop(object, config = {}) {
    const { id, shatterColor, deleteObject } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id}-${object.id}`;

    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: label }),
        shatterMask.stop(object, { id, color: shatterColor, deleteObject })
    ]);
}

export const saoDeath = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};
