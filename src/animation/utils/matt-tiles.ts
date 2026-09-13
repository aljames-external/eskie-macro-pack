import { time } from '../../lib/time.js';
import { dependency } from '../../lib/dependency.js';
import { socket } from '../../adapters/modules/socketlib/socketlib-module-adapter.js';
import { SECONDS, MODULE_ID } from '../../lib/constants.js';
import { adapter } from '../../adapters/index.js';
import { log, notify } from '../../lib/logger.js';
import { localize, format } from '../../lib/utils.js';

const DEFAULT_CONFIG = {
    id: 'generic-tile-movement',
};

//Determine movement direction and center point
function getCenter(tile: Tile): { x: number; y: number } {
    return adapter.getCenter(tile);
}

function getLabel(id: string, token: Token): string {
    return `${id} - ${token.id}`;
}

async function start(token: Token, code: string, config: Record<string, unknown> = {}): Promise<void> {
    dependency.required([{id: 'tagger', ref: "Tagger"},
                        {id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers"}]);

    const mergedConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mergedConfig;
    const { info, ...nonInfoConfig } = mergedConfig;
    const label = getLabel(id, token);
    const tileOffset = adapter.getShapeOffset(token);
    const { widthPx, heightPx } = adapter.getTokenDimensions(token);

    const initialData = {
        "texture.src": "icons/svg/d6-grey.svg", 
        "alpha": 0,
        "hidden": true,
        "x": tileOffset.x,
        "y": tileOffset.y,
        "width": widthPx,
        "height": heightPx,
    };
    
    const [tile] = await socket.tile.create(initialData);

    const MATTtriggers = ["exit", "manual"];
    const MATTactions = [{
        id: adapter.randomID(),
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

    await adapter.attachPlaceableElements([tile], token);
    await tile.setFlag(MODULE_ID, id, { tileData: getCenter(tile) });
    await tile.setFlag(MODULE_ID, 'config', nonInfoConfig);
}

async function configure(token: any, tile: any, config: Record<string, any> = {}): Promise<any> {
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const label = getLabel(id, token);

    if (!game.user.isGM || !tile) return;

    // Initial token position is where the tile was when the movement started
    // We wait until the tile has moved and calculate latency required for the animation
    const savedData: any = await (tile.document as any)?.getFlag?.(MODULE_ID, id) ?? await (tile as any).getFlag?.(MODULE_ID, id);
    const tileOrigin = { x: savedData?.tileData?.x ?? 0, y: savedData?.tileData?.y ?? 0 };
    function tileMoved() {
        const currentCenter = getCenter(tile);
        const savedCenter = savedData?.tileData ?? { x: 0, y: 0 };
        return (currentCenter.x !== savedCenter.x) || (currentCenter.y !== savedCenter.y);
    }
    let latency = Number(await time.waitUntil(tileMoved, { timeout: 5000 })) || 0;
    if ((tile.document as any)?.setFlag) {
        await (tile.document as any).setFlag(MODULE_ID, id, { tileData: getCenter(tile) });
    } else if ((tile as any).setFlag) {
        await (tile as any).setFlag(MODULE_ID, id, { tileData: getCenter(tile) });
    }

    const tilePosition = getCenter(tile);
    const dx = tileOrigin.x - tilePosition.x;
    const dy = tileOrigin.y - tilePosition.y;
    const angleRadians = Math.atan2(dy, dx);
    const distance = Math.hypot(tileOrigin.x - tilePosition.x, tileOrigin.y - tilePosition.y);
    const tokenSpeed = (token as any)._getAnimationMovementSpeed?.() ?? 0;
    const speed = (tokenSpeed * adapter.getSceneDimensions().size) / (1 * SECONDS);
    const rotation = angleRadians * (180 / Math.PI);
    const travelTime = (distance / speed) - latency;

    return { rotation, travelTime, label, delta: {x: dx, y: dy} };
}

async function setup(animation: string, config: Record<string, unknown> = {}): Promise<any> {
    dependency.required([{ id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers" }]);

    if (!game.user.isGM) return notify.error(localize('EMP.traps.setup.onlyGm'));

    const pathParts = animation.split('.');
    const trapKey = pathParts[pathParts.length - 1];
    const tileCount = config.tileCount ?? 2;

    // Step 1: Prompt user to select trigger tiles
    const triggerResult = await adapter.buttonDialog({
        title: format('EMP.traps.setup.step1Title', { name: trapKey }),
        buttons: [
            { label: localize('EMP.traps.common.continue'), value: 'continue' },
            { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
        ],
    }, {
        content: localize('EMP.traps.setup.step1Content')
    });

    if (triggerResult !== 'continue') return;

    const triggerTiles = canvas.tiles.controlled.map(t => t.document);
    if (triggerTiles.length === 0) return notify.warn(localize('EMP.traps.setup.noTriggerTiles'));

    let originTiles: any[] = [];
    let targetTiles: any[] = [];

    if (tileCount === 3) {
        // Step 2: Prompt user to select trap origin/launcher tiles
        const originResult = await adapter.buttonDialog({
            title: format('EMP.traps.setup.step2OriginTitle', { name: trapKey }),
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: localize('EMP.traps.setup.step2OriginContent')
        });

        if (originResult !== 'continue') return;

        originTiles = canvas.tiles.controlled.map(t => t.document);
        if (originTiles.length === 0) return notify.warn(localize('EMP.traps.setup.noOriginTiles'));

        // Step 3: Prompt user to select trap target/landing tiles
        const targetResult = await adapter.buttonDialog({
            title: format('EMP.traps.setup.step3TargetTitle', { name: trapKey }),
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: localize('EMP.traps.setup.step3TargetContent')
        });

        if (targetResult === 'cancel' || targetResult === false) return;

        targetTiles = canvas.tiles.controlled.map(t => t.document);
        if (targetTiles.length === 0) {
            notify.warn(localize('EMP.traps.setup.noTargetTiles'));
            targetTiles = triggerTiles;
        }
    } else {
        // Step 2: Prompt user to select trap animation tiles
        const trapResult = await adapter.buttonDialog({
            title: format('EMP.traps.setup.step2AnimTitle', { name: trapKey }),
            buttons: [
                { label: localize('EMP.traps.common.continue'), value: 'continue' },
                { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
            ],
        }, {
            content: localize('EMP.traps.setup.step2AnimContent')
        });

        if (trapResult !== 'continue') return;

        originTiles = canvas.tiles.controlled.map(t => t.document);
        if (originTiles.length === 0) {
            notify.warn(localize('EMP.traps.setup.noAnimTiles'));
            originTiles = triggerTiles;
        }
    }

    const extraTileResults: Record<string, any> = {};
    if (config.extraTiles && Array.isArray(config.extraTiles as any)) {
        for (const extra of (config.extraTiles as any[])) {
            const extraResult = await adapter.buttonDialog({
                title: format('EMP.traps.setup.extraTitle', { name: extra.label }),
                buttons: [
                    { label: localize('EMP.traps.common.continue'), value: 'continue' },
                    { label: localize('EMP.traps.common.cancel'), value: 'cancel' },
                ],
            }, {
                content: `<p>${extra.prompt}</p><p>Click <strong>Continue</strong> once selected.</p>`
            });

            if (extraResult !== 'continue') return;

            const selected = canvas.tiles.controlled.map(t => t.document);
            if (selected.length === 0) return notify.warn(format('EMP.traps.setup.noExtraTiles', { name: extra.label }));
            extraTileResults[extra.key] = selected.map(t => t.id);
        }
    }

    const triggerTileIds = new Set(triggerTiles.map(t => t.id));
    const originTileIds = new Set(originTiles.map(t => t.id));
    const targetTileIds = new Set(targetTiles.map(t => t.id));

    const allTiles = new Map();
    for (const t of [...triggerTiles, ...originTiles]) {
        allTiles.set(t.id, t);
    }

    const configuredTrigger = config.trigger ?? 'enter';

    for (const [tileId, tileDoc] of allTiles) {
        const isTrigger = triggerTileIds.has(tileId);

        const { tileCount: _tc, extraFlags: _ef, extraTiles: _et, trigger: _tr, controlled: _co, playPath: _pp, ...trapOptions } = config;
        const targetTileId = tileCount === 3 ? (targetTiles[0]?.id ?? null) : null;
        const trapConfig = { ...trapOptions };

        const trapActionCode = `
// Action-scoped placeable groups for this run command
const triggerTileIds = ${JSON.stringify(triggerTiles.map(t => t.id))};
const sourceTileIds = ${JSON.stringify(originTiles.map(t => t.id))};
const targetTileIds = ${JSON.stringify(targetTiles.map(t => t.id))};

// Resolve the concrete Tile placeables from MATT execution scope
const adapter = game.modules.get('${MODULE_ID}').api.adapter;
const tilePlaceable = tile.object ?? canvas.tiles.get(tile.id);
${targetTileId ? `const targetTile = canvas.tiles.get('${targetTileId}');
const targetLocation = targetTile ? adapter.getTargetLocation(targetTile) : null;` : ''}

// Get the specific Eskie Trap Animation Function if this tile is a source tile
const animation = sourceTileIds.includes(tile.id) ? '${animation}' : null;
const promises = [];

if (animation) {
    promises.push((async () => {
        try {
            const trap = adapter.getProperty(globalThis, animation);
            // Collect all tokens contained within / overlapping this trap tile via adapter
            let targets = adapter.getTokensInTile(tilePlaceable);

            // Include activating token only if it is currently in or moving into this trap tile
            const activatingTarget = token?.object ? token.object : token;
            const isTarget = activatingTarget && adapter.isTokenInOrMovingIntoPlaceable(activatingTarget, tilePlaceable, {
                triggerTileIds
            });

            if (isTarget && activatingTarget.id && !targets.some(t => t.id === activatingTarget.id)) {
                targets.push(activatingTarget);
            }

            // Play the trap animation with the contained tokens as targets
            await trap.play(tilePlaceable, targets, { ...${JSON.stringify(trapConfig)}${targetTileId ? ', targetLocation' : ''} });
        } catch (err) {
            console.error('Eskie Macro Pack | Failed to play trap animation "' + animation + '" on tile "' + tile.id + '":', err);
            throw err;
        }
    })());
}

// If this tile is a trigger tile for this command, manually activate linked source tiles concurrently
if (triggerTileIds.includes(tile.id)) {
    const originIds = sourceTileIds.filter(id => id !== tile.id);
    for (const id of originIds) {
        const originTile = canvas.tiles.get(id);
        if (!originTile) continue;
        promises.push(originTile.document.trigger({ token }));
    }
}

await Promise.all(promises);
`;

        const resolvedTrigger = isTrigger
            ? configuredTrigger
            : (tileDoc.getFlag?.('monks-active-tiles', 'trigger') ?? 'manual');

        const existingActions = tileDoc.getFlag?.('monks-active-tiles', 'actions') ?? [];
        const newAction = {
            id: adapter.randomID(),
            action: 'runcode',
            data: { code: trapActionCode },
        };

        const updateData = {
            'flags.monks-active-tiles.active': true,
            'flags.monks-active-tiles.trigger': resolvedTrigger,
            'flags.monks-active-tiles.actions': [
                ...existingActions,
                newAction
            ],
            'flags.monks-active-tiles.controlled': config.controlled ?? 'gm',
        };

        await socket.tile.edit(tileId, updateData);
    }

    notify.info(`Successfully setup ${trapKey} trap links for ${triggerTiles.length} trigger tile(s) and ${originTiles.length} trap tile(s).`);
    return { triggerTiles, originTiles, targetTiles };
}

async function stop(token: Token, label: string): Promise<void> {
    const tiles = Tagger.getByTag(label);
    await adapter.detachPlaceableElements(tiles, token);
    tiles.forEach(async (tile: any) => await socket.tile.destroy(tile.id));
}

export const matt = {
    movement: {
        start,
        configure,
        stop,
    },
    trap: {
        setup,
    },
    getLabel
};