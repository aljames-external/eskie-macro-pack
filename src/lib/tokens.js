import { dependency } from './dependency.js';

/**
 * Finds the center of the grid square on a target token that is nearest to a source token.
 * @param {Token} token - The source token.
 *
 * @param {Token} target - The target token.
 * @returns {{x: number, y: number}} The coordinates of the center of the nearest square.
 */
function getNearestSquareCenter(token, target) {
  const gs = canvas.grid.size;
  const srcCenter = token.center;

  const w = target.document.width;  
  const h = target.document.height; 

  let bestPoint = null;
  let bestDist2 = Infinity;

  for (let gx = 0; gx < w; gx++) {
    for (let gy = 0; gy < h; gy++) {
      const cx = target.x + (gx + 0.5) * gs;
      const cy = target.y + (gy + 0.5) * gs;

      const dx = cx - srcCenter.x;
      const dy = cy - srcCenter.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestPoint = { x: cx, y: cy };
      }
    }
  }

  return bestPoint;
}

/**
 * Returns an array of users who are owners of a given token.
 * @param {Token} token - The token to check for owners.
 * @param {object} [config] - Optional configuration.
 * @param {boolean} [config.applyPC=true] - Whether to include player characters.
 * @param {boolean} [config.applyGM=true] - Whether to include Game Masters.
 * @returns {User[]} An array of User objects who are owners of the token.
 */
function owners(token, config = {}) {
    if (!token) return [];
    const ownership = token.actor.ownership;

    // Filter users: Level 3 is "Owner"
    let owners = game.users.filter(user => { return ownership[user.id] === 3; });
    if (!config.applyPC) owners = owners.filter(user => { return user.isGM === true; });
    if (!config.applyGM) owners = owners.filter(user => { return user.isGM === false; });
    return owners;
};

export const tokens = {
    owners,
    getNearestSquareCenter
}