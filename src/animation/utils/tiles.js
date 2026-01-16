import { utils } from './utils.js';
import { dependency } from '../../lib/dependency.js';
import { socket } from '../../integration/socketlib.js';
import { SECONDS, MODULE_ID } from '../../lib/constants.js';

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
    dependency.required({id: 'tagger', ref: "Tagger"});
    dependency.required({id: 'token-attacher', ref: "Token Attacher"});
    dependency.required({id: 'monks-active-tiles', ref: "Monk's Active Tile Triggers"});

    const mergedConfig = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const { id } = mergedConfig;
    const label = tiles.getLabel(id, token);

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
        let latency = await utils.waitUntil(tileMoved, {timeout: 5000});
    await tile.setFlag(MODULE_ID, id, { tileData: getCenter(tile) });

    const tilePosition = getCenter(tile);
    const deltaX = tileOrigin.x - tilePosition.x;
    const deltaY = tileOrigin.y - tilePosition.y;
    const angleRadians = Math.atan2(deltaY, deltaX);
    const distance = Math.hypot(tileOrigin.x - tilePosition.x, tileOrigin.y - tilePosition.y);
    const tokenSpeed = token._getAnimationMovementSpeed();
    const speed = (tokenSpeed * canvas.grid.size) / (1 * SECONDS);
    const rotation = angleRadians * (180 / Math.PI);
    const travelTime = (distance / speed) - latency;

    return { rotation, travelTime, label };
}

export const tiles = {
    initialize,
    configuration,
    getLabel,
    getCenter,
}