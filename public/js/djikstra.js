/**
 * Implementation of Djikstra algorithm
 * @param graph
 * @param startNode
 * @param searchUber
 * @returns {Promise<void>}
 */
let djikstra = async(graph, startNode, searchUber) => {
    await setupGraphForDjikstra(graph, startNode);

    let queue = [];
    let currentNode = null;

    queue.push(await getSmallestNode(graph));

    while (await getNbrVisitedNodes(graph) < (graph.width * graph.height)) {
        currentNode = await getSmallestNode(graph);

        currentNode.visited = true;

        queue.push(currentNode);

        if (!searchUber && currentNode.state === nodeState.End || searchUber && currentNode.state === nodeState.Uber) {
            console.log("Djikstra has found a path");

            return reconstructPath(currentNode);
        }

        for (let i = 0 ; i < currentNode.neighbours.length ; i++) {
            let neighbour = currentNode.neighbours[i];

            if (neighbour.visited) {
                continue;
            }

            let dist = getDistance(currentNode, startNode) + currentNode.weight;

            if (dist < neighbour.cost) {
                neighbour.cost = dist;
                neighbour.parent = currentNode;
                neighbour.visited = false;
                queue.push(neighbour);

                if (neighbour.state !== nodeState.Start && neighbour.state !== nodeState.Uber
                    && neighbour.state !== nodeState.End) {
                    await showSearchNodes(neighbour);
                }
            }
        }
    }

    console.log("Djikstra didn't find a path");
};

let setupGraphForDjikstra = async(graph, startNode) => {
    for (let y = 0; y < graph.height; y++) {
        for (let x = 0; x < graph.width; x++) {
            graph.nodes[y][x].cost = Number.MAX_SAFE_INTEGER;

            if (graph.nodes[y][x] === startNode) {
                graph.nodes[y][x].cost = 0;
            }

            graph.nodes[y][x].visited = false;
            graph.nodes[y][x].neighbours = (graph.useWalls) ? getAccessibleNeighboursByWalls(graph.nodes[y][x])
                : getAccessibleNeighboursWhithoutWalls(graph.nodes[y][x]);
        }
    }
};

let getNbrVisitedNodes = async(graph) => {
    let count = 0;

    for (let y = 0; y < graph.height; y++) {
        for (let x = 0; x < graph.width; x++) {
            if (graph.nodes[y][x].visited) {
                count++;
            }
        }
    }

    return count;
};

let getSmallestNode = async(graph) => {
    let lowestX = 0;
    let lowestY = 0;

    for (let y = 0; y < graph.height ; y++) {
        for (let x = 0 ; x < graph.width ; x++) {
            if (graph.nodes[lowestY][lowestX].visited && !graph.nodes[y][x].visited) {
                lowestX = x;
                lowestY = y;
            }

            if (!graph.nodes[y][x].visited && graph.nodes[y][x].cost < graph.nodes[lowestY][lowestX].cost) {
                lowestX = x;
                lowestY = y;
            }
        }
    }

    return graph.nodes[lowestY][lowestX];
};
