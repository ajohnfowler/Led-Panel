/**
* ----------------------------------------------------------------------------
* ESP32 controlled light matrix 
* ---------------------------------------------------------------------------- 
* © 2021 Adam Fowler 
* ----------------------------------------------------------------------------
*/

#include <SPIFFS.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <FastLED.h>

// ----------------------------------------------------------------------------
//  Define Macros
// ----------------------------------------------------------------------------

#define DATA_PIN 5
#define NUM_LEDS 450
#define LED_TYPE WS2811
#define COLOR_ORDER GRB
#define HTTP_PORT 80

// ----------------------------------------------------------------------------
// Define Global Constants
// ----------------------------------------------------------------------------

// Wifi credentials
const char *WIFI_SSID = "BELL364";
const char *WIFI_PASS = "3D1A92C5F16D";

// LED matrix dimensions
const uint8_t MATRIX_WIDTH = 30;
const uint8_t MATRIX_HEIGHT = 15;

// Frames per seconds for animations
const uint8_t FRAMES_PER_SECOND = 120;

// ----------------------------------------------------------------------------
// Definition of the Panel component
// ----------------------------------------------------------------------------

struct Panel
{
  // state variables
  bool on = false;
  byte hue = 0;
  byte saturation = 255;
  byte brightness = 32;
  byte pattern = 0;
  
  byte fade_hue = 0;
  CRGB leds[NUM_LEDS];
  
  // Methods
  DynamicJsonDocument getData() {
    DynamicJsonDocument data(1024);

    data["on"] = on;
    data["hue"] = hue;
    data["saturation"] = saturation;
    data["brightness"] = brightness;
    data["pattern"] = pattern;
    
    return data;
  }

  void setData(DynamicJsonDocument data) {
    clear();

    on = data["power"];
    hue = data["power"];
    saturation = data["saturation"];
    brightness = data["brightness"];
    pattern = data["pattern"];
  }

  void clear() {
    FastLED.clear();
    FastLED.show();
  }
};

// ----------------------------------------------------------------------------
// Define Global Varaibles
// ----------------------------------------------------------------------------

Panel panel;

AsyncWebServer server(HTTP_PORT);
AsyncWebSocket ws("/ws");

// ----------------------------------------------------------------------------
// SPIFFS Initalzation
// ----------------------------------------------------------------------------

void initSPIFFS()
{
  if (!SPIFFS.begin())
  {
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }
}

// ----------------------------------------------------------------------------
// FastLED Initalzation
// ----------------------------------------------------------------------------

uint16_t XY( uint8_t x, uint8_t y)
{
  uint16_t i;
  if( y & 0x01) {
    // Odd rows run backwards
    uint8_t reverseX = (MATRIX_WIDTH - 1) - x;
    i = (y * MATRIX_WIDTH) + reverseX;
  } else {
    // Even rows run forwards
    i = (y * MATRIX_WIDTH) + x;
  }
    
  return i;
}
  
void initFastLED()
{
  // Setup Fastleds
  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(panel.leds, NUM_LEDS); // Add all the leds to the array
  FastLED.setBrightness(panel.brightness);                                // Set a starting led brightness
}

// ----------------------------------------------------------------------------
// Patterns
// ----------------------------------------------------------------------------

void color_fill()
{
  fill_solid(panel.leds, NUM_LEDS, CHSV(panel.hue, panel.saturation, 255));
}

void color_fade()
{
  // Code to show the colors
  for (byte y = 0; y < MATRIX_HEIGHT; y++)
  {
    for (byte x = 0; x < MATRIX_WIDTH; x++)
    {
      panel.leds[XY(x, y)] = CHSV(panel.fade_hue + x + y, 255, 255);
    }
  }
}

// Copied from FastLEDs demoreel and modified to work with panel struct
void confetti() 
{
  // random colored speckles that blink in and fade smoothly
  fadeToBlackBy( panel.leds, NUM_LEDS, 10);
  int pos = random16(NUM_LEDS);
  panel.leds[pos] += CHSV( panel.fade_hue + random8(64), 200, 255);
}

typedef void (*PatternList[])();
PatternList patterns = { color_fill, color_fade, confetti };

// ----------------------------------------------------------------------------
// WiFi Network Initalzation
// ----------------------------------------------------------------------------

void initWiFi()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  // Check wi-fi is connected to wi-fi network
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected successfully");
  Serial.print("Got IP: ");
  Serial.println(WiFi.localIP()); //Show ESP32 IP on serial
}

// ----------------------------------------------------------------------------
// Web Server Initalzation
// ----------------------------------------------------------------------------

void onRootRequest(AsyncWebServerRequest *request)
{
  request->send(SPIFFS, "/index.html", "text/html", false);
}

void initWebServer()
{
  server.on("/", onRootRequest);
  server.serveStatic("/", SPIFFS, "/");
  server.begin();
}

// ----------------------------------------------------------------------------
// Web Socket Initalzation
// ----------------------------------------------------------------------------

void notifyClients()
{
  char buffer[1024];
  size_t len = serializeJson(panel.getData(), buffer);
  ws.textAll(buffer, len);
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len)
{
  AwsFrameInfo *info = (AwsFrameInfo *)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT)
  {
    DynamicJsonDocument json(1024);
    DeserializationError err = deserializeJson(json, data);
    if (err)
    {
      Serial.print(F("deserializeJson() failed with code "));
      Serial.println(err.c_str());
      return;
    }
    panel.setData(json);
    notifyClients();
  }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
{
  switch (type)
  {
  case WS_EVT_CONNECT:
    Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
    break;
  case WS_EVT_DISCONNECT:
    Serial.printf("WebSocket client #%u disconnected\n", client->id());
    break;
  case WS_EVT_DATA:
    handleWebSocketMessage(arg, data, len);
    break;
  case WS_EVT_PONG:
  case WS_EVT_ERROR:
    break;
  }
}

void initWebSocket()
{
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

// ----------------------------------------------------------------------------
// Initalzation
// ----------------------------------------------------------------------------

void setup()
{
  Serial.begin(115200);

  initSPIFFS();
  initFastLED();
  initWiFi();
  initWebSocket();
  initWebServer();
}

// ----------------------------------------------------------------------------
// Main Loop
// ----------------------------------------------------------------------------

void loop()
{
  ws.cleanupClients();

  if (panel.on) {
    // Show pattern here
    patterns[panel.pattern]();

    EVERY_N_MILLISECONDS(100) { panel.fade_hue++; }
  }

  FastLED.delay(1000/FRAMES_PER_SECOND); 
  FastLED.show();
}