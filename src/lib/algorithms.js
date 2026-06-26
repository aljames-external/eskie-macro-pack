/**
 * Constructs a Minimum Spanning Tree (MST) using Prim's algorithm with an optional fudge factor.
 * Returns a directed adjacency matrix where A[i][j] === 0 represents an edge from node i to node j in the MST.
 * 
 * @param {Array<any>} nodes - The array of nodes to build the MST for (starts at index 0).
 * @param {Function} getDistance - A callback function (node1, node2) => number that returns the distance between two nodes.
 * @param {number} [fudgeFactor=0] - The fudge factor to allow grouping close nodes.
 * @returns {Array<Array<number>>} An N x N adjacency matrix where 0 represents an edge and Infinity represents no edge.
 */
export function primMST(nodes, getDistance, fudgeFactor = 0) {
    const N = nodes.length;
    const A = Array.from({ length: N }, () => Array(N).fill(Infinity));
    if (N <= 1) return A;
    
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
        let minDist = Infinity;
        let bestU = -1;
        let bestV = -1;

        // Find the absolute shortest edge connecting a visited node 'u' to an unvisited node 'v'
        for (const u of visited) {
            for (let v = 0; v < N; v++) {
                if (!visited.has(v)) {
                    if (D[u][v] < minDist) {
                        minDist = D[u][v];
                        bestU = u;
                        bestV = v;
                    }
                }
            }
        }

        if (minDist === Infinity) {
            break; // No more reachable nodes
        }

        if (fudgeFactor === 0) {
            A[bestU][bestV] = 0;
            visited.add(bestV);
        } else {
            A[bestU][bestV] = 0;
            visited.add(bestV);
            
            // Find all unvisited nodes w whose distance from bestU is within minDist + fudgeFactor
            for (let w = 0; w < N; w++) {
                if (!visited.has(w) && w !== bestV) {
                    if (D[bestU][w] <= minDist + fudgeFactor) {
                        A[bestU][w] = 0;
                        visited.add(w);
                    }
                }
            }
        }
    }

    return A;
}

export const algorithms = {
    primMST
};
