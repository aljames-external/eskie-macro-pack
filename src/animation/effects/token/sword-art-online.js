import { shatterMask } from '../token-mask/shatter-mask.js';
import { settingsOverride } from "../../../lib/settings.js";
import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    id: 'swordArtOnlineShatter',
    tintColor: '#00BFFF',
    duration: 600,
    shatterColor: 'blue',
    deleteObject: false,
    sound: {
        enabled: false,
        volume: 0.3,
        file: "SAO/sfx/saoexplo.mp3",   // Replace this with a file in some asset library (PSFX, etc)
    }
};

async function create(source, config = {}) {
    config = settingsOverride(config);
    const { id, tintColor, duration, shatterColor, deleteObject, sound } =
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
                deleteObject,
                callback: {
                    tokenOverlay: colorMatrix
                },
                overlay: {
                    token: "eskie.texture_mask.tile_base.shatter.center.01",
                    reveal: "eskie.texture_mask.tile_base.shatter.center.01",
                }
            });

            if (particleSeq && shatterSeq) return particleSeq.addSequence(shatterSeq).play();
        });

    return sequence;
}

async function play(source, config = {}) {
    const sequence = await create(source, config);
    if (sequence) return sequence.play();
}

async function stop(source, config = {}) {
    const { id, shatterColor, deleteObject } =
        foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    const label = `${id}-${source.id}`;

    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: label }),
        shatterMask.stop(source, { id, color: shatterColor, deleteObject })
    ]);
}

export const swordArtOnlineDeath = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};
