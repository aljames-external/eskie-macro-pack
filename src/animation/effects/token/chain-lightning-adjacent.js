// Original Author: .eskie
// Adjacency Matrix Refactoring: Antigravity

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {
    releaseDelay: 200,
    fudgeFactor: 0,
    propagationDelay: 50
};

/**
 * Helper to calculate 3D distance between two tokens in scene units (e.g., feet), rounded up.
 */
const getDistance = (t1, t2) => {
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
};

/**
 * Constructs the adjacency matrix using Prim's Minimum Spanning Tree algorithm,
 * extended with a fudgeFactor. This guarantees the "path of least resistance"
 * while allowing parallel branching to targets that are roughly the same distance.
 */
function buildAdjacencyMatrix(tokens, fudgeFactor = 0) {
    const N = tokens.length;
    const A = Array.from({ length: N }, () => Array(N).fill(Infinity));
    
    // Negative fudge factors default to 0
    const fudge = Math.max(0, fudgeFactor);

    // 1. Precompute 3D distances between all target tokens
    const D = Array.from({ length: N }, () => Array(N).fill(Infinity));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (i !== j) {
                D[i][j] = getDistance(tokens[i], tokens[j]);
            }
        }
    }

    const visited = new Set([0]); // Start with the initial target (index 0)

    // Prim's Algorithm loop
    while (visited.size < N) {
        const bestParent = {};
        const bestDist = {};
        let globalMinDist = Infinity;

        // For each unvisited node v, find its best parent u in visited and the minimum distance
        for (let v = 0; v < N; v++) {
            if (!visited.has(v)) {
                let minDistToV = Infinity;
                let parentOfV = -1;
                for (const u of visited) {
                    if (D[u][v] < minDistToV) {
                        minDistToV = D[u][v];
                        parentOfV = u;
                    }
                }
                if (parentOfV !== -1) {
                    bestDist[v] = minDistToV;
                    bestParent[v] = parentOfV;
                    if (minDistToV < globalMinDist) {
                        globalMinDist = minDistToV;
                    }
                }
            }
        }

        if (globalMinDist === Infinity) {
            break; // No more reachable nodes
        }

        // Find all unvisited nodes v whose shortest distance to the tree is within globalMinDist + fudge
        const threshold = globalMinDist + fudge;
        let addedAny = false;

        for (let v = 0; v < N; v++) {
            if (!visited.has(v) && bestDist[v] <= threshold) {
                const u = bestParent[v];
                A[u][v] = 0;
                visited.add(v);
                addedAny = true;
            }
        }

        if (!addedAny) {
            break; // Safety breakout to prevent infinite loops
        }
    }

    return A;
}

/**
 * Standard sleep utility.
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Propagates the "little bolts" (electric arcs) along the MST adjacency tree.
 */
async function propagateLittleBolts(nodeIndex, sourceToken, targetTokens, A, N, propagationDelay) {
    const currentToken = targetTokens[nodeIndex];
    const children = [];
    for (let j = 0; j < N; j++) {
        if (A[nodeIndex][j] === 0) {
            children.push(j);
        }
    }

    const seq = new Sequence();
    seq.effect()
        .file(closest("jb2a.electric_arc.blue02"))
        .atLocation(sourceToken)
        .stretchTo(currentToken, { onlyX: true })
        .duration(1000)
        .fadeIn(250)
        .fadeOut(750)
        .belowTokens()
        .animateProperty("sprite", "height", { from: -2, to: -1, duration: 200, gridUnits: true })
        .opacity(0.75);

    // Play the little bolt (non-blocking)
    seq.play();

    // Configurable stagger delay (propagationDelay) for cascading flow
    await sleep(propagationDelay);

    if (children.length > 0) {
        await Promise.all(children.map(childIndex => 
            propagateLittleBolts(childIndex, currentToken, targetTokens, A, N, propagationDelay)
        ));
    } else {
        // Let the final leaf node's arc finish fading slightly
        await sleep(100);
    }
}

/**
 * Propagates the "big bolts" (primary/secondary chain lightning) along the MST adjacency tree.
 */
async function propagateBigBolts(nodeIndex, sourceToken, targetTokens, A, N, caster, propagationDelay) {
    const currentToken = targetTokens[nodeIndex];
    const children = [];
    for (let j = 0; j < N; j++) {
        if (A[nodeIndex][j] === 0) {
            children.push(j);
        }
    }

    const seq = new Sequence();
    const isPrimary = (sourceToken === caster);
    const file = isPrimary 
        ? closest("jb2a.chain_lightning.primary.blue")
        : closest("jb2a.chain_lightning.secondary.blue");
        
    const offset = isPrimary
        ? { offset: { x: caster.document.width * 0.25 }, gridUnits: true, local: true }
        : { offset: { x: -0.1 }, gridUnits: true, local: true };

    // Big lightning bolt
    seq.effect()
        .file(file)
        .atLocation(sourceToken, offset)
        .stretchTo(currentToken)
        .zIndex(2);

    // Shake/copy sprite on impact
    seq.effect()
        .copySprite(currentToken)
        .attachTo(currentToken)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(250)
        .fadeOut(1250)
        .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .duration(2000)
        .opacity(0.25);

    // Play the big strike (non-blocking)
    seq.play();

    // If it's the primary bolt (caster to initial target), wait 800ms for it to hit.
    // Otherwise, use the configurable propagation delay.
    const staggerDelay = isPrimary ? 800 : propagationDelay;
    await sleep(staggerDelay);

    if (children.length > 0) {
        await Promise.all(children.map(childIndex => 
            propagateBigBolts(childIndex, currentToken, targetTokens, A, N, caster, propagationDelay)
        ));
    } else {
        // Let the final strike's visual effects linger
        await sleep(1200);
    }
}

/**
 * Creates the Adjacent Chain Lightning sequence effects.
 * @param {Token} token - The casting token.
 * @param {Array<Token>} targetTokens - An array of target tokens.
 * @param {object} config - Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token, targetTokens, config = {}) {
    config = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    if (!targetTokens || targetTokens.length === 0) {
        console.warn("Chain Lightning (Adjacent): No targets provided.");
        return new Sequence();
    }

    const masterSequence = new Sequence();

    masterSequence.thenDo(async () => {
        const N = targetTokens.length;
        const A = buildAdjacencyMatrix(targetTokens, config.fudgeFactor);

        // Phase 1: Start little bolts propagation (non-blocking)
        const littleBoltsPromise = propagateLittleBolts(0, token, targetTokens, A, N, config.propagationDelay);

        // Wait releaseDelay from the start of the initial little bolt
        await sleep(config.releaseDelay);

        // Phase 2: Start big bolts propagation
        const bigBoltsPromise = propagateBigBolts(0, token, targetTokens, A, N, token, config.propagationDelay);

        // Wait for both trees to fully complete before finishing the sequence
        await Promise.all([littleBoltsPromise, bigBoltsPromise]);
    });

    return masterSequence;
}

/**
 * Plays the Adjacent Chain Lightning animation.
 * @param {Token} token - The casting token.
 * @param {Array<Token>} targetTokens - An array of target tokens.
 * @param {object} options - Options for playing the animation, including config.
 */
async function play(token, targetTokens, config = {}) {
    const sequence = await create(token, targetTokens, config);
    sequence.play({ preload: true });
}

export const chainLightningAdjacent = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
