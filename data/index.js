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