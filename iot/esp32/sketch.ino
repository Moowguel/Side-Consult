// SideConsult - Wearable de sinais vitais (ESP32) para simulação no Wokwi (https://wokwi.com)
// Potenciômetros simulam os sensores: SpO2 (GPIO34), frequência cardíaca (GPIO35), pressão sistólica (GPIO32).
// LED vermelho (GPIO2) acende quando a API devolve alerta. Botão (GPIO4) força uma leitura de crise.
// A API precisa estar acessível pela internet (ex.: `ngrok http 3000`), pois o Wokwi não enxerga o localhost.
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";
const char* API_URL = "https://SEU-TUNEL.ngrok-free.app/api/iot"; // troque pela URL pública do servidor
const char* DEVICE_TOKEN = "demo-wearable-token";                 // token do dispositivo (criado pelo seed)

const int PIN_SPO2 = 34, PIN_HR = 35, PIN_SYS = 32, PIN_LED = 2, PIN_BTN = 4;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BTN, INPUT_PULLUP);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(250); Serial.print("."); }
  Serial.println("\nWi-Fi conectado");
}

void loop() {
  bool crise = digitalRead(PIN_BTN) == LOW;
  int spo2 = crise ? 86 : map(analogRead(PIN_SPO2), 0, 4095, 85, 100);
  int heartRate = crise ? 132 : map(analogRead(PIN_HR), 0, 4095, 50, 140);
  int systolic = crise ? 185 : map(analogRead(PIN_SYS), 0, 4095, 100, 190);
  int diastolic = systolic * 2 / 3;

  String body = "{\"spo2\":" + String(spo2) + ",\"heartRate\":" + String(heartRate) +
                ",\"systolic\":" + String(systolic) + ",\"diastolic\":" + String(diastolic) + "}";

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_TOKEN);
  int status = http.POST(body);
  String response = http.getString();
  http.end();

  bool alerta = response.indexOf("\"alerts\":[]") == -1 && status == 201;
  digitalWrite(PIN_LED, alerta ? HIGH : LOW);
  Serial.printf("HTTP %d | SpO2 %d%% FC %d PA %d/%d %s\n", status, spo2, heartRate, systolic, diastolic, alerta ? "ALERTA" : "");
  delay(5000);
}
