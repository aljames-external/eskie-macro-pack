import { time } from '../../lib/time.js';
import { dependency } from '../../lib/dependency.js';
import { socket } from '../../integration/socketlib.js';
import { SECONDS, MODULE_ID } from '../../lib/constants.js';
import { dialog } from '../../lib/dialog.js';

const DEFAULT_CONFIG = {
    id: 'generic-tile-movement',
};

//Determine movement direction
function getCenter(tile) {
    return {x: tile.x + tile.width/2, y: tile.y + tile.height/2};
}

function getLabel(id, token) {
    return `${id} - ${token.id}`;
}

async function initialize(token, code, config = {}) {
    dependency.required([{id: 'tagger', ref: "Tagger"},
                        {id: 'token-attacher', ref: "Token Attacher"},
                        {id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers"}]);

    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mergedConfig;
    const { info, ...nonInfoConfig } = mergedConfig;
    const label = getLabel(id, token);

    const initialData = {
        "texture.src": "icons/svg/d6-grey.svg", 
        "alpha": 0,
        "hidden": true,
        "x": token.x,
        "y": token.y,
        "width": canvas.grid.size * token.document.width,
        "height": canvas.grid.size * token.document.width,
    };
    
    const [tile] = await socket.tile.create(initialData);

    const MATTtriggers = ["exit", "manual"];
    const MATTactions = [{
        action: 'runcode',
        data: { code: code ?? `console.error(arguments)` },
    }];
    const updateData = {
        "flags.monks-active-tiles.active": true,
        "flags.monks-active-tiles.trigger": MATTtriggers,
        "flags.monks-active-tiles.actions": MATTactions,
        "flags.monks-active-tiles.controlled": "gm",
    };
    await socket.tile.edit(tile.id, updateData);
    await Tagger.addTags(tile, label);

    await tokenAttacher.attachElementToToken(tile, token, true);
    await tile.setFlag(MODULE_ID, id, { tileData: getCenter(tile) });
    await tile.setFlag(MODULE_ID, 'config', nonInfoConfig);
}

async function configuration(token, tile, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = getLabel(id, token);

    if (!game.user.isGM || !tile) return;

    // Initial token position is where the tile was when the movement started
    // We wait until the tile has moved and calculate latency required for the animation
    const savedData = await tile.getFlag(MODULE_ID, id);
        const tileOrigin = {x: savedData.tileData.x, y: savedData.tileData.y};
        function tileMoved() {
            const currentCenter = getCenter(tile);
            const savedCenter = savedData.tileData;
            return (currentCenter.x !== savedCenter.x) || (currentCenter.y !== savedCenter.y);
        }
        let latency = await time.waitUntil(tileMoved, {timeout: 5000});
    await tile.setFlag(MODULE_ID, id, { tileData: getCenter(tile) });

    const tilePosition = getCenter(tile);
    const dx = tileOrigin.x - tilePosition.x;
    const dy = tileOrigin.y - tilePosition.y;
    const angleRadians = Math.atan2(dy, dx);
    const distance = Math.hypot(tileOrigin.x - tilePosition.x, tileOrigin.y - tilePosition.y);
    const tokenSpeed = token._getAnimationMovementSpeed();
    const speed = (tokenSpeed * canvas.grid.size) / (1 * SECONDS);
    const rotation = angleRadians * (180 / Math.PI);
    const travelTime = (distance / speed) - latency;

    return { rotation, travelTime, label, delta: {x: dx, y: dy} };
}

async function setup(playPath, config = {}) {
    dependency.required([{ id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }]);

    if (!game.user.isGM) return ui.notifications.error('EMP | Only a GM can setup traps.');

    const pathParts = playPath.split('.');
    const trapKey = pathParts[pathParts.length - 1];
    const tileCount = config.tileCount ?? 2;

    // Step 1: Prompt user to select trigger tiles
    const triggerResult = await dialog.buttonDialog({
        title: `Trap Setup - ${trapKey}: Step 1 (Trigger Tiles)`,
        buttons: [
            { label: 'Continue', value: 'continue' },
            { label: 'Cancel', value: 'cancel' },
        ],
    }, {
        content: '<p>Select the **Trigger Tile(s)** on the canvas (which tokens step on to trigger the trap).</p><p>Click <strong>Continue</strong> once selected.</p>'
    });

    if (triggerResult !== 'continue') return;

    const triggerTiles = canvas.tiles.controlled.map(t => t.document);
    if (triggerTiles.length === 0) return ui.notifications.warn('EMP | No trigger tiles selected. Trap setup cancelled.');

    let originTiles = [];
    let targetTiles = [];

    if (tileCount === 3) {
        // Step 2: Prompt user to select trap origin/launcher tiles
        const originResult = await dialog.buttonDialog({
            title: `Trap Setup - ${trapKey}: Step 2 (Trap Origin/Launcher Tiles)`,
            buttons: [
                { label: 'Continue', value: 'continue' },
                { label: 'Cancel', value: 'cancel' },
            ],
        }, {
            content: '<p>Select the **Trap Origin Tile(s)** on the canvas (where the trap starts or shoots from).</p><p>Click <strong>Continue</strong> once selected.</p>'
        });

        if (originResult !== 'continue') return;

        originTiles = canvas.tiles.controlled.map(t => t.document);
        if (originTiles.length === 0) return ui.notifications.warn('EMP | No trap origin tiles selected. Trap setup cancelled.');

        // Step 3: Prompt user to select trap target/landing tiles
        const targetResult = await dialog.buttonDialog({
            title: `Trap Setup - ${trapKey}: Step 3 (Trap Target/Landing Tiles)`,
            buttons: [
                { label: 'Continue', value: 'continue' },
                { label: 'Use Trigger Tiles', value: 'use-trigger' },
                { label: 'Cancel', value: 'cancel' },
            ],
        }, {
            content: '<p>Select the **Trap Target Tile(s)** on the canvas (where the trap shoots towards or lands).</p><p>If the target/landing area is the trigger tile, click <strong>Use Trigger Tiles</strong>.</p>'
        });

        if (targetResult === 'cancel' || targetResult === false) return;

        if (targetResult === 'use-trigger') {
            targetTiles = triggerTiles;
        } else {
            targetTiles = canvas.tiles.controlled.map(t => t.document);
            if (targetTiles.length === 0) {
                ui.notifications.warn('EMP | No trap target tiles selected. Defaulting to use Trigger Tiles.');
                targetTiles = triggerTiles;
            }
        }
    } else {
        // Step 2: Prompt user to select trap animation tiles
        const trapResult = await dialog.buttonDialog({
            title: `Trap Setup - ${trapKey}: Step 2 (Animation Tiles)`,
            buttons: [
                { label: 'Finish', value: 'finish' },
                { label: 'Use Trigger Tiles', value: 'use-trigger' },
                { label: 'Cancel', value: 'cancel' },
            ],
        }, {
            content: '<p>Select the **Trap Animation Tile(s)** where the visual effect will play.</p><p>If the trigger tile and trap tile are the same, click <strong>Use Trigger Tiles</strong> or select the same tile and click <strong>Finish</strong>.</p>'
        });

        if (trapResult === 'cancel' || trapResult === false) return;

        if (trapResult === 'use-trigger') {
            originTiles = triggerTiles;
        } else {
            originTiles = canvas.tiles.controlled.map(t => t.document);
            if (originTiles.length === 0) {
                ui.notifications.warn('EMP | No trap animation tiles selected. Defaulting to use Trigger Tiles.');
                originTiles = triggerTiles;
            }
        }
    }

    const extraTileResults = {};
    if (config.extraTiles) {
        for (const extra of config.extraTiles) {
            const extraResult = await dialog.buttonDialog({
                title: `Trap Setup - ${extra.label}`,
                buttons: [
                    { label: 'Continue', value: 'continue' },
                    { label: 'Cancel', value: 'cancel' },
                ],
            }, {
                content: `<p>${extra.prompt}</p><p>Click <strong>Continue</strong> once selected.</p>`
            });

            if (extraResult !== 'continue') return;

            const selected = canvas.tiles.controlled.map(t => t.document);
            if (selected.length === 0) return ui.notifications.warn(`EMP | No ${extra.label} selected. Trap setup cancelled.`);
            extraTileResults[extra.key] = selected.map(t => t.id);
        }
    }

    const code = `const playPath = tile.getFlag('${MODULE_ID}', 'trap.playPath');
const originTileIds = tile.getFlag('${MODULE_ID}', 'trap.trapOriginTileIds') || tile.getFlag('${MODULE_ID}', 'trap.trapTileIds') || [];
if (playPath && typeof token !== 'undefined') {
    const trap = foundry.utils.getProperty(globalThis, playPath);
    if (trap && typeof trap.play === 'function') {
        originTileIds.forEach(id => {
            const originTile = canvas.tiles.get(id);
            if (originTile) trap.play(originTile, [token]);
        });
    }
}`;

    // Update trigger tiles
    for (const triggerTile of triggerTiles) {
        const updateData = {
            [`flags.${MODULE_ID}.trap.playPath`]: playPath,
            [`flags.${MODULE_ID}.trap.trapKey`]: trapKey,
            [`flags.${MODULE_ID}.trap.trapOriginTileIds`]: originTiles.map(t => t.id),
            // Maintain backward compatibility for older runcode scripts
            [`flags.${MODULE_ID}.trap.trapTileIds`]: originTiles.map(t => t.id),
            [`flags.${MODULE_ID}.trap.isTriggerTile`]: true,
            'flags.monks-active-tiles.active': true,
            'flags.monks-active-tiles.trigger': ['enter'],
            'flags.monks-active-tiles.actions': [{
                action: 'runcode',
                data: { code },
            }],
            'flags.monks-active-tiles.controlled': 'gm',
        };
        await socket.tile.edit(triggerTile.id, updateData);
    }

    // Update trap tiles
    for (const originTile of originTiles) {
        const updateData = {
            [`flags.${MODULE_ID}.trap.isTrapTile`]: true,
        };
        if (tileCount === 3) {
            updateData[`flags.${MODULE_ID}.trap.trapTargetTileIds`] = targetTiles.map(t => t.id);
        }
        if (config.extraTiles) {
            for (const extra of config.extraTiles) {
                updateData[`flags.${MODULE_ID}.trap.${extra.key}`] = extraTileResults[extra.key];
            }
        }
        await socket.tile.edit(originTile.id, updateData);
    }

    // Update target tiles
    if (tileCount === 3) {
        for (const targetTile of targetTiles) {
            const updateData = {
                [`flags.${MODULE_ID}.trap.isTargetTile`]: true,
            };
            await socket.tile.edit(targetTile.id, updateData);
        }
    }

    ui.notifications.info(`EMP | Successfully setup ${trapKey} trap links for ${triggerTiles.length} trigger tile(s) and ${originTiles.length} trap tile(s).`);
}

export const matt = {
    movement: {
        initialize,
        configuration,
    },
    trap: {
        setup,
    },
    getLabel
};