import { utils } from './utils.js';
import { SECONDS } from '../../lib/constants.js';

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

async function initialize(tile, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    await tile.setFlag('world', id, { tileData: getCenter(tile) });
}

async function movement(token, config = {}) {
    const { id } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, {inplace:false});
    const label = getLabel(id, token);
    const tile = Tagger.getByTag(label)[0];

    if (!game.user.isGM || !tile) return;
    if (!config.sequence) return;

    // Initial tokenPosition is where the tile was when the movement started
    // We wait until the tile has moved and calculate latency required for the animation
    const savedData = await tile.getFlag('world', id);
        const tokenPosition = {x: savedData.tileData.x, y: savedData.tileData.y};
        function tileMoved() {
            const currentCenter = getCenter(tile);
            const savedCenter = savedData.tileData;
            return (currentCenter.x !== savedCenter.x) || (currentCenter.y !== savedCenter.y);
        }
        let latency = await utils.waitUntil(tileMoved, {timeout: 5000});
    await tile.setFlag('world', id, { tileData: getCenter(tile) });

    const tilePosition = getCenter(tile);
    const deltaX = tokenPosition.x - tilePosition.x;
    const deltaY = tokenPosition.y - tilePosition.y;
    const angleRadians = Math.atan2(deltaY, deltaX);
    const distance = Math.hypot(tokenPosition.x - tilePosition.x, tokenPosition.y - tilePosition.y);
    const tokenSpeed = token._getAnimationMovementSpeed();
    const speed = (tokenSpeed * canvas.grid.size) / (1 * SECONDS);
    const rotation = angleRadians * (180 / Math.PI);
    const travelTime = (distance / speed) - latency;
    const particleRepeats = travelTime / 250;
    
    // Latency is too long to show the effect
    if (travelTime < 0) { return; }

    return config.sequence({ token, tile, tilePosition, rotation, travelTime, particleRepeats, label }).play();
}

export const tiles = {
    initialize,
    movement,
    getLabel,
}