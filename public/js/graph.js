const nodeState = {
    Blank: 0,
    Wall: 1,
    Start: 2,
    End: 3,
    Uber: 4
};

const nodeColor = {
    blank: "#eeeeee",
    path: "#ff6f4b",
    passed: "#a11477" // parsing passed here
};

class Graph {

    // A node is composed with data, right, left

    constructor(width, height, directed, weighted) {
        this.nodes = [[]];
        this.directed = directed;
        this.weighted = weighted;
        this.width = width;
        this.height = height;
        this.useWalls = false;
    }

    /**
     * Add a node inside the graph
     * @param x
     * @param y
     * @param nodeData
     * @param alloc
     * @returns {{left: null, right: null, top: null, bot: null, weight: *, color: string, direction: *}}
     */
    addNode = (x, y, nodeData, alloc = false) => {
        let node = {
            x: x,
            y: y,
            left: null,
            right: null,
            top: null,
            bot: null,
            topLeft: null,
            topRight: null,
            botLeft: null,
            botRight: null,
            parent: null,
            neighbours: [],
            heuristic: 0, // distance from node to end node
            cost: 0,
            fScore: 0, // A*
            weight: (this.weighted) ? (Math.random() * 10) : 1,
            color: nodeColor.blank,
            state: nodeState.Blank,
            walls: [true, true, true, true], // top, right, bot, left
            visited: false,
            direction: (this.directed) ? {
                from: nodeData.from,
                to: nodeData.to
            } : null
        };

        if (alloc) {
            this.nodes[y] = [];
            $('.graph-nodes').append('<div class="row" id="row-' + y + '"></div>');
        }

        this.nodes[y][x] = node;

        $('#row-' + y).append('<div class="node node-blank"><div class="node node-blank" id="node-' + x + '-' + y + '" data-x="' + x
            + '" data-y="' + y + '" onmousedown="nodeSelected(' + x + ',' + y + ', true)" onmouseenter="nodeSelected(' + x + ',' + y + ', false)" ' +
            'onmouseup="nodeSelected(' + x + ',' + y + ', false, true)"></div></div>');

        let nodeId = "#node-" + x + "-" + y;

        if (node.walls[0]) {
            $(nodeId).css('border-top', '1px solid #000000');
        }
        if (node.walls[1]) {
            $(nodeId).css('border-right', '1px solid #000000');
        }
        if (node.walls[2]) {
            $(nodeId).css('border-bottom', '1px solid #000000');
        }
        if (node.walls[0]) {
            $(nodeId).css('border-left', '1px solid #000000');
        }

        return node;
    };

    setupLinks = async () => {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.directed) {
                    if (x - 1 >= 0) {
                        this.nodes[y][x].left = this.nodes[y][x - 1];
                    }
                    if (x + 1 < this.width) {
                        this.nodes[y][x].right = this.nodes[y][x + 1];
                    }
                    if (y - 1 >= 0) {
                        this.nodes[y][x].top = this.nodes[y - 1][x];
                    }
                    if (y + 1 < this.height) {
                        this.nodes[y][x].bot = this.nodes[y + 1][x];
                    }
                    if (x - 1 >= 0 && y - 1 >= 0) {
                        this.nodes[y][x].topLeft = this.nodes[y - 1][x - 1];
                    }
                    if (x + 1 < this.width && y - 1 >= 0) {
                        this.nodes[y][x].topRight = this.nodes[y - 1][x + 1];
                    }
                    if (x - 1 >= 0 && y + 1 < this.height) {
                        this.nodes[y][x].botLeft = this.nodes[y + 1][x - 1];
                    }
                    if (x + 1 < this.width && y + 1 < this.height) {
                        this.nodes[y][x].botRight = this.nodes[y + 1][x + 1];
                    }
                } else {
                    // setup a direction
                }
            }
        }
    };

    resetGraphData = async() => {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.nodes[y][x].parent = null;
                this.nodes[y][x].heuristic = 0;
                this.nodes[y][x].fScore = 0;
                this.nodes[y][x].cost = 0;
                this.nodes[y][x].visited = false;
            }
        }
    };
}

let getNeighbours = async (node) => {
    let neighbours = [];

    if (node.top && !node.top.visited) {
        neighbours.push(node.top);
    }
    if (node.right && !node.right.visited) {
        neighbours.push(node.right);
    }
    if (node.bot && !node.bot.visited) {
        neighbours.push(node.bot);
    }
    if (node.left && !node.left.visited) {
        neighbours.push(node.left);
    }

    return neighbours;
};

let getRandomNeighbour = async (neighbours) => {
    if (neighbours.length > 0) {
        let randIndex = Math.floor(Math.random() * neighbours.length);

        return neighbours[randIndex];
    }

    return null;
};

let getAccessibleNeighboursByWalls = (node) => {
    let neighbours = [];

    if (node.top && !node.walls[0]) {
        neighbours.push(node.top);
    }
    if (node.right && !node.walls[1]) {
        neighbours.push(node.right);
    }
    if (node.bot && !node.walls[2]) {
        neighbours.push(node.bot);
    }
    if (node.left && !node.walls[3]) {
        neighbours.push(node.left);
    }

    return neighbours;
};

let getAccessibleNeighboursWhithoutWalls = (node) => {
    let neighbours = [];

    if (node.top && node.top.state !== nodeState.Wall) {
        neighbours.push(node.top);
    }
    if (node.right && node.right.state !== nodeState.Wall) {
        neighbours.push(node.right);
    }
    if (node.bot && node.bot.state !== nodeState.Wall) {
        neighbours.push(node.bot);
    }
    if (node.left && node.left.state !== nodeState.Wall) {
        neighbours.push(node.left);
    }
    /*if (node.topLeft && node.topLeft.state !== nodeState.Wall && (node.left.state !== nodeState.Wall
            || node.top.state !== nodeState.Wall)) {
            neighbours.push(node.topLeft);
        } if (node.topRight && node.topRight.state !== nodeState.Wall && (node.right.state !== nodeState.Wall
            || node.top.state !== nodeState.Wall)) {
            neighbours.push(node.topRight);
        } if (node.botLeft && node.botLeft.state !== nodeState.Wall && (node.left.state !== nodeState.Wall
            || node.bot.state !== nodeState.Wall)) {
            neighbours.push(node.botLeft);
        } if (node.botRight && node.botRight.state !== nodeState.Wall && (node.right.state !== nodeState.Wall
            || node.bot.state !== nodeState.Wall)) {
            neighbours.push(node.botRight);
        }*/

    return neighbours;
};

let showSearchNodes = async (node) => {
    $('#node-' + node.x + '-' + node.y).addClass("node-visited-animated");

    setTimeout(() => {
        $('#node-' + node.x + '-' + node.y).parent().addClass("node-visited");
    }, 400);

    await sleep(1);
};

let showFinalPathNode = async (node) => {
    if ($('#node-' + node.x + '-' + node.y).hasClass("node-visited-animated")) {
        $('#node-' + node.x + '-' + node.y).removeClass("node-visited-animated")
    }

    $('#node-' + node.x + '-' + node.y).addClass("node-path-animated");

    setTimeout(() => {
        if ($('#node-' + node.x + '-' + node.y).parent().hasClass("node-visited")) {
            $('#node-' + node.x + '-' + node.y).parent().removeClass("node-visited")
        }

        $('#node-' + node.x + '-' + node.y).parent().addClass("node-path");
    }, 400);

    await sleep(1);
};
