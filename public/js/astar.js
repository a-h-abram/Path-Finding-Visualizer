/**
 * Implementation of A* algorithm
 * @param graph
 * @param node
 * @param endNodes
 * @param uberNodes
 * @returns {Promise<void>}
 */
let astar = async (graph, node, endNodes, uberNodes) => {
    if (!node || endNodes.length < 0) {
        console.log("Start node and/or end nodes are missing");
        return;
    }

    await setupGraphForAstar(graph);

    let openList = []; // testing nodes
    let closedList = []; // saving path to the end
    let currentNode = null;
    let searchUber = (uberNodes.length > 0);
    let endNode = (searchUber) ? await getClosestUberNode(node, uberNodes)
        : await getClosestEndNode(node, endNodes);

    openList.push(node);

    while (openList.length > 0) {
        let lowest = await getLowestNodeIndex(openList);

        currentNode = openList[lowest];

        openList.splice(lowest, 1);

        if (currentNode !== node && currentNode !== endNode) {
            await showSearchNodes(currentNode);
        }

        if (currentNode.x === endNode.x && currentNode.y === endNode.y) {

            if (searchUber) {
                searchUber = (uberNodes.length > 0);

                if (searchUber) {
                    node = currentNode;
                    closedList = [];
                    //closedList.push(currentNode);
                    openList = [];
                    openList.push(currentNode);
                }

                endNode = (searchUber) ? await getClosestUberNode(node, uberNodes)
                    : await getClosestEndNode(node, endNodes);



                continue;
            } else {

                console.log("A* has found a path");

                return displayFinalPath(await reconstructPath(currentNode));
            }
        }

        closedList.push(currentNode);

        for (let i = 0; i < currentNode.neighbours.length; i++) {
            let neighbour = currentNode.neighbours[i];

            if (closedList.includes(neighbour)) {
                continue;
            }


            let nCost = currentNode.cost + 1; // +1 cause we work on a simple grid n+1

            if (openList.includes(neighbour)) {
                if (nCost < neighbour.cost) {
                    neighbour.cost = nCost;
                }
            } else {
                neighbour.cost = nCost;
                openList.push(neighbour);
            }

            neighbour.parent = currentNode;
            neighbour.heuristic = getDistance(neighbour, endNode);
            neighbour.fScore = neighbour.cost + neighbour.heuristic;
        }

    }

    console.log("A* didn't find any path :(");
};

let getLowestNodeIndex = async (nodes) => {
    let lowest = 0;

    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].fScore < nodes[lowest].fScore) {
            lowest = i;
        }
    }

    return lowest;
};

/**
 * Return the distance between 2 nodes (vector2)
 * @param node1
 * @param node2
 * @returns {number}
 */
let getDistance = (node1, node2) => {
    let x = getAbsoluteValue(node1.x, node2.x);
    let y = getAbsoluteValue(node1.y, node2.y);
    let dist = Math.sqrt((x * x) + (y * y));

    return (dist < 0) ? dist * -1 : dist;
};

/**
 * This method is a basic way using pythagore formula to get the closest end point
 * This is absolutly not accurate, especially in maze
 * @returns {Promise<void>}
 */
let getClosestEndNode = async (startNode, endNodes) => {
    let minDistance = Number.MAX_SAFE_INTEGER;
    let closestNode;

    for (let i = 0; i < endNodes.length; i++) {
        let distance = getDistance(endNodes[i], startNode);

        if (distance < minDistance) {
            minDistance = distance;
            closestNode = endNodes[i];
        }
    }

    return closestNode;
};

let getClosestUberNode = async (startNode, uberNodes) => {
    let minDistance = Number.MAX_SAFE_INTEGER;
    let closestNode;
    let nodeIndex;

    for (let i = 0; i < uberNodes.length; i++) {
        console.log(uberNodes[i].x + " " + uberNodes[i].y);

        let distance = getDistance(uberNodes[i], startNode);

        if (distance < minDistance) {
            minDistance = distance;
            closestNode = uberNodes[i];
            nodeIndex = i;
        }
    }

    uberNodes.splice(nodeIndex, 1);

    return closestNode;
};

let getAbsoluteValue = (nbr1, nbr2) => {
    if (nbr1 < nbr2) {
        return (nbr2 - nbr1);
    }

    return nbr1 - nbr2;
};

let setupGraphForAstar = async (graph) => {
    for (let y = 0; y < graph.height; y++) {
        for (let x = 0; x < graph.width; x++) {
            graph.nodes[y][x].neighbours = (graph.useWalls) ? getAccessibleNeighboursByWalls(graph.nodes[y][x])
                : getAccessibleNeighboursWhithoutWalls(graph.nodes[y][x]);
        }
    }
};

let reconstructPath = async (node) => {
    let path = [];
    let lastNode = node;

    while (lastNode) {
        path.push(lastNode);
        lastNode = lastNode.parent;
    }

    return path;
};

let displayFinalPath = async (path) => {
    for (let i = path.length - 2; i > 0; i--) { // avoiding first node & last node
        if (path[i].state !== nodeState.Wall) {
            await showFinalPathNode(path[i]);
        }

    }
};