/**
 * We setup everything here (methods, ...)
 */

let isFinding = false; // state to avoid multiple sort process at the time
let pathAlreadyFound = false;
let isStartNode = false;
let isEndNode = false;
let startNodes = [];
let endNodes = [];
let uberNodes = [];
let isMazeGenerated = false; // we use this var to know if we need to care about walls or not for PFA
let algoHasBeenLaunched = false;

/**
 * Selection variables
 */
let isMouseDown = false;

let nodeSelection = {
    0: false, // start points
    1: false, // end points
    2: false, // uber points
    3: true // walls
};

let lastNodeSelection = 3;

let algoSelection = {
    0: true, // A*
    1: false, // Djikstra
};

let lastAlgoSelected = 0;


let graph; // contains all the div nodes

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let generateNewGraph = async () => {
    const width = Math.round($(".graph-nodes").width() / 33);
    const height = Math.round($(".graph-nodes").height() / 33);

    isMazeGenerated = false;
    isStartNode = false;
    isEndNode = false;
    startNodes = [];
    endNodes = [];
    uberNodes = [];

    graph = new Graph(width, height, false, false);

    let lastY = -1;

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {
            graph.addNode(x, y, null, (lastY !== y));
            lastY = y;
        }
    }

    await graph.setupLinks();
};

let resetGraph = async () => {
    $(".graph-nodes").empty();
    await generateNewGraph();
};

let nodeSelected = (x, y, mouseDown = false, mouseUp = false) => {
    if ((!mouseDown && !isMouseDown) || isMazeGenerated || isFinding) {
        return;
    }

    let nodeId = "#node-" + x + '-' + y;

    if (nodeSelection[3] && $(nodeId).hasClass("node-wall") === false) {
        let currentState = graph.nodes[y][x].state;

        if (currentState === nodeState.Start || currentState === nodeState.End || currentState === nodeState.Uber) {
            return;
        }

        graph.nodes[y][x].state = nodeState.Wall;
        $(nodeId).addClass("node-wall");

        if (algoHasBeenLaunched && mouseUp) {
            launchPathFinding();
        }
    } else if (nodeSelection[0] && !isStartNode && $(nodeId).hasClass("node-start") === false) {
        if (graph.nodes[y][x].state !== nodeState.Blank) {
            return;
        }

        isStartNode = true;
        $(nodeId).addClass("node-start");
        graph.nodes[y][x].state = nodeState.Start;
        startNodes.push(graph.nodes[y][x]);
    } else if (nodeSelection[1] && $(nodeId).hasClass("node-end") === false) {
        if (isEndNode) {
            if (graph.nodes[y][x].state === nodeState.End) {
                // TODO: drag node
            }

            return;
        }

        if (graph.nodes[y][x].state !== nodeState.Blank) {
            return;
        }

        isEndNode = true;
        graph.nodes[y][x].state = nodeState.End;
        endNodes.push(graph.nodes[y][x]);
        $(nodeId).addClass("node-end");
    } else if (nodeSelection[2] && $(nodeId).hasClass("node-uber") === false) {
        if (graph.nodes[y][x].state !== nodeState.Blank) {
            return;
        }

        graph.nodes[y][x].state = nodeState.Uber;
        uberNodes.push(graph.nodes[y][x]);
        $(nodeId).addClass("node-uber");
    }
};

let handleChangeSelection = (id) => {
    $('#node-selection-' + lastNodeSelection).removeClass("active");

    nodeSelection[lastNodeSelection] = false;
    nodeSelection[id] = true;

    lastNodeSelection = id;

    $('#node-selection-' + id).addClass("active");
};

let changeSelection = (id) => {
    if (id === lastNodeSelection) {
        return;
    }

    switch (id) {
        case 0: // start point
            handleChangeSelection(id);
            break;
        case 1: // end point
            handleChangeSelection(id);
            break;
        case 2: // uber point
            handleChangeSelection(id);
            break;
        case 3: // walls
            handleChangeSelection(id);
            break;
    }
};

let handleAlgorithmSelected = (id) => {
    $('#algorithm-' + lastAlgoSelected).removeClass("active");

    algoSelection[lastAlgoSelected] = false;
    algoSelection[id] = true;

    lastAlgoSelected = id;

    $('#algorithm-' + id).addClass("active");
};

let changeAlgorithm = (id) => {
    if (id === lastAlgoSelected || id >= algoSelection.length) {
        return;
    }

    switch (id) {
        case 0: // start point
            handleAlgorithmSelected(id);
            $('#node-selection-2').removeClass('disabled');
            break;
        case 1: // end point
            handleAlgorithmSelected(id);
            $('#node-selection-2').addClass('disabled');
            break;
    }
};

let launchPathFinding = async () => {
    if (isFinding) {
        return;
    }

    if (!isStartNode || !isEndNode) {
        console.log("There is no start and/or end node (required)");
        return;
    }

    isFinding = true;

    let finalPath = [];
    let startNode = startNodes[0];

    if (lastAlgoSelected !== 1 && uberNodes && uberNodes.length > 0) { // searching in first the uber nodes if they exist
        for (let i = 0 ; i < uberNodes.length ; i++) {
            switch (lastAlgoSelected) {
                case 0:
                    finalPath.push(...await astar(graph, startNode, endNodes, uberNodes[i]));
                    break;
                case 1:
                    finalPath.push(...await djikstra(graph, startNode, true));
                    break;
                default:
                    finalPath.push(...await astar(graph, startNode, endNodes, uberNodes[i]));
                    break;
            }

            await graph.resetGraphData();

            startNode = uberNodes[i];
        }
    }

    // then searching the path to the end nodes
    switch (lastAlgoSelected) {
        case 0:
            finalPath.push(...await astar(graph, startNode, endNodes, null));
            break;
        case 1:
            finalPath.push(...await djikstra(graph, startNode, false));
            break;
        default:
            finalPath.push(...await astar(graph, startNode, endNodes, null));
            break;
    }

    await displayFinalPath(finalPath);

    algoHasBeenLaunched = true;
    pathAlreadyFound = true;
    isFinding = false;
};

/**
 ***********************************************************************************************************************
 *************************************************** Maze Generation ***************************************************
 ***********************************************************************************************************************
 */

/**
 * The algorithm used to generate a maze is the recursive backtracking
 * @returns {Promise<void>}
 */
let generateMaze = async() => {
    isMazeGenerated = true;

    await resetGraph();

    graph.useWalls = true;

    await defineStartAndEndPoints();

    await recursiveBacktracker();

    await clearMazeColor();

    console.log("A maze has been generated");
};

let defineStartAndEndPoints = async() => {
    if (!isStartNode) {
        let x = Math.floor(Math.random() * graph.width);
        let y = Math.floor(Math.random() * graph.height);

        graph.nodes[y][x].state = nodeState.Start;
        graph.startNode = graph.nodes[y][x];
        startNodes.push(graph.nodes[y][x]);
        $('#node-' + x + "-" + y).addClass("node-start");
        isStartNode = true;
    }

    if (!isEndNode) {
        let x = Math.floor(Math.random() * graph.width);
        let y = Math.floor(Math.random() * graph.height);

        graph.nodes[y][x].state = nodeState.End;
        endNodes.push(graph.nodes[y][x]);
        $('#node-' + x + "-" + y).addClass("node-end");
        isEndNode = true;
    }
};

let recursiveBacktracker = async() => {
    if (startNodes.length <= 0) {
        console.log("No start nodes");
        return;
    }

    let stack = []; // backtrack stack -> unpile it when no neighbours

    // We start with one of our start point
    let startNode = startNodes[0];
    let currentNode = graph.nodes[startNode.y][startNode.x];
    let neighbours = [];

    while (20) {
        currentNode.visited = true;

        if (currentNode.state === nodeState.Blank) {
            $('#node-' + currentNode.x + '-' + currentNode.y).addClass('node-maze-animated');
        }


        neighbours = await getNeighbours(currentNode);

        if (neighbours.length <= 0) {
            let shallContinue = false;
            let lastNode = currentNode;

            while (stack.length > 0) {
                currentNode = stack.pop();

                neighbours = await getNeighbours(currentNode);

                if (neighbours.length > 0) {
                    shallContinue = true;
                    break;
                }
            }

            if (!shallContinue) {
                await setEndPoint(lastNode);
                endNodes.push(lastNode);
                isEndNode = true;

                return;
            }
        }

        let neighbourNode = await getRandomNeighbour(neighbours);

        await updateNodesWalls(currentNode, neighbourNode);

        stack.push(currentNode);

        currentNode = neighbourNode;

        await sleep(1);
    }
};

let updateNodesWalls = async(currentNode, neighbourNode) => {
    let x = currentNode.x - neighbourNode.x;

    if (x === 1) {
        currentNode.walls[3] = false;
        neighbourNode.walls[1] = false;
        $('#node-' + currentNode.x + '-' + currentNode.y).css('border-left', '0');
        $('#node-' + neighbourNode.x + '-' + neighbourNode.y).css('border-right', '0');
    } else if (x === - 1) {
        currentNode.walls[1] = false;
        neighbourNode.walls[3] = false;
        $('#node-' + currentNode.x + '-' + currentNode.y).css('border-right', '0');
        $('#node-' + neighbourNode.x + '-' + neighbourNode.y).css('border-left', '0');
    }

    let y = currentNode.y - neighbourNode.y;

    if (y === 1) {
        currentNode.walls[0] = false;
        neighbourNode.walls[2] = false;
        $('#node-' + currentNode.x + '-' + currentNode.y).css('border-top', '0');
        $('#node-' + neighbourNode.x + '-' + neighbourNode.y).css('border-bottom', '0');
    } else if (y === -1) {
        currentNode.walls[2] = false;
        neighbourNode.walls[0] = false;
        $('#node-' + currentNode.x + '-' + currentNode.y).css('border-bottom', '0');
        $('#node-' + neighbourNode.x + '-' + neighbourNode.y).css('border-top', '0');
    }
};

let setEndPoint = async(node) => {
    node.state = nodeState.End;

    if (node.y - 1 >= 0) {
        node.walls[0] = false;
        $('#node-' + node.x + '-' + node.y).css('border-top', '0');

        if (node.top) {
            node.top.walls[2] = false;
            $('#node-' + node.top.x + '-' + node.top.y).css('border-bottom', '0');
        }
    } if (node.y + 1 < graph.height) {
        node.walls[2] = false;
        $('#node-' + node.x + '-' + node.y).css('border-bottom', '0');

        if (node.bot) {
            node.bot.walls[0] = false;
            $('#node-' + node.bot.x + '-' + node.bot.y).css('border-top', '0');
        }
    } if (node.x - 1 >= 0) {
        node.walls[3] = false;
        $('#node-' + node.x + '-' + node.y).css('border-left', '0');

        if (node.left) {
            node.left.walls[1] = false;
            $('#node-' + node.left.x + '-' + node.left.y).css('border-right', '0');
        }
    } if (node.x + 1 < graph.width) {
        node.walls[1] = false;
        $('#node-' + node.x + '-' + node.y).css('border-right', '0');

        if (node.right) {
            node.right.walls[3] = false;
            $('#node-' + node.right.x + '-' + node.right.y).css('border-left', '0');
        }
    }

    $('#node-' + node.x + "-" + node.y).addClass("node-end");
};

let clearMazeColor = async() => {
    let delay = 0;

    for (let y = 0 ; y < graph.height ; y++) {
        for (let x = 0 ; x < graph.width ; x++) {
            if (graph.nodes[y][x].state === nodeState.Blank) {
                setTimeout(function() {
                    $('#node-' + x + "-" + y).addClass('node-maze-finished-animated');

                    setTimeout(function() {
                        $('#node-' + x + "-" + y).removeClass('node-maze-finished-animated');
                        $('#node-' + x + "-" + y).removeClass('node-maze-animated');
                    }, 700);


                }, delay);

                delay += 5;
            }
        }
    }
};

/**
 * Below is the "main" fcnt
 */

$(document).ready(() => {
    document.body.onmousedown = () => {
        isMouseDown = true;
    };

    document.body.onmouseup = () => {
        isMouseDown = false;
    };

    generateNewGraph();
});
