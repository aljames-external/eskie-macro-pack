/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    dustBrightness: 0.8,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { dustBrightness } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    if (!tile) return new Sequence();

    // Detect all tokens currently overlapping the trap tile bounds
    const tileX = tile.document?.x ?? tile.x;
    const tileY = tile.document?.y ?? tile.y;
    const tileWidth = tile.document?.width ?? tile.width;
    const tileHeight = tile.document?.height ?? tile.height;

    const tileMinX = tileX;
    const tileMaxX = tileX + tileWidth;
    const tileMinY = tileY;
    const tileMaxY = tileY + tileHeight;

    const finalTargets = canvas.tokens.placeables.filter(t => {
        const tWidth = t.w ?? ((t.document?.width ?? 1) * canvas.grid.size);
        const tHeight = t.h ?? ((t.document?.height ?? 1) * canvas.grid.size);
        const tMinX = t.document?.x ?? t.x;
        const tMaxX = tMinX + tWidth;
        const tMinY = t.document?.y ?? t.y;
        const tMaxY = tMinY + tHeight;

        // Bounding-box intersection check
        return !(tMaxX <= tileMinX || tMinX >= tileMaxX || tMaxY <= tileMinY || tMinY >= tileMaxY);
    });

    const num = Math.floor(Math.random() * 2);
    const mirrorX = Math.random() >= 0.5;
    const mirrorY = Math.random() >= 0.5;

    let seq = new Sequence()
        .canvasPan()
        .shake({ duration: 250, strength: 2, rotation: false })

        // Falling rocks animation
        .effect()
        .file(closest(`jb2a.falling_rocks.top.1x1.grey.${num}`))
        .atLocation(tile)
        .size({ width: tile.document.width * 2.5, height: tile.document.height * 2.5 })
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .fadeOut(500)
        .waitUntilFinished(-4000)

        // Persistent rock rubble on the tile
        .effect()
        .name(`falling-rocks-rubble-${tile.id}`)
        .delay(3500)
        .file(closest(`jb2a.falling_rocks.endframe.top.1x1.grey.${num}`))
        .atLocation(tile)
        .size({ width: tile.document.width * 2.5, height: tile.document.height * 2.5 })
        .belowTokens()
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .fadeOut(500)
        .persist()

        // Impact shockwave
        .effect()
        .file(closest('jb2a.impact.white.0'))
        .atLocation(tile)
        .scaleIn(0, 500, { ease: 'easeOutCubic' })
        .belowTokens()
        .size({ width: tile.document.width * 1.5, height: tile.document.height * 1.5 })
        .opacity(0.5)

        // Dust smoke cloud
        .effect()
        .delay(100)
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(tile)
        .playbackRate(0.65)
        .fadeIn(250)
        .fadeOut(1500)
        .size({ width: tile.document.width * 3, height: tile.document.height * 3 })
        .randomRotation()
        .opacity(0.5)
        .filter('ColorMatrix', { brightness: dustBrightness })
        .zIndex(4)

        .canvasPan()
        .delay(200)
        .shake({ duration: 500, strength: 2, rotation: false });

    if (finalTargets.length > 0) {
        finalTargets.forEach(target => {
            const targetName = target.name || target.document?.name || 'Token';
            const buryEffectName = `falling-rocks-buried-${target.id}`;

            seq = seq
                // Persistent copy sprite under rocks
                .effect()
                .name(buryEffectName)
                .copySprite(target)
                .spriteRotation(-(target.document?.rotation ?? target.rotation ?? 0))
                .attachTo(target, { bindAlpha: false })
                .scaleToObject(1, { considerTokenScale: true })
                .persist()
                .private()
                .belowTokens()

                .wait(500)

                // Hide the actual token document
                .animation()
                .on(target)
                .opacity(0)

                // Rock endframe covering the target
                .effect()
                .delay(3500)
                .name(buryEffectName)
                .file(closest(`jb2a.falling_rocks.endframe.top.1x1.grey.${num}`))
                .spriteRotation(-(target.document?.rotation ?? target.rotation ?? 0))
                .attachTo(target, { bindAlpha: false })
                .size({ width: tile.document.width * 2.5, height: tile.document.height * 2.5 })
                .mirrorX(mirrorX)
                .mirrorY(mirrorY)
                .fadeOut(500)
                .belowTokens()
                .persist()
                .waitUntilFinished()

                // Clean up buried target visual effects
                .thenDo(function () {
                    Sequencer.EffectManager.endEffects({ name: buryEffectName, object: target });
                })

                // Restore token opacity
                .animation()
                .on(target)
                .opacity(1);
        });
    }

    return seq;
}

async function play(tile, targets, config = {}) {
    config = settingsOverride(config);
    const seq = await create(tile, targets, config);
    return seq.play();
}

async function stop(tile, config = {}) {
    // Clear rock rubble on tile
    await Sequencer.EffectManager.endEffects({ name: `falling-rocks-rubble-${tile.id}` });
}

async function setup(config = {}) {
    return matt.trap.setup('eskie.traps.fallingRocks', config);
}

export const fallingRocks = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
