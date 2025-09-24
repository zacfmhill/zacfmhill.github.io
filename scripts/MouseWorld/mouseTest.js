// Point Class
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    addLine(line) {
        this.x += line.dx;
        this.y += line.dy;
    }
    subLine(line) {
        this.x -= line.dx;
        this.y -= line.dy;
    }
    toLine() {
        return new Line(this.x, this.y);
    }

    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return Math.hypot(dx, dy);
    }
    static lineBetween(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return new Line(dx, dy);
    }

}
// Line Class
class Line {
    constructor(dx, dy) {
        this.dx = dx;
        this.dy = dy;
    }
}

// Rectangle class
class Rectangle {
    constructor(x1, y1, width, height) {
        this.width = width;
        this.height = height;
        this.p1 = new Point(x1, y1);
        this.p2 = new Point(x1 + width, y1);
        this.p3 = new Point(x1, y1 + height);
        this.p4 = new Point(x1 + width, y1 + height);
        this.points = [this.p1, this.p2, this.p3, this.p4];
    }
    draw(color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.rect(this.p1.x, this.p1.y, this.width, this.height);
        ctx.fill();
        ctx.restore();
    }
    checkFlash(origin, A, B) {
        for (let i = 0; i < this.points.length; i++) {
            if (isInRegion(origin, A, B, this.points[i])) {
                return true
            }
        }
        return false
    }
    checkCollision(p) {
        let offset = 10;
        if (p.x >= this.p1.x - offset && p.x <= this.p4.x + offset && p.y >=
            this.p1.y - offset && p.y <= this.p4.y + offset) {
            return true;
        }
        return false;
    }
}

class TileMap {
    constructor(tsize, rowLen, colLen, defaultTile, imgSRC) {
        this.tsize = tsize;
        this.rowLen = rowLen;
        this.colLen = colLen;
        this.default = defaultTile;
        this.wallDefault = this.default;
        this.defaultVariation = [this.default];
        this.wallVariation = [this.wallDefault];
        this.tileImg = new Image();
        this.tileImg.src = imgSRC;
    }
    setDefaultWall(dW) {
        this.wallDefault = dW;
        if (this.wallVariation.length == 1) {
            this.wallVariation = [this.wallDefault];
        }
    }
    setDefault(d) {
        this.default = d;
    }
    setDefaultVariation(dList) {
        this.defaultVariation = dList;
    }
    setWallVariation(wList) {
        this.wallVariation = wList;
    }
    getTile(tileNum) {
        if (tileNum >= 0) {
            let r = Math.floor(tileNum / this.rowLen);
            let c = tileNum % this.rowLen;
            if (r <= this.colLen) {
                return { x: this.tsize * c, y: this.tsize * r };
            }
        }
        console.log('smthn wrong');
        return { x: 0, y: 0 };
    }
    getRandomFromList(tileList) {
        return tileList[Math.floor((Math.random() * tileList.length))];
    }


}

// Getting all elements
const dataContainer = document.getElementById('output-data-container');
const logText = document.getElementById('log-data-text');
const dataText = document.getElementById('output-data-text');
const canvas = document.getElementById('displayCanvas');
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
dataText.innerHTML = "element obtained"

// Position History Settings & Initialization 
var positionHistory = [];
var HISTORY_LIST_LEN = 20;

// Canvas Constants
const POINTER_BOX_WIDTH = 10;
const FLASH_LENGTH = 100;
const FLASH_ANGLE = 60 * (Math.PI / 180);
const DEFAULT_COLOR = "#000000";

// Initializae Canvas Tools 
ctx.fillStyle = DEFAULT_COLOR;
ctx.strokeStyle = DEFAULT_COLOR;
var ORIGIN = new Point(0, 0);
var PREVENT_MOVEMENT = false;

//  Map constants
var MAP_COLS = 301;
var MAP_ROWS = 151;
var MAP_TSIZE = 16;

var blocks = [];

var setTiles = [];

var map = {
    cols: MAP_COLS,
    rows: MAP_ROWS,
    tsize: MAP_TSIZE,
    origin: new Point(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)),
    tiles: new Array(MAP_COLS * MAP_ROWS).fill(0),
    getTile: function (col, row) {
        return this.tiles[row * map.cols + col];
    },
    setTile: function (col, row, value) {
        this.tiles[row * map.cols + col] = value;
    }
};




forestMap = new TileMap(48, 16, 16, 105, '/img/mouseWorld/forest.png');
forestMap.setDefaultWall(89);
forestMap.setWallVariation([89, 90]);
forestMap.setDefaultVariation([82, 83, 98, 99, 82, 83, 98, 99, 82, 83, 98, 99, 82, 83, 98, 99, 105, 106, 107, 91]);

RPGMap = new TileMap(16, 8, 14, 1, '/img/mouseWorld/8BitRPG.png');
RPGMap.setDefaultWall(3);
RPGMap.setWallVariation([1, 9, 1, 9, 1, 9, 21, 21, 23, 23, 31])
RPGMap.setDefaultVariation([13, 13, 18, 18, 47, 47, 47, 47, 45, 45, 53, 53]);

bitCuteMap = new TileMap(16, 16, 30, 59, '/img/mouseWorld/8BitCute.png');
bitCuteMap.setDefaultWall(3);
bitCuteMap.setWallVariation([1, 9, 1, 9, 1, 9, 21, 21, 23, 23, 31])
bitCuteMap.setDefaultVariation([13, 13, 18, 18, 47, 47, 47, 47, 45, 45, 53, 53]);

let tileMap = forestMap;



// Updates the position history. 
function updatePositionHistory(position) {
    if (positionHistory.unshift(position) > HISTORY_LIST_LEN) {
        positionHistory.pop();
    }
    // console.log(positionHistory);
}
// Calculates the velocity gradient. 
function velocityGradient() {
    gradient = new Line(0, 0);
    if (positionHistory.length > 1) {
        for (var i = 1; i < positionHistory.length; i++) {
            gradient.dx += positionHistory[i - 1].x - positionHistory[i].x
            gradient.dy += positionHistory[i - 1].y - positionHistory[i].y
            // console.log(`Pos${i - 1} to Pos${i} makes the Cummulative Gradient: ${gradient.x}, ${gradient.y}`);
        }
    }
    // console.log(gradient);
    return gradient;
}
// Gets the angle of the line passed in. 
function getAngle(line) {
    let result = Math.atan2(line.dy, line.dx);
    return (result < 0) ? (2 * Math.PI + result) : result;
}
// Draws the flash 
function drawFlash(cursor, line) {
    ctx.save();
    let A = new Point(0, 0)
    let B = new Point(0, 0)
    let centerAngle = getAngle(line);
    let firstLineAngle = centerAngle - (FLASH_ANGLE / 2);
    let secondLineAngle = centerAngle + (FLASH_ANGLE / 2);
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);

    ctx.strokeStyle = "#0000FF";
    A.x = cursor.x + FLASH_LENGTH * Math.cos(firstLineAngle);
    A.y = cursor.y + FLASH_LENGTH * Math.sin(firstLineAngle);
    ctx.lineTo(A.x, A.y);

    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    B.x = cursor.x + FLASH_LENGTH * Math.cos(secondLineAngle);
    B.y = cursor.y + FLASH_LENGTH * Math.sin(secondLineAngle);
    ctx.lineTo(B.x, B.y);
    ctx.strokeStyle = "#FF0000";
    ctx.stroke();
    ctx.restore();
    return [A, B];
}
// Checks if point is between two lines in polar coords. 
function isCCW(a, b, c) {
    return ((a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x)) > 0;
}
//Checks if a point is in a specific region in polar and within a distance. 
function isInRegion(O, A, B, P) {
    let pointingAt = isCCW(O, A, P) && !isCCW(O, B, P);
    let dist = Point.distance(P, O);
    let withinLength = dist <= FLASH_LENGTH;
    return pointingAt && withinLength
}
//Function for mouse movement handling 
function mouseMove(e) {

    // Clear Canvas
    // ctx.fillStyle = "#000000";
    // ctx.beginPath();
    // ctx.rect(0, 0, canvas.width, canvas.height);
    // ctx.fill();



    //Clear Canvas
    // ctx.clearRect(ORIGIN.x, ORIGIN.y, canvas.width, canvas.height);

    // Draw Origin Point 
    ctx.beginPath();
    ctx.save();
    ctx.fillStyle = "#00FF00";
    ctx.rect(ORIGIN.x, ORIGIN.y, 10, 10);
    ctx.fill();
    ctx.restore();


    // Get Position Info 
    let screenCords = new Point(e.screenX, e.screenY);
    let clientCords = new Point(e.clientX, e.clientY);
    let pageCords = new Point(e.pageX, e.pageY);
    let canvasPos = new Point(pageCords.x + ORIGIN.x, pageCords.y + ORIGIN.y);
    dataText.innerHTML = `Screen Coordinates: ${screenCords.x},${screenCords.y}\n
    clientCords: ${clientCords.x},${clientCords.y}\n
    pageCords: ${pageCords.x},${pageCords.y}\n
    canvasPosition: ${canvasPos.x},${canvasPos.y}\n
    ORIGIN: ${ORIGIN.x},${ORIGIN.y}`;
    updatePositionHistory(pageCords);

    // Draw rectangle on pointer
    ctx.beginPath();
    ctx.rect(canvasPos.x - (POINTER_BOX_WIDTH / 2),
        canvasPos.y - (POINTER_BOX_WIDTH / 2), POINTER_BOX_WIDTH, POINTER_BOX_WIDTH);
    ctx.fill();

    // BOXES
    // for (let rec of blocks) {
    //     rec.draw("#000000");
    // }
    // Draw line in gradient direction. 
    let grad = velocityGradient();
    // ctx.beginPath();
    // ctx.moveTo(canvasPos.x, canvasPos.y);
    // ctx.lineTo(canvasPos.x + grad.dx * 3, canvasPos.y + grad.dy * 3);
    // ctx.stroke();

    //FLASH:
    [A, B] = drawFlash(canvasPos, grad);
    // for (let rec of blocks) {
    //     let inRegion = rec.checkFlash(canvasPos, A, B);
    //     if (inRegion) {
    //         rec.draw("#00FF00");
    //     }
    //     let collisionCheck = rec.checkCollision(canvasPos);
    //     if (collisionCheck) {
    //         PREVENT_MOVEMENT = true;
    //         rec.draw("#FF0000");
    //     }
    //     // console.log(`FLASH: ${inRegion} || Collision: ${collisionCheck}`);

    // }




    if (PREVENT_MOVEMENT) {
        let distChange = Point.lineBetween(pageCords, positionHistory[1]);
        ctx.translate(distChange.dx, distChange.dy);
        ORIGIN.subLine(distChange);
        // console.log(ORIGIN);
    }

    PREVENT_MOVEMENT = false;
    drawVisibleMap(ORIGIN.x, ORIGIN.y);
    drawVisibleMap(canvasPos.x, canvasPos.y);
    drawTile(75, 160);

}

// Given the top left origin point of the visible region, draw the map onto the visible screen. 
function drawVisibleMap(ox, oy) {
    let mapTopLeftX = Math.round((map.origin.x - (Math.floor(map.cols / 2) * map.tsize)) - map.tsize / 2);
    let mapTopLeftY = Math.round((map.origin.x - (Math.floor(map.rows / 2) * map.tsize)) - map.tsize / 2);
    let originTileCol = Math.floor((ox - mapTopLeftX) / map.tsize);
    let originTileRow = Math.floor((oy - mapTopLeftY) / map.tsize);
    let totalTileViewPortWidth = Math.ceil(canvas.width / map.tsize);
    let totalTileViewPortHeight = Math.ceil(canvas.height / map.tsize);
    console.log(`mapTopLeftX: ${mapTopLeftX},mapTopLeftY: ${mapTopLeftY},originTileCol: ${originTileCol}, originTileRow: ${originTileRow}, totalTileViewPortWidth: ${totalTileViewPortWidth}, totalTileViewPortHeight: ${totalTileViewPortHeight}`);
    console.log(`map total tiles: ${map.rows}, ${map.cols}`);
    console.log(`new origin point: ${mapTopLeftY + originTileRow * map.tsize}`);
    ctx.save();
    drawTile(originTileRow + 2, originTileCol + 2);
    // for (let irow = 0; irow < totalTileViewPortHeight; irow++) {
    //     for (let icol = 0; icol < totalTileViewPortWidth; icol++) {
    //         drawTile(irow + originTileRow, originTileCol + icol);
    //     }
    // }
    ctx.restore();
}

function drawMapOutlines() {
    let x0 = map.origin.x - Math.floor(map.cols / 2) * map.tsize - map.tsize / 2;
    let y0 = map.origin.y - Math.floor(map.rows / 2) * map.tsize - map.tsize / 2;
    for (let ix = 0; ix < map.cols; ix++) {
        for (let iy = 0; iy < map.rows; iy++) {
            ctx.save();
            ctx.strokeStyle = "#FF0000";
            ctx.translate(x0 + ix * map.tsize, y0 + iy * map.tsize);
            ctx.strokeRect(0, 0, map.tsize, map.tsize);
            ctx.restore();
        }
    }
}
function drawMapTiles() {
    for (let ix = 0; ix < map.cols; ix++) {
        for (let iy = 0; iy < map.rows; iy++) {
            drawTile(ix, iy);
        }
    }
}

function drawTile(row, col) {
    let tile = map.getTile(row, col);
    let tilex = Math.round((map.origin.x - (Math.floor(map.cols / 2) - row) * map.tsize) - map.tsize / 2);
    let tiley = Math.round((map.origin.y - (Math.floor(map.rows / 2) - col) * map.tsize) - map.tsize / 2);
    console.log(`TILE: row: ${row}, col: ${col}, x:${tilex} y:${tiley}, tile: ${tile}`)
    ctx.save();
    if (tile > 0) {
        let tilePos = tileMap.getTile(tile - 1);
        ctx.drawImage(
            tileMap.tileImg, // image
            tilePos.x, // source x
            tilePos.y, // source y
            tileMap.tsize, // source width
            tileMap.tsize, // source height
            tilex, // target x
            tiley, // target y
            map.tsize, // target width
            map.tsize, // target height
        );

    } else {
        ctx.beginPath();
        ctx.fillStyle = "#555555";
        ctx.rect(tilex, tiley, map.tsize, map.tsize);
        ctx.fill();

    }
    ctx.restore();
}

function generateNextTiles() {
    const startTime = performance.now()
    let maxRcheck = 100;
    notValid = true;
    let numChecks = 0;
    let checkLimit = 1000;
    while (notValid && numChecks < checkLimit) {
        // Choose a random tile. : 
        let randX = Math.floor(Math.random() * (map.cols - 2)) + 1;
        let randY = Math.floor(Math.random() * (map.rows - 2)) + 1;

        // Only continue with this tile it's not already a created tile: 
        if (map.getTile(randX, randY) == 0) {
            //Check if next to a valid tile: 
            if (map.getTile(randX - 1, randY) != 0 || map.getTile(randX + 1, randY) != 0
                || map.getTile(randX, randY - 1) != 0 || map.getTile(randX, randY + 1) != 0) {

                map.setTile(randX, randY, tileMap.getRandomFromList(tileMap.wallVariation));
                // drawTile(randX, randY);
                notValid = false;
            } else {
                // Choose a random location to shoot particle.
                let modX = 0;
                let modY = 0;
                switch (Math.floor(Math.random() * 4)) {
                    case 0:
                        modX = 1;
                        break;
                    case 1:
                        modX = -1;
                        break;
                    case 2:
                        modY = 1;
                        break;
                    case 3:
                        modY = -1;
                        break;
                }
                let i = 2;
                let modifiedX = randX + modX * i;
                let modifiedY = randY + modY * i;
                // Keep going until reached either max check distance or edge of map. 
                while (i < maxRcheck && modifiedX >= 0 && modifiedX < map.cols
                    && modifiedY >= 0 && modifiedY < map.rows && notValid) {

                    // If tile is not a blank tile, set this previous tile into a valid tile. 
                    if (map.getTile(modifiedX, modifiedY) != 0) {
                        // setTiles.push([randX + modX * (i - 1), randY + modY * (i - 1)]);
                        map.setTile(randX + modX * (i - 1), randY + modY * (i - 1), tileMap.getRandomFromList(tileMap.defaultVariation));
                        // drawTile(randX + modX * (i - 1), randY + modY * (i - 1));
                        notValid = false;
                    }
                    i++;
                    modifiedX = randX + (modX * i);
                    modifiedY = randY + (modY * i);
                }
            }

        }
        numChecks++;
    }
    const endTime = performance.now()

    // console.log(`Call took ${endTime - startTime} ms`)
}

// function generateNextTiles() {
//     let maxRcheck = 50;
//     notValid = true;
//     while (notValid) {
//         // Choose a random from those already set. : 
//         // let randX = Math.floor(Math.random() * map.cols);
//         // let randY = Math.floor(Math.random() * map.rows);
//         let randT = setTiles[Math.floor(Math.random() * setTiles.length)];
//         let randX = randT[0];
//         let randY = randT[1];
//         // Choose a random location to shoot particle.
//         let modX = 0;
//         let modY = 0;
//         switch (Math.floor(Math.random() * 4)) {
//             case 0:
//                 modX = 1;
//                 break;
//             case 1:
//                 modX = -1;
//                 break;
//             case 2:
//                 modY = 1;
//                 break;
//             case 3:
//                 modY = -1;
//                 break;
//         }
//         let i = 1;
//         let modifiedX = randX + modX * i;
//         let modifiedY = randY + modY * i;
//         console.log(`beforeWHILE, modX: ${modifiedX} modY:${modifiedY}, 
// randX: ${randX}, randY: ${randY}, DIR: ${modX},${modY}`);
//         // Keep going until reached either max check distance or edge of map. 
//         while (i < maxRcheck && modifiedX >= 0 && modifiedX < 
// map.cols && modifiedY >= 0 && modifiedY < map.rows) {
//             // If tile is not a blank tile, set this previous tile into a valid tile. 
//             console.log(`checking: ${modifiedX}, ${modifiedY}`);
//             if (map.getTile(modifiedX, modifiedY) == 0) {
//                 setTiles.push([modifiedX, modifiedY]);
//                 map.setTile(modifiedX, modifiedY, 1);
//                 map.setTile(randX, randY, 2);
//                 drawTile(modifiedX, modifiedY);
//                 drawTile(randX, randY);
//                 console.log(`FOUND at ${modifiedX}, ${modifiedY}!`);
//                 notValid = false;
//                 return;
//             }
//             i++;
//             modifiedX = randX + (modX * i);
//             modifiedY = randY + (modY * i);
//         }
//     }
// }

function initializeDLASeed() {
    let oTx = Math.floor(map.cols / 2);
    let oTy = Math.floor(map.rows / 2);
    setTiles.push([oTx, oTy]);
    setTiles.push([oTx - 1, oTy]);
    setTiles.push([oTx + 1, oTy]);
    setTiles.push([oTx - 2, oTy]);
    setTiles.push([oTx + 2, oTy]);
    setTiles.push([oTx - 3, oTy]);
    setTiles.push([oTx + 3, oTy]);
    setTiles.push([oTx, oTy + 1]);
    setTiles.push([oTx, oTy - 1]);

    for (let p of setTiles) {
        map.setTile(p[0], p[1], tileMap.getRandomFromList(tileMap.defaultVariation));
    }


}


// // Window loaded, run script
window.onload = () => {
    // drawMapOutlines();
    initializeDLASeed();
    drawMapTiles();
    document.addEventListener('keydown', keyDown);
    document.addEventListener('mousemove', mouseMove);

}
//     // 
//     //Generate random blocks: 
//     // for (let i = 0; i < 10; i++) {
//     //     let width = Math.floor(Math.random() * (30) + 5);
//     //     blocks.push(new Rectangle(Math.floor(Math.random() * (canvas.width - 100) + 50),
//  Math.floor(Math.random() * (canvas.height - 100) + 50), width, width));
//     // }
// };


let graphLEN = 10;
let graphMS_BASE = 2;
let graph = [];
let plist = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];



function keyDown(e) {
    let N = 1000;
    const startTime = performance.now();
    for (let i = 0; i < N; i++) {
        generateNextTiles();
    }
    const endTime = performance.now();
    let timeMS = endTime - startTime;
    let point = Math.floor(timeMS * 8 / graphMS_BASE);
    if (point > 8) { point = 8; }
    if (point <= 0) { point = 1; }
    let p = plist[point - 1];
    if (graph.unshift(p) > graphLEN) {
        graph.pop();
    }
    logText.innerHTML = `Created ${N} new tiles in ${(timeMS).toFixed(2)} milliseconds ${graph.join('')}`;
    // drawMapTiles();
    // drawMapTiles();
}

