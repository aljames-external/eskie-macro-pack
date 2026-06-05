/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';

const DEFAULT_CONFIG = {
    reveal: true,
    smokeSize: 2,
    startScale: 3,
    fallenScale: 0.3,
    randomDelay: 2000,
    color: 'orange',
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { reveal, smokeSize, startScale, fallenScale, randomDelay, color } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });

    // Target selection:
    // 1. Look for tokens on target tiles
    // 2. Look for tokens on the trap tile itself
    // 3. Fallback to targets passed (triggering tokens)
    const targetTileIds = tile.document?.getFlag(MODULE_ID, 'trap.trapTargetTileIds') || [];
    let finalTargets = [];

    if (targetTileIds.length > 0) {
        targetTileIds.forEach(id => {
            const targetTile = canvas.tiles.get(id);
            if (targetTile) {
                const tileX = targetTile.document?.x ?? targetTile.x;
                const tileY = targetTile.document?.y ?? targetTile.y;
                const tileWidth = targetTile.document?.width ?? targetTile.width;
                const tileHeight = targetTile.document?.height ?? targetTile.height;

                const tMinX = tileX;
                const tMaxX = tileX + tileWidth;
                const tMinY = tileY;
                const tMaxY = tileY + tileHeight;

                const tokens = canvas.tokens.placeables.filter(t => {
                    const w = (t.document?.width ?? t.width ?? 1) * canvas.grid.size;
                    const h = (t.document?.height ?? t.height ?? 1) * canvas.grid.size;
                    const tx = t.document?.x ?? t.x;
                    const ty = t.document?.y ?? t.y;
                    return !(tx + w <= tMinX || tx >= tMaxX || ty + h <= tMinY || ty >= tMaxY);
                });
                finalTargets.push(...tokens);
            }
        });
    }

    if (finalTargets.length === 0) {
        const tileX = tile.document?.x ?? tile.x;
        const tileY = tile.document?.y ?? tile.y;
        const tileWidth = tile.document?.width ?? tile.width;
        const tileHeight = tile.document?.height ?? tile.height;

        const tMinX = tileX;
        const tMaxX = tileX + tileWidth;
        const tMinY = tileY;
        const tMaxY = tileY + tileHeight;

        finalTargets = canvas.tokens.placeables.filter(t => {
            const w = (t.document?.width ?? t.width ?? 1) * canvas.grid.size;
            const h = (t.document?.height ?? t.height ?? 1) * canvas.grid.size;
            const tx = t.document?.x ?? t.x;
            const ty = t.document?.y ?? t.y;
            return !(tx + w <= tMinX || tx >= tMaxX || ty + h <= tMinY || ty >= tMaxY);
        });
    }

    finalTargets = Array.from(new Set(finalTargets));

    if (finalTargets.length === 0 && targets && targets.length > 0) finalTargets = targets;

    let seq = new Sequence();

    if (reveal) {
        seq = seq
            .animation()
            .on(tile)
            .show()
            .opacity(1);
    }

    if (finalTargets.length > 0) {
        finalTargets.forEach(target => {
            const targetWidth = target.document?.width ?? target.width ?? 1;
            const targetHeight = target.document?.height ?? target.height ?? 1;
            const staggerDelay = Math.random() * (randomDelay);

            const targetSeq = new Sequence()
                // Hide the actual token at the start of fall
                .animation()
                .delay(staggerDelay)
                .on(target)
                .opacity(0)
                .show(true)
                .waitUntilFinished()

                // Mini copy sprite representing the token falling from high in the sky toward the ground
                .effect()
                .copySprite(target)
                .attachTo(target, { offset: { y: -0.4 * targetWidth }, gridUnits: true, bindAlpha: false })
                .scaleToObject(fallenScale, { considerTokenScale: false })
                .scaleIn(0, 500, { ease: 'easeOutBack' })
                .spriteRotation(-target.document.rotation)
                .opacity(0.9)
                .aboveLighting()
                .zIndex(1)
                .duration(1000)

                // Show the "extremely far away" pin for the first 1s
                .effect()
                .file(closest('icons/pings/chevron.webp'))
                .attachTo(target, { offset: { y: -0.4 * targetWidth + 0.2 * targetWidth }, gridUnits: true, bindAlpha: false })
                .scaleToObject(0.25, { considerTokenScale: false })
                .scaleIn(0, 250, { ease: 'easeOutBack' })
                .loopProperty('sprite', 'position.y', { from: 0, to: 0.025, duration: 500, pingPong: true, gridUnits: true, ease: 'easeInSine' })
                .tint(game.user?.color?.css ?? '#ffffff')
                .opacity(0.9)
                .duration(1000)
                .waitUntilFinished()

                // Copy sprite falls from the sky
                .effect()
                .copySprite(target)
                .attachTo(target, { bindAlpha: false })
                .scaleToObject(1, { considerTokenScale: true })
                .scaleIn(startScale, 1000, { ease: 'easeInQuad' })
                .spriteRotation(-target.document.rotation)
                .fadeIn(250)
                .duration(1000)
                .waitUntilFinished()

                // Smoke puff when landing
                .effect()
                .file(closest('jb2a.smoke.puff.ring.01.white'))
                .atLocation(target)
                .size({ width: targetWidth * smokeSize * canvas.grid.size, height: targetHeight * smokeSize * canvas.grid.size })
                .opacity(0.8)
                .belowTokens()

                // Ground crack impact
                .effect()
                .file(closest(`jb2a.impact.ground_crack.${color}.02`))
                .atLocation(target)
                .size({ width: targetWidth * 2 * canvas.grid.size, height: targetHeight * 2 * canvas.grid.size })
                .belowTokens()

                // Ground crack still frame
                .effect()
                .file(closest('jb2a.impact.ground_crack.still_frame.02'))
                .atLocation(target)
                .size({ width: targetWidth * 2 * canvas.grid.size, height: targetHeight * 2 * canvas.grid.size })
                .belowTokens()
                .fadeOut(1000)
                .duration(5000)

                // Restore token opacity
                .animation()
                .on(target)
                .opacity(1);

            seq = seq.thenDo(async () => {
                targetSeq.play();
            });
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
    await new Sequence()
        .animation()
        .on(tile)
        .fadeOut(1000)
        .opacity(0)
        .play();
}

async function setup(config = {}) {
    return matt.trap.setup('eskie.traps.fallingSky', config);
}

export const fallingSky = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
