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
    document.getElementById('status').innerHTML = data.status;
    document.getElementById('hue').value = data.hue;
    document.getElementById('saturation').value = data.saturation;
    document.getElementById('brightness').value = data.brightness;
}

// ----------------------------------------------------------------------------
// Input Handling
// ----------------------------------------------------------------------------

function sendData(object) {
    websocket.send(JSON.stringify({
        'action': object.id,
        'value': object.value
    }));
}

function rangeSlide(object) {
    document.getElementById(object.id + "Value").innerHTML = object.value;
}

// ----------------------------------------------------------------------------
// Grid Input Handling
// ----------------------------------------------------------------------------

let canvas = document.getElementById('grid');
let ctx = canvas.getContext("2d");

let grid_width = 30;
let grid_height = 15;
let cell_size = 40;

canvas.width = grid_width * cell_size;
canvas.height = grid_height * cell_size;

ctx.strokeStyle = "#8A8E91";

for (var x = 0; x < grid_width; x++) {
    ctx.moveTo(x * cell_size, 0);
    ctx.lineTo(x * cell_size, grid_height * cell_size);
}

for (var y = 0; y < grid_height; y++) {
    ctx.moveTo(0, y * cell_size);
    ctx.lineTo(grid_width * cell_size, y * cell_size);
}

ctx.stroke();