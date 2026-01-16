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
    getNearestSquareCenter,
}