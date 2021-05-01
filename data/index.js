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
        'hue': document.getElementById('hue').value,
        'saturation': document.getElementById('saturation').value,
        'brightness': document.getElementById('brightness').value,
        'pattern': document.getElementById('pattern').value
    })
}

function setData(data) {
    document.getElementById('on').checked = data.on;
    document.getElementById('hue').value = data.hue;
    document.getElementById('saturation').value = data.saturation;
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
let canvas_data = new Array(grid_width);
for (let i = 0; i < canvas_data.length; i++) {
    canvas_data[i] = new Array(grid_height);
}

let drawing = false;
let current_cell;
let grid_data;
grid_data = new Array(grid_width);
for (let x = 0; x < grid_data.length; x++) {
    grid_data[x] = new Array(grid_height);
}

canvas.width = grid_width * cell_size;
canvas.height = grid_height * cell_size;

// Canvas input handeling

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
        //sendData();
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
    grid_data[cell.x][cell.y] = {
        'hue': document.getElementById('hue').value,
        'saturation': document.getElementById('saturation').value,
        'brightness': document.getElementById('brightness').value
    };
    drawGrid();
}

//
// Draw the grid
//

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

function drawCell(x, y, data) {
    ctx.fillStyle = HSLToHex(data["hue"], data["saturation"], data["brightness"]);
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

//
// HSV to Hex color
//

function HSLToHex(h, s, l) {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    // Prepend 0s, if necessary
    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}