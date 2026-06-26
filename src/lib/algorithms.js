/**
 * Constructs a Minimum Spanning Tree (MST) using Prim's algorithm, extended with a fudgeFactor.
 * This implementation uses a priority queue (min-heap-like) where we pop a batch of edges 
 * whose consecutive weight gaps are within the fudgeFactor, ensuring clean parallel branching 
 * without cycles or multiple parents, and preventing new edges from immediately dominating the queue.
 * 
 * @param {Array<any>} nodes - The array of nodes to build the MST for (starts at index 0).
 * @param {number} [fudgeFactor=0] - Distance threshold allowance for parallel branching.
 * @param {Function} getDistance - A callback function (node1, node2) => number that returns the distance between two nodes.
 * @returns {Array<Array<number>>} An N x N adjacency matrix where 0 represents an edge and Infinity represents no edge.
 */
export function primMST(nodes, fudgeFactor = 0, getDistance) {
    const N = nodes.length;
    const A = Array.from({ length: N }, () => Array(N).fill(Infinity));
    
    // Negative fudge factors default to 0
    const fudge = Math.max(0, fudgeFactor);

    // 1. Precompute 3D distances between all nodes
    const D = Array.from({ length: N }, () => Array(N).fill(Infinity));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (i !== j) {
                D[i][j] = getDistance(nodes[i], nodes[j]);
            }
        }
    }

    const visited = new Set([0]);
    const edges = [];

    // Push all initial outgoing edges from the root node (index 0)
    for (let v = 1; v < N; v++) {
        edges.push({ u: 0, v, w: D[0][v] });
    }
    edges.sort((a, b) => a.w - b.w);

    while (visited.size < N && edges.length > 0) {
        const batch = [];
        let lastWeight = -1;

        // Pop a batch of edges whose consecutive gaps are within the fudge factor
        while (edges.length > 0) {
            const nextEdge = edges[0];
            
            if (lastWeight === -1) {
                // First element in the batch
                edges.shift();
                if (!visited.has(nextEdge.v)) {
                    batch.push(nextEdge);
                    lastWeight = nextEdge.w;
                }
            } else {
                const gap = nextEdge.w - lastWeight;
                if (gap > fudge) {
                    break; // Gap is larger than the fudge factor, stop the batch
                }
                edges.shift();
                if (!visited.has(nextEdge.v)) {
                    batch.push(nextEdge);
                    lastWeight = nextEdge.w;
                }
            }
        }

        const newlyVisited = [];

        // Choose all edges in the batch that do not form a loop/cycle
        for (const edge of batch) {
            if (!visited.has(edge.v)) {
                A[edge.u][edge.v] = 0;
                visited.add(edge.v);
                newlyVisited.push(edge.v);
            }
        }

        // Only after the entire batch is connected, add new outgoing edges to the queue
        if (newlyVisited.length > 0) {
            for (const newV of newlyVisited) {
                for (let nextV = 0; nextV < N; nextV++) {
                    if (!visited.has(nextV)) {
                        edges.push({ u: newV, v: nextV, w: D[newV][nextV] });
                    }
                }
            }
            // Re-sort the queue with the new edges
            edges.sort((a, b) => a.w - b.w);
        }
    }

    return A;
}

/**
 * Constructs a Local Branching Tree where the fudgeFactor is applied locally
 * at each node's perspective rather than globally.
 * 
 * @param {Array<any>} nodes - The array of nodes to build the tree for (starts at index 0).
 * @param {number} [fudgeFactor=0] - Local distance threshold allowance for parallel branching.
 * @param {Function} getDistance - A callback function (node1, node2) => number that returns the distance between two nodes.
 * @returns {Array<Array<number>>} An N x N adjacency matrix where 0 represents an edge and Infinity represents no edge.
 */
export function localBranchingTree(nodes, fudgeFactor = 0, getDistance) {
    const N = nodes.length;
    const A = Array.from({ length: N }, () => Array(N).fill(Infinity));
    
    // Negative fudge factors default to 0
    const fudge = Math.max(0, fudgeFactor);
    const visited = new Set([0]);
    const queue = [0];

    // 1. Precompute distances between all nodes
    const D = Array.from({ length: N }, () => Array(N).fill(Infinity));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (i !== j) {
                D[i][j] = getDistance(nodes[i], nodes[j]);
            }
        }
    }

    // BFS-based local branching propagation
    while (queue.length > 0) {
        const u = queue.shift();

        // Find the minimum distance from u to any remaining unvisited node
        let localMinDist = Infinity;
        for (let v = 0; v < N; v++) {
            if (!visited.has(v)) {
                if (D[u][v] < localMinDist) {
                    localMinDist = D[u][v];
                }
            }
        }

        // If there are unvisited nodes reachable from u
        if (localMinDist !== Infinity) {
            const threshold = localMinDist + fudge;
            
            // Connect u to all unvisited nodes v within the threshold
            for (let v = 0; v < N; v++) {
                if (!visited.has(v) && D[u][v] <= threshold) {
                    A[u][v] = 0;
                    visited.add(v);
                    queue.push(v);
                }
            }
        }
    }

    return A;
}

export const algorithms = {
    primMST,
    localBranchingTree
};
