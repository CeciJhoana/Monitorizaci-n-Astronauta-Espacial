/*
   Sensor AHT (AHT10/AHT20) -> WiFi -> Servidor Flask (PostgreSQL)
   ----------------------------------------------------------------
   Lee temperatura y humedad de un sensor AHT por I2C y las envia
   por HTTP POST al servidor en http://192.168.11.230:5000/clima

   Conexiones del AHT (I2C):
     VIN -> 3V3
     GND -> GND
     SCL -> GPIO 22
     SDA -> GPIO 21

   Requiere la libreria: "Adafruit AHTX0"
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>

// ====== CONFIGURACION ======
const char* WIFI_SSID  = "TU_WIFI_2.4GHZ";   // WiFi local (misma red que la compu)
const char* WIFI_PASS  = "TU_CLAVE_WIFI";   // <-- si falla el WiFi, revisa esta clave
const char* SERVIDOR   = "http://IP_DEL_SERVIDOR:5000/clima";
// ===========================

#define SDA_PIN      21
#define SCL_PIN      22
#define DETECTOR     "esp32_aht"
#define INTERVALO_MS 5000        // enviar cada 5 segundos

Adafruit_AHTX0 aht;
bool aht_ok = false;

// --------- WiFi ---------
void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("Conectando a WiFi '%s' ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi conectado. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("ERROR: no se pudo conectar al WiFi (revisa SSID/clave y 2.4GHz).");
  }
}

// --------- Envio al servidor ---------
void enviarAlServidor(float temperatura, float humedad) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Sin WiFi, no se envia. Reintentando conexion...");
    conectarWiFi();
    return;
  }

  HTTPClient http;
  http.begin(SERVIDOR);
  http.addHeader("Content-Type", "application/json");

  char cuerpo[128];
  snprintf(cuerpo, sizeof(cuerpo),
           "{\"detector\":\"%s\",\"temperatura\":%.2f,\"humedad\":%.2f}",
           DETECTOR, temperatura, humedad);

  int codigo = http.POST(cuerpo);
  if (codigo > 0) {
    Serial.printf("POST -> HTTP %d  | respuesta: %s\n",
                  codigo, http.getString().c_str());
  } else {
    Serial.printf("POST fallo: %s\n", http.errorToString(codigo).c_str());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n== AHT -> Flask ==");

  Wire.begin(SDA_PIN, SCL_PIN);
  if (aht.begin()) {
    aht_ok = true;
    Serial.println("Sensor AHT detectado OK.");
  } else {
    Serial.println("ERROR: no se encontro el AHT (revisa VIN/GND y SDA=21/SCL=22).");
  }

  conectarWiFi();
}

void loop() {
  if (!aht_ok) {
    // reintenta inicializar por si se conecto despues
    if (aht.begin()) { aht_ok = true; Serial.println("Sensor AHT detectado OK."); }
    else { Serial.println("AHT no disponible..."); delay(INTERVALO_MS); return; }
  }

  sensors_event_t humedad, temp;
  aht.getEvent(&humedad, &temp);   // llena ambos eventos

  float t = temp.temperature;
  float h = humedad.relative_humidity;

  Serial.printf("T: %.2f C     H: %.2f %% RH\n", t, h);
  enviarAlServidor(t, h);

  delay(INTERVALO_MS);
}
