/* **
    Last Updated: 08/01/2026
    Author: EskieMoh#2969, GordoZilla
    Modularized by: bakanabaka
** */

import { closest } from '../../../lib/filemanager.js';
import { templates } from '../../../lib/templates.js';
import { socket } from '../../../integration/socketlib.js';
import { settingsOverride } from '../../../lib/settings.js';
import { autoanimations } from '../../../integration/autoanimations.js';


const DEFAULT_CONFIG = {
    id: 'blastLock',
    radius: 3, // in grid units
    sound: {
        enabled: true,
        volume: 0.5,
        file: `psfx.cantrips.thunderclap.v1`,
    },
    crosshair: {
        label: "Blast Lock: Select Door",
        icon: "icons/svg/padlock.svg"
    },
    deleteTemplate: true,
};

/**
 * Finds the first locked door within a given radius of a position.
 * @param {object} position - The position to search from, with x and y coordinates.
 * @param {number} aoeDistance - The search radius in grid units.
 * @returns {Wall} The found Wall object, or undefined.
 */
function findLockedDoor(position, radius) {
    const radiusPx = (radius / canvas.scene.grid.distance) * canvas.grid.size;

    // Look for the first locked door within radius
    const lockedDoor = canvas.walls.placeables.find(wall => {
        const isDoor = wall.document.door > 0;
        const isLocked = wall.document.ds > 0;

        if (!isDoor || !isLocked) return false;

        const dist = Math.hypot(wall.center.x - position.x, wall.center.y - position.y);
        return dist <= radiusPx;
    });

    return lockedDoor;
}

/**
 * Creates the Blast Lock effect sequence.
 *
 * @param {Token} token The token using the ability.
 * @param {object} [config={}] Configuration for the effect.
 * @returns {Promise<Sequence|null>} A promise that resolves with the Sequence object, or null if the creation fails.
 */
async function create(token, config = {}) {
    config = settingsOverride(config);
    const { id, template, crosshair, radius, sound } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});

    // Define Safe Elevation (Token height + 10)
    const safeElevation = (token.document.elevation || 0) + 10;

    // 1. Select location with Crosshair
    let position = await templates.getPosition(template, crosshair);
    if (!position || position.cancelled ) { return null; }

    // 2. Door Detection Logic
    const lockedDoor = findLockedDoor(position, radius);
    eskie.lockedDoor = lockedDoor;
    if (lockedDoor) { position = { x: lockedDoor.center.x, y: lockedDoor.center.y }; }

    let effectSize = 0.25;
    const width = lockedDoor?.hitArea ? lockedDoor?.hitArea.width : canvas.grid.size;
    effectSize = width / canvas.grid.size;

    // 4. Animation Sequence (Only runs after damage confirmation)
    const seq = new Sequence()
        // Padlock Icon
        .effect()
        .file(closest("icons/svg/padlock.svg"))
        .atLocation(position)
        .size(effectSize, { gridUnits: true })
        .opacity(1)
        .filter("Glow", { color: 0xd7a10f, innerStrength: 1, knockout: true })
        .fadeIn(500)
        .xray()
        .duration(500)
        .elevation(safeElevation)
        .zIndex(10)

        // Magic Chains
        .effect()
        .file(closest("jb2a.markers.chain.spectral_standard.complete.02.purple"))
        .atLocation(position)
        .size(effectSize + 0.8, { gridUnits: true })
        .spriteRotation(-90)
        .xray()
        .scaleIn(0, 250, { ease: "easeOutCubic" })
        .startTime(7500)
        .filter("ColorMatrix", { hue: 100 })
        .randomRotation()
        .elevation(safeElevation)
        .zIndex(11)

        // Weapon Shot
        if (sound.enabled) {
            seq.sound()
                .file(closest(sound.file))
                .volume(sound.volume)
        }

        seq.effect()
        .delay(225)
        .file(closest("jb2a.muzzle_flash.single.01.yellow"))
        .atLocation(token)
        .rotateTowards(position)
        .scaleToObject(2.25 * token.document.width)
        .elevation(safeElevation)
        .zIndex(12)

        .wait(500)

        // Explosion on Padlock
        .effect()
        .file(closest("jb2a.explosion_side.01.orange"))
        .atLocation(position, { offset: { x: 0, y: -0 }, gridUnits: true })
        .size(1.05, { gridUnits: true })
        .rotateTowards(position)
        .spriteOffset({ x: -0.55 }, { gridUnits: true })
        .playbackRate(1)
        .aboveLighting()
        .opacity(1)
        .elevation(safeElevation)
        .zIndex(13)

        // Padlock Shards
        .effect()
        .delay(100)
        .file(closest("jb2a.explosion.side_fracture.flask.02.0"))
        .atLocation(position, { offset: { x: 0, y: -0 }, gridUnits: true })
        .scale(0.25)
        .rotateTowards(token)
        .spriteOffset({ x: -0.25 }, { gridUnits: true })
        .playbackRate(1)
        .opacity(1)
        .elevation(safeElevation)
        .zIndex(12)

        .canvasPan()
        .shake({ duration: 500, strength: 2, rotation: false, fadeOut: 500 })
        .thenDo(async function () { if (lockedDoor) await socket.door.unlock(lockedDoor.id); });

    return seq;
}


/**
 * Plays the Blast Lock effect.
 *
 * @param {Token} token The token using the ability.
 * @param {object} [config={}] Configuration for the effect.
 * @returns {Promise<void>} A promise that resolves when the effect is finished.
 */
async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) {
        await sequence.play();
    }
}


export const blastLock = {
    create,
    play,
};

autoanimations.register("Blast Lock", "template", "eskie.effect.blastLock", DEFAULT_CONFIG);