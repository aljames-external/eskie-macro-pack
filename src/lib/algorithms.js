/**
 * Constructs a Minimum Spanning Tree (MST) using Prim's algorithm, extended with a fudgeFactor.
 * Returns a directed adjacency matrix where A[i][j] === 0 represents an edge from node i to node j in the MST.
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

    // 1. Precompute distances between all nodes
    const D = Array.from({ length: N }, () => Array(N).fill(Infinity));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (i !== j) {
                D[i][j] = getDistance(nodes[i], nodes[j]);
            }
        }
    }

    const visited = new Set([0]); // Start with the root node (index 0)

    while (visited.size < N) {
        const bestParent = {};
        const bestDist = {};
        let globalMinDist = Infinity;

        // Find the shortest edge connecting a visited node 'u' to an unvisited node 'v'
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

export const algorithms = {
    primMST
};
