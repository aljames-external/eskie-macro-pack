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

/**
 * Calculates the 3D distance between two tokens in scene units (e.g., feet), rounded up.
 * @param {Token} t1 - The first token.
 * @param {Token} t2 - The second token.
 * @returns {number} The 3D distance in scene units, rounded up.
 */
function getDistance(t1, t2) {
    const p1 = t1.center || { x: t1.x, y: t1.y };
    const p2 = t2.center || { x: t2.x, y: t2.y };
    const dist2DPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    
    // Convert 2D pixel distance to scene units (e.g., feet/meters)
    const gridSize = canvas.grid?.size || 100;
    const gridDistance = canvas.scene?.grid?.distance || 5;
    const dist2DUnits = (dist2DPx / gridSize) * gridDistance;
    
    // Get elevation difference (already in scene units)
    const el1 = t1.document?.elevation ?? 0;
    const el2 = t2.document?.elevation ?? 0;
    const elDiff = el1 - el2;
    
    // 3D Euclidean distance in scene units, rounded up
    const dist3DUnits = Math.hypot(dist2DUnits, elDiff);
    return Math.ceil(dist3DUnits);
}

export const tokens = {
    owners,
    getNearestSquareCenter,
    getDistance
}