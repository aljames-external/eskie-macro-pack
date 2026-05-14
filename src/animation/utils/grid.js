/**
 * Finds the adjacent grid center point with the minimal perpendicular distance
 * to the line between two tokens.
 * 
 * @param {Token} token - The reference token (usually the caster).
 * @param {Token} target - The target token.
 * @returns {object} The center point {x, y} of the best adjacent grid cell.
 */
export function getBestAdjacentLocation(token, target) {
    const p1 = token.center;
    const p2 = target.center;

    // Line: ax + by + c = 0 where (x1, y1) is p1 and (x2, y2) is p2
    const a = p1.y - p2.y;
    const b = p2.x - p1.x;
    const c = p1.x * p2.y - p2.x * p1.y;
    const denominator = Math.sqrt(a * a + b * b);

    const getDistance = (p) => {
        if (denominator === 0) return 0;
        return Math.abs(a * p.x + b * p.y + c) / denominator;
    };

    const grid = canvas.grid;
    const size = grid.size;
    const tDoc = token.document;
    const candidates = [];

    // Iterate around the token's footprint to find all adjacent grid centers
    for (let i = -1; i <= tDoc.width; i++) {
        for (let j = -1; j <= tDoc.height; j++) {
            // Skip the cells actually occupied by the token
            if (i >= 0 && i < tDoc.width && j >= 0 && j < tDoc.height) continue;

            const cellX = tDoc.x + (i * size);
            const cellY = tDoc.y + (j * size);
            const center = grid.getCenterPoint ? grid.getCenterPoint({ x: cellX, y: cellY }) : grid.getCenter(cellX, cellY);
            const pos = Array.isArray(center) ? { x: center[0], y: center[1] } : center;
            candidates.push(pos);
        }
    }

    if (candidates.length === 0) return p1;

    // Select the candidate with the minimal perpendicular distance to the line
    let location = candidates[0];
    let minDistance = Infinity;

    for (const cand of candidates) {
        const d = getDistance(cand);
        if (d < minDistance) {
            minDistance = d;
            location = cand;
        } else if (Math.abs(d - minDistance) < 0.1) {
            // Tie-breaker: choose the one closer to the target's current position
            const distToTargetCurr = Math.hypot(cand.x - p2.x, cand.y - p2.y);
            const distToTargetBest = Math.hypot(location.x - p2.x, location.y - p2.y);
            if (distToTargetCurr < distToTargetBest) {
                location = cand;
            }
        }
    }

    return location;
}

export const grid = {
    getBestAdjacentLocation,
};
