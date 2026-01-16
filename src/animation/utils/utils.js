async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntil(condition, {timeout=2000, interval=100}={}) {
    return new Promise((resolve, reject) => {
        const startTime = game.time.serverTime;
        const check = () => {
            if (condition()) {
                resolve(game.time.serverTime - startTime);
            } else if (game.time.serverTime - startTime > timeout) {
                reject(new Error("Timeout waiting for condition."));
            } else {
                setTimeout(check, interval);
            }
        };
        check();
    });
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


function getCrosshairCfg(config) {
    const { CENTER, CORNER,  VERTEX, EDGE_MIDPOINT, SIDE_MIDPOINT } = CONST.GRID_SNAPPING_MODES;
    const DEFAULT_CROSSHAIR = {
        t: 'circle',
        distance: canvas.grid.size / 2, // Radius for circles
        width: canvas.grid.size,        // Ray witdth
        borderAlpha: 0.75,              // Determines the transparency of the template border (0-1, default 0.75)
        borderColor: "#000000",       // Determines the color of the template border
        texture: '',                    // The texture to show within the template
        textureAlpha: 0.5,              // The transparency of the chosen texture (0-1, default .5)
        textureScale: 1,                // The texture scale relative to the template size (default 1)
        angle: 0,                       // The starting angle for the template
        direction: 0,                   // The starting direction for the template
        gridHighlight: true,            // Toggles whether this crosshair should highlight the grid
        icon: {
            texture: '',                // Optional texture to use for the icon of the crosshair
            borderVisible: true         // Whether this icon should have a border
        },
        snap: {
            position: CENTER | CORNER | EDGE_MIDPOINT,           // See CONST.GRID_SNAPPING_MODES
            resolution: 2,              // How many sub-squares the snapping should consider (default: 1)
            //size: number, // See CONST.GRID_SNAPPING_MODES
            //direction: mumber // How many degrees the direction of this crosshair should snap at
        },
        //lockDrag: boolean,
        //distanceMin: null | number, // How small or short the crosshair can be at its smallest 
        //distanceMax: null | number, // How big or how far the crosshair can go at its biggest
        label: {
            text: '',
            //dx: null | number,
            //dy: null | number,
        },
        location: {
            obj: null,                  // The optional object to tie the crosshair to
            //limitMinRange: null | number, // Causes the crosshair to not be able to be placed within this number of grid units
            //limitMaxRange: null | number, // Causes the crosshair to not be able to be placed beyond this number of grid units of the location 
            showRange: true, // Displays the distance between the crosshair and the location in grid units under the crosshair
            lockToEdge: false, // Whether to lock the crosshair to the edge of the target (mostly used with tokens)
            lockToEdgeDirection: false, // Causes the crosshair to be locked along the normal of the token's edge (and corner, in the case of square tokens)
            offset: {
                x: null,
                y: null
            }, // Causes the location to be offset by this many pixels
            wallBehavior: true, // Causes the crosshair to be unable to be placed based on this configuration, eg only within sight, or no walls at all between crosshair and location, or anywhere. See Sequencer.Crosshair.PLACEMENT_RESTRICTIONS,
            displayRangePoly: true, // Causes a polygon to be rendered below the object that shows the limit based on the limitMaxRange set above - this requires both that, and obj to have a position
            //rangePolyFillColor: null | number, // The fill color of the range polygon
            //rangePolyLineColor: null | number, // The line color of the range polygon
            //rangePolyFillAlpha: null | number, // The fill alpha of the range polygon
            //rangePolyLineAlpha: null | number, // The line alpha of the range polygon
        },
        lockManualRotation: false // Whether to prevent the user from rotating this crosshair's direction
    };

    let mergeObject = {
        t: config.type ?? 'circle',
        distance: config.radius ?? config.distance ?? canvas.grid.size / 2, // Radius for circles
        width: config.width ?? canvas.grid.size,        // Ray witdth
        distanceMin: config.min ?? null,
        distanceMax: config.max ?? null,
        label: {
            text: config.label ?? '',
        }
    }

    return foundry.utils.mergeObject(DEFAULT_CROSSHAIR, mergeObject, {inplace:false});
}

async function getPosition(template, config) {
    let position;
    if (template) {
        // Not sure if this works for everything... but let's try...
        const farpoint = template._object.ray.B;        // Get the furthest point on the cone
        const secondary = { x: farpoint.x, y: farpoint.y };    // Decouple from the template so when it is deleted we don't crash
        const source = { x: template.x, y: template.y };
        position = (template.t == 'circle') ? source : secondary;
    } else {
        const crosshair = getCrosshairCfg(config);
        position = await Sequencer.Crosshair.show(crosshair);
        if (position.cancelled) { return; }
    }
    return position;
}

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

export const utils = {
    owners,
    wait,
    waitUntil,
    getPosition,
    getNearestSquareCenter,
}