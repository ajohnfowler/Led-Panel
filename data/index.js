/**
 * ----------------------------------------------------------------------------
 * ESP32 controlled light matrix 
 * ---------------------------------------------------------------------------- 
 * © 2021 Adam Fowler 
 * ----------------------------------------------------------------------------
 */

var gateway = `ws://${window.location.hostname}/ws`;
var websocket;

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------

window.addEventListener('load', onLoad);

function onLoad(event) {
    initWebSocket();
    drawGrid();
}

// ----------------------------------------------------------------------------
// Color Conversions
// ----------------------------------------------------------------------------

function hexToDec(hex) {
    return parseInt(hex.substring(1, 7), 16);
}

function decToHex(dec) {
    return "#" + dec.toString(16);
}

// ----------------------------------------------------------------------------
// WebSocket Handling
// ----------------------------------------------------------------------------

function initWebSocket() {
    console.log('Trying to open a WebSocket connection...');
    websocket = new WebSocket(gateway);
    websocket.onopen = onOpen;
    websocket.onclose = onClose;
    websocket.onmessage = onMessage;
}

function onOpen(event) {
    console.log('Connection opened');
}

function onClose(event) {
    console.log('Connection closed');
    setTimeout(initWebSocket, 2000);
}

function onMessage(event) {
    let data = JSON.parse(event.data);
    setData(data);
}

// ----------------------------------------------------------------------------
// Input Handling
// ----------------------------------------------------------------------------

function sendData() {
    websocket.send(getData());
}

function rangeSlide(object) {
    document.getElementById(object.id + "Value").innerHTML = object.value;
}

// ----------------------------------------------------------------------------
// Data Handeling
// ----------------------------------------------------------------------------

function getData() {
    return JSON.stringify({
        'on': document.getElementById('on').checked,
        'color': hexToDec(document.getElementById('color').value),
        'brightness': document.getElementById('brightness').value,
        'pattern': document.getElementById('pattern').value,
        'grid': grid_data
    })
}

function setData(data) {
    document.getElementById('on').checked = data.on;
    document.getElementById('color').value = decToHex(data.color);
    document.getElementById('brightness').value = data.brightness;
    document.getElementById('pattern').value = data.pattern;
}

// ----------------------------------------------------------------------------
// Grid Input Handling
// ----------------------------------------------------------------------------

let canvas = document.getElementById('grid');
let ctx = canvas.getContext("2d");

canvas.style.width = '100%';
canvas.style.height = '100%';

let grid_width = 30;
let grid_height = 15;
let cell_size = 40;

let drawing = false;
let current_cell;
let grid_data;
clearGrid();

canvas.width = grid_width * cell_size;
canvas.height = grid_height * cell_size;

// ----------------------------------------------------------------------------
// Canvas input handeling
// ----------------------------------------------------------------------------

canvas.addEventListener('mousedown', event => {
    mouseHandler(event)
    drawing = true;
});

canvas.addEventListener('mousemove', event => {
    if (drawing) {
        mouseHandler(event)
    }
});

window.addEventListener('mouseup', event => {
    if (drawing) {
        drawing = false;
        sendData();
    }
});

function mouseHandler(event) {
    var grid_square = GetGridCell(event);
    if (grid_square != current_cell) {
        current_cell = grid_square;
        updateCell(grid_square);
    }
}

function getMouesPosition(e) {
    var mouseX = e.offsetX * canvas.width / canvas.clientWidth | 0;
    var mouseY = e.offsetY * canvas.height / canvas.clientHeight | 0;
    return { x: mouseX, y: mouseY };
}

function GetGridCell(event) {
    let mouse_pos = getMouesPosition(event)
    return {
        x: Math.floor(mouse_pos.x / cell_size),
        y: Math.floor(mouse_pos.y / cell_size)
    }
}

function updateCell(cell) {
    grid_data[cell.x][cell.y] = document.getElementById('color').value;
    drawGrid();
}

// ----------------------------------------------------------------------------
// Draw the grid
// ----------------------------------------------------------------------------

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGridCells();
    drawGridLines();
}

function drawGridCells() {
    ctx.beginPath();
    for (let x = 0; x < grid_width; x++) {
        for (let y = 0; y < grid_height; y++) {
            if (grid_data[x][y]) {
                drawCell(x, y, grid_data[x][y]);
            }
        }
    }
    ctx.stroke();
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * cell_size, y * cell_size, cell_size, cell_size);
}

function drawGridLines() {
    ctx.strokeStyle = "#8A8E91";
    ctx.lineWidth = 2;

    for (var x = 0; x < grid_width + 1; x++) {
        ctx.moveTo(x * cell_size, 0);
        ctx.lineTo(x * cell_size, grid_height * cell_size);
    }

    for (var y = 0; y < grid_height + 1; y++) {
        ctx.moveTo(0, y * cell_size);
        ctx.lineTo(grid_width * cell_size, y * cell_size);
    }

    ctx.stroke();
}

function clearGrid() {
    grid_data = new Array(grid_width);
    for (let x = 0; x < grid_data.length; x++) {
        grid_data[x] = new Array(grid_height);
    }
    drawGrid();
}