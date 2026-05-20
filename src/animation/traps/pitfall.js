/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    reveal: true,
    smokeSize: 2,
    fallenScale: 0.3,
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { reveal, smokeSize, fallenScale } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Target all tokens currently standing on the trap tile, falling back to triggering targets
    const tileX = tile.document?.x ?? tile.x;
    const tileY = tile.document?.y ?? tile.y;
    const tileWidth = tile.document?.width ?? tile.width;
    const tileHeight = tile.document?.height ?? tile.height;

    const minX = tileX;
    const maxX = tileX + tileWidth;
    const minY = tileY;
    const maxY = tileY + tileHeight;

    const tokensOnTile = canvas.tokens.placeables.filter(t => {
        const center = t.center;
        return center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY;
    });

    const finalTargets = tokensOnTile.length ? tokensOnTile : targets;

    let seq = new Sequence()
        // Dust puff when trap opens
        .effect()
        .file(closest('jb2a.smoke.puff.ring.01.white.1'))
        .atLocation(tile)
        .opacity(1)
        .size({ width: tile.width * smokeSize, height: tile.height * smokeSize })
        .belowTokens();

    if (reveal) {
        seq = seq
            .animation()
            .on(tile)
            .show()
            .opacity(1);
    }

    if (finalTargets.length > 0) {
        finalTargets.forEach(target => {
            const targetName = target.name || target.document?.name || 'Token';
            const targetWidth = target.document?.width ?? target.width ?? 1;
            const targetHeight = target.document?.height ?? target.height ?? 1;
            const fallenEffectName = `pitfall-fallen-${target.id}`;

            seq = seq
                // Visual transition representing token falling down
                .effect()
                .copySprite(target)
                .attachTo(target, { bindAlpha: false })
                .scaleToObject(1, { considerTokenScale: true })
                .fadeOut(750, { ease: 'easeOutCubic' })
                .duration(1500)
                .scaleOut(0, 1000, { ease: 'easeOutCubic' })
                .opacity(1)

                // Hide the actual token
                .animation()
                .delay(200)
                .on(target)
                .opacity(0)

                .wait(1500)

                // Mini copy sprite representing the token sitting at the bottom of the pit
                .effect()
                .name(fallenEffectName)
                .copySprite(target)
                .attachTo(target, { offset: { y: -0.4 * targetWidth }, gridUnits: true, bindAlpha: false })
                .scaleToObject(fallenScale, { considerTokenScale: false })
                .scaleIn(0, 500, { ease: 'easeOutBack' })
                .opacity(0.9)
                .aboveLighting()
                .persist()
                .zIndex(1)

                // Bouncing chevron pointer showing token location down in the pit
                .effect()
                .name(fallenEffectName)
                .file(closest('icons/pings/chevron.webp'))
                .attachTo(target, { offset: { y: -0.4 * targetWidth + 0.2 * targetWidth }, gridUnits: true, bindAlpha: false })
                .scaleToObject(0.25, { considerTokenScale: false })
                .scaleIn(0, 500, { ease: 'easeOutBack' })
                .loopProperty('sprite', 'position.y', { from: 0, to: 0.025, duration: 1500, pingPong: true, gridUnits: true, ease: 'easeInSine' })
                .tint(game.user?.color?.css ?? '#ffffff')
                .opacity(0.9)
                .aboveLighting()
                .persist()
                .waitUntilFinished()

                // End visual effects and restore token opacity
                .thenDo(function () {
                    Sequencer.EffectManager.endEffects({ name: fallenEffectName, object: target });
                })

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
    // Reset/hide the pit tile
    await new Sequence()
        .animation()
        .on(tile)
        .fadeOut(1000)
        .opacity(0)
        .play();
}

async function setup(config = {}) {
    return matt.trap.setup('eskie.traps.pitfall', config);
}

export const pitfall = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
