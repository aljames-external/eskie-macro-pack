// Original Author: .eskie
// Adjacency Matrix Refactoring: Antigravity

import { closest } from "../../../lib/filemanager.js";

const DEFAULT_CONFIG = {};

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
 * Constructs the adjacency matrix based on closest positive distances,
 * ensuring each token is visited exactly once.
 */
function buildAdjacencyMatrix(tokens) {
    const N = tokens.length;
    const A = Array.from({ length: N }, () => Array(N).fill(Infinity));

    // 1. Initialize matrix with distances
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (i !== j) {
                A[i][j] = getDistance(tokens[i], tokens[j]);
            }
        }
    }

    const visited = new Set([0]);
    const queue = [0];

    while (queue.length > 0) {
        const rowIndex = queue.shift();
        const row = A[rowIndex];

        // 3a. Set all entries corresponding to already visited rows to Infinity
        for (let j = 0; j < N; j++) {
            if (visited.has(j) && row[j] !== 0) {
                row[j] = Infinity;
            }
        }

        // Find the smallest positive integer in this row
        let minVal = Infinity;
        for (let j = 0; j < N; j++) {
            if (row[j] > 0 && row[j] < minVal) {
                minVal = row[j];
            }
        }

        // Set the smallest to 0, all others to Infinity
        if (minVal !== Infinity) {
            for (let j = 0; j < N; j++) {
                if (row[j] === minVal) {
                    row[j] = 0;
                    // If we haven't visited this target yet, mark it visited and queue it
                    if (!visited.has(j)) {
                        visited.add(j);
                        queue.push(j);
                    }
                } else if (row[j] !== 0) {
                    row[j] = Infinity;
                }
            }
        } else {
            // No positive integers left, set everything else to Infinity
            for (let j = 0; j < N; j++) {
                if (row[j] !== 0) {
                    row[j] = Infinity;
                }
            }
        }
    }

    return A;
}

/**
 * Standard sleep utility.
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Propagates the "little bolts" (electric arcs) along the adjacency tree.
 */
async function propagateLittleBolts(nodeIndex, sourceToken, targetTokens, A, N) {
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

    // Stagger the next connections by 500ms for a cascading flow
    await sleep(500);

    if (children.length > 0) {
        await Promise.all(children.map(childIndex => 
            propagateLittleBolts(childIndex, currentToken, targetTokens, A, N)
        ));
    } else {
        // Let the final leaf node's arc finish fading
        await sleep(500);
    }
}

/**
 * Propagates the "big bolts" (primary/secondary chain lightning) along the adjacency tree.
 */
async function propagateBigBolts(nodeIndex, sourceToken, targetTokens, A, N, caster) {
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

    // Wait 800ms for the lightning to connect/strike before propagating further
    await sleep(800);

    if (children.length > 0) {
        await Promise.all(children.map(childIndex => 
            propagateBigBolts(childIndex, currentToken, targetTokens, A, N, caster)
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
        const A = buildAdjacencyMatrix(targetTokens);

        // Phase 1: Little bolts propagate first, pre-charging the path
        await propagateLittleBolts(0, token, targetTokens, A, N);

        // Phase 2: Big bolts follow the exact same paths to deliver the final strike
        await propagateBigBolts(0, token, targetTokens, A, N, token);
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
