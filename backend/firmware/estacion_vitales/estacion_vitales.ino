/*
   ESTACION DE ASTRONAUTA - ESP32
   Signos vitales + radiacion + ambiente, con AVATAR, % SALUD, RECOMENDACIONES
   y TECLADO MATRICIAL para disparar escenarios a mano (para la exposicion).
   ------------------------------------------------------------------
   REALES    : AHT (temp/hum, I2C), UV CJMCU/ML8511 (GPIO34)
   SIMULADOS : pulso, SpO2, temp corporal (sim=true)
   OLED SH1106: rota AVATAR+SALUD / VITALES / AMBIENTE / RECOMENDACION
   RGB + zumbador: segun estado de salud
   TECLADO 4x3 (12 teclas): dispara escenarios manualmente

   CONEXIONES: I2C SDA->21 SCL->22 | UV OUT->34 EN->3V3 | RGB 5/18/19 | Buzzer 4
   TECLADO: filas 13,14,26,27  columnas 25,32,33
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

// ====== CONFIGURACION ======
const char* WIFI_SSID  = "TU_WIFI_2.4GHZ";
const char* WIFI_PASS  = "TU_CLAVE_WIFI";
const char* SERVIDOR   = "http://IP_DEL_SERVIDOR:5000/clima";
#define SIMULAR_VITALES  true
#define MODO_DEMO        true
// ===========================

#define BUZZER_PIN  4
#define LED_R_PIN   5
#define LED_G_PIN   18
#define LED_B_PIN   19
#define UV_PIN      34
#define SDA_PIN     21
#define SCL_PIN     22
#define OLED_ADDR   0x3C
#define DETECTOR     "esp32_astro"
#define INTERVALO_MS 4000

// --- Teclado matricial 4x3 ---
const int KP_FILAS[4] = {13, 14, 26, 27};
const int KP_COLS[3]  = {25, 32, 33};

// Escenarios (el indice de tecla 0..5 selecciona el escenario; tecla 6 = AUTO)
struct Escenario { const char* nombre; float pulso, spo2, tempc; int ciclos; };
Escenario ESCENARIOS[] = {
  { "NORMAL",       75, 99, 36.8, 4 },
  { "SPO2 BAJA",    82, 89, 36.9, 4 },
  { "PULSO ALTO",  126, 97, 37.1, 4 },
  { "FIEBRE",       98, 96, 38.4, 4 },
  { "CRITICO",     132, 85, 38.7, 4 },
  { "RECUPERACION", 72, 99, 36.7, 4 },
};
const int N_ESC = sizeof(ESCENARIOS) / sizeof(ESCENARIOS[0]);
int escIdx = 0, escCont = 0;
const char* escNombre = "NORMAL";
bool autoDemo = true;          // true = cicla solo; false = fijo por teclado
int  ultTecla = -1;

Adafruit_AHTX0 aht;
Adafruit_SH1106G oled(128, 64, &Wire, -1);
bool aht_ok = false, oled_ok = false;
int  pant = 0;

float v_pulso = 74, v_spo2 = 98, v_tempc = 36.8;

float mapf(float x, float a, float b, float c, float d) { return (x - a) * (d - c) / (b - a) + c; }

void simularVitales() {
  v_pulso += random(-40, 41) / 10.0;   v_pulso = constrain(v_pulso, 55, 115);
  v_spo2  += random(-25, 26) / 10.0;   v_spo2  = constrain(v_spo2, 90, 100);
  v_tempc += random(-15, 16) / 100.0;  v_tempc = constrain(v_tempc, 36.0, 37.8);
}

void aplicarEscenario() {
  Escenario& e = ESCENARIOS[escIdx];
  escNombre = e.nombre;
  v_pulso = e.pulso + random(-20, 21) / 10.0;
  v_spo2  = e.spo2  + random(-10, 11) / 10.0;
  v_tempc = e.tempc + random(-10, 11) / 100.0;
}

void rgb(uint8_t r, uint8_t g, uint8_t b) { analogWrite(LED_R_PIN, r); analogWrite(LED_G_PIN, g); analogWrite(LED_B_PIN, b); }
void beep(int ms) { digitalWrite(BUZZER_PIN, HIGH); delay(ms); digitalWrite(BUZZER_PIN, LOW); }

float leerUV(float &voltaje) {
  uint32_t mv = 0;
  for (int i = 0; i < 16; i++) mv += analogReadMilliVolts(UV_PIN);
  voltaje = (mv / 16.0) / 1000.0;
  float uv = mapf(voltaje, 0.99, 2.8, 0.0, 15.0);
  return uv < 0 ? 0 : uv;
}

// --- Teclado: devuelve indice 0..11 o -1 ---
int leerTeclado() {
  int tecla = -1;
  for (int f = 0; f < 4; f++) {
    digitalWrite(KP_FILAS[f], LOW);
    delayMicroseconds(60);
    for (int c = 0; c < 3; c++)
      if (digitalRead(KP_COLS[c]) == LOW) tecla = f * 3 + c;
    digitalWrite(KP_FILAS[f], HIGH);
  }
  return tecla;
}

// Maneja una tecla por COLUMNA (funciona con cualquier fila que responda):
//   col 0 -> escenario anterior | col 1 -> siguiente | col 2 -> AUTO/MANUAL
bool manejarTecla(int k) {
  int col = k % 3;
  if (col == 0)      { escIdx = (escIdx + N_ESC - 1) % N_ESC; autoDemo = false; escCont = 0; }
  else if (col == 1) { escIdx = (escIdx + 1) % N_ESC;         autoDemo = false; escCont = 0; }
  else               { autoDemo = !autoDemo; }
  Serial.printf("TECLA %d (col %d) -> %s [%s]\n", k, col, ESCENARIOS[escIdx].nombre, autoDemo ? "AUTO" : "MAN");
  return true;
}

float evaluarSalud(float pulso, float spo2, float tempc, float uv, float tamb,
                   const char*& estado, const char*& reco) {
  float salud = 100, peorPen = 0;
  reco = "Todo en orden. Manten hidratacion y descanso.";
  float p; const char* rp;
  p = (spo2 < 95) ? (95 - spo2) * 8 : 0;
  if (p > peorPen) { peorPen = p; reco = "SpO2 baja: respira lento y profundo. Revisa el O2 de la cabina."; }
  salud -= p;
  p = 0; rp = nullptr;
  if (pulso > 100)     { p = (pulso - 100) * 1.5; rp = "Pulso alto: descansa sentado y respira 4-7-8. Evita esfuerzo."; }
  else if (pulso < 60) { p = (60 - pulso) * 1.5;  rp = "Pulso bajo: hidratate y haz estiramientos suaves."; }
  if (rp && p > peorPen) { peorPen = p; reco = rp; }
  salud -= p;
  p = 0; rp = nullptr;
  if (tempc > 37.2)     { p = (tempc - 37.2) * 25; rp = "Temp corporal alta: hidratate y baja la temp de cabina."; }
  else if (tempc < 36.1){ p = (36.1 - tempc) * 25; rp = "Temp corporal baja: abrigate y sube la temp de cabina."; }
  if (rp && p > peorPen) { peorPen = p; reco = rp; }
  salud -= p;
  p = (uv > 3) ? (uv - 3) * 5 : 0;
  if (p > peorPen) { peorPen = p; reco = "Radiacion UV alta: alejate de ventanillas y usa proteccion."; }
  salud -= p;
  if (!isnan(tamb)) {
    p = 0; rp = nullptr;
    if (tamb > 27)      { p = (tamb - 27) * 1.5; rp = "Cabina calurosa: ajusta el control de clima."; }
    else if (tamb < 18) { p = (18 - tamb) * 1.5; rp = "Cabina fria: ajusta el control de clima."; }
    if (rp && p > peorPen) { peorPen = p; reco = rp; }
    salud -= p * 0.5;
  }
  salud = constrain(salud, 0, 100);
  estado = (salud >= 80) ? "BIEN" : (salud >= 50) ? "ALERTA" : "CRITICO";
  return salud;
}

void drawAstronauta(const char* estado) {
  int cx = 22, hy = 21;                 // hy = centro del casco
  // mochila (detras del cuerpo)
  oled.fillRoundRect(cx - 11, hy + 9, 22, 22, 5, SH110X_WHITE);
  // brazos con guantes
  oled.fillRoundRect(cx - 15, hy + 12, 5, 14, 2, SH110X_WHITE);
  oled.fillRoundRect(cx + 10, hy + 12, 5, 14, 2, SH110X_WHITE);
  oled.fillCircle(cx - 13, hy + 27, 2, SH110X_WHITE);
  oled.fillCircle(cx + 13, hy + 27, 2, SH110X_WHITE);
  // piernas + botas
  oled.fillRect(cx - 8, hy + 29, 6, 9, SH110X_WHITE);
  oled.fillRect(cx + 2, hy + 29, 6, 9, SH110X_WHITE);
  oled.fillRect(cx - 10, hy + 36, 8, 4, SH110X_WHITE);
  oled.fillRect(cx + 2,  hy + 36, 8, 4, SH110X_WHITE);
  // panel de pecho
  oled.drawRect(cx - 5, hy + 13, 10, 6, SH110X_BLACK);
  oled.fillRect(cx - 3, hy + 15, 2, 2, SH110X_BLACK);
  oled.fillRect(cx + 1, hy + 15, 2, 2, SH110X_BLACK);
  // antena
  oled.drawLine(cx + 9, hy - 10, cx + 12, hy - 14, SH110X_WHITE);
  oled.fillCircle(cx + 12, hy - 14, 1, SH110X_WHITE);
  // casco
  oled.fillCircle(cx, hy, 14, SH110X_WHITE);
  // visor
  oled.fillRoundRect(cx - 10, hy - 7, 20, 14, 6, SH110X_BLACK);
  // reflejo del visor (esquina)
  oled.drawLine(cx - 8, hy - 3, cx - 5, hy - 6, SH110X_WHITE);
  // --- cara (blanco sobre el visor) ---
  int ey = hy - 1;                      // altura de los ojos
  if (strcmp(estado, "BIEN") == 0) {
    oled.fillCircle(cx - 4, ey, 1, SH110X_WHITE);
    oled.fillCircle(cx + 4, ey, 1, SH110X_WHITE);
    // sonrisa
    oled.drawLine(cx - 3, ey + 3, cx - 1, ey + 5, SH110X_WHITE);
    oled.drawLine(cx - 1, ey + 5, cx + 1, ey + 5, SH110X_WHITE);
    oled.drawLine(cx + 1, ey + 5, cx + 3, ey + 3, SH110X_WHITE);
  } else if (strcmp(estado, "ALERTA") == 0) {
    oled.fillCircle(cx - 4, ey, 1, SH110X_WHITE);
    oled.fillCircle(cx + 4, ey, 1, SH110X_WHITE);
    // cejas rectas + boca recta
    oled.drawLine(cx - 6, ey - 3, cx - 2, ey - 3, SH110X_WHITE);
    oled.drawLine(cx + 2, ey - 3, cx + 6, ey - 3, SH110X_WHITE);
    oled.drawLine(cx - 2, ey + 4, cx + 2, ey + 4, SH110X_WHITE);
  } else {                              // CRITICO: preocupado
    oled.fillCircle(cx - 4, ey, 1, SH110X_WHITE);
    oled.fillCircle(cx + 4, ey, 1, SH110X_WHITE);
    // cejas en angulo (internas arriba)
    oled.drawLine(cx - 6, ey - 2, cx - 2, ey - 4, SH110X_WHITE);
    oled.drawLine(cx + 2, ey - 4, cx + 6, ey - 2, SH110X_WHITE);
    // boca triste
    oled.drawLine(cx - 3, ey + 5, cx - 1, ey + 3, SH110X_WHITE);
    oled.drawLine(cx - 1, ey + 3, cx + 1, ey + 3, SH110X_WHITE);
    oled.drawLine(cx + 1, ey + 3, cx + 3, ey + 5, SH110X_WHITE);
  }
}

void printWrap(int x, int y0, int maxChars, const char* txt) {
  oled.setTextSize(1); oled.setTextColor(SH110X_WHITE);
  char linea[40] = ""; int ll = 0, y = y0;
  char palabra[32]; const char* p = txt;
  while (*p) {
    while (*p == ' ') p++;
    int wl = 0;
    while (*p && *p != ' ' && wl < 31) palabra[wl++] = *p++;
    palabra[wl] = 0;
    if (wl == 0) continue;
    if (ll == 0) { strcpy(linea, palabra); ll = wl; }
    else if (ll + 1 + wl <= maxChars) { linea[ll++] = ' '; strcpy(linea + ll, palabra); ll += wl; }
    else { oled.setCursor(x, y); oled.print(linea); y += 10; strcpy(linea, palabra); ll = wl; }
  }
  if (ll > 0) { oled.setCursor(x, y); oled.print(linea); }
}

void header(const char* titulo) {
  oled.fillRect(0, 0, 128, 11, SH110X_WHITE);
  oled.setTextColor(SH110X_BLACK); oled.setTextSize(1);
  oled.setCursor(2, 2); oled.print(titulo);
  oled.setCursor(104, 2); oled.print(autoDemo ? "AUT" : "MAN");
  oled.setTextColor(SH110X_WHITE);
}
void lineaEstado(int http) {
  oled.setCursor(0, 54);
  if (WiFi.status() == WL_CONNECTED) oled.printf("WiFi OK  POST %d", http);
  else                               oled.print("WiFi --  sin red");
}

void pantallaAvatar(float salud, const char* estado) {
  oled.clearDisplay();
  drawAstronauta(estado);
  oled.setTextColor(SH110X_WHITE);
  oled.setTextSize(1); oled.setCursor(50, 4);  oled.print("SALUD");
  oled.setTextSize(2); oled.setCursor(50, 16); oled.printf("%.0f%%", salud);
  oled.setTextSize(1); oled.setCursor(50, 40); oled.print(estado);
  oled.setCursor(98, 4); oled.print(autoDemo ? "AUTO" : "MAN");
  oled.setCursor(50, 52); oled.print(escNombre);
  oled.display();
}
void pantallaVitales(int http) {
  oled.clearDisplay(); header("SIGNOS VITALES");
  oled.setCursor(0, 16); oled.printf("Pulso : %.0f bpm", v_pulso);
  oled.setCursor(0, 28); oled.printf("SpO2  : %.0f %%", v_spo2);
  oled.setCursor(0, 40); oled.printf("T.corp: %.1f C", v_tempc);
  lineaEstado(http); oled.display();
}
void pantallaAmbiente(float t, float h, float uv, const char* nivel, int http) {
  oled.clearDisplay(); header("AMBIENTE / RAD");
  oled.setCursor(0, 16); oled.printf("Temp : %.1f C", t);
  oled.setCursor(0, 28); oled.printf("Hum  : %.0f %%", h);
  oled.setCursor(0, 40); oled.printf("UV   : %.1f %s", uv, nivel);
  lineaEstado(http); oled.display();
}
void pantallaReco(const char* reco) {
  oled.clearDisplay(); header("RECOMENDACION");
  printWrap(0, 16, 21, reco);
  oled.display();
}

void conectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("Conectando a WiFi '%s' ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) { delay(500); Serial.print("."); }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) { Serial.print("WiFi OK. IP: "); Serial.println(WiFi.localIP()); }
  else Serial.println("ERROR WiFi.");
}

int enviarAlServidor(float t, float h, float uv, float salud) {
  if (WiFi.status() != WL_CONNECTED) { conectarWiFi(); return -1; }
  HTTPClient http; http.begin(SERVIDOR); http.addHeader("Content-Type", "application/json");
  char cuerpo[280];
  snprintf(cuerpo, sizeof(cuerpo),
    "{\"detector\":\"%s\",\"temperatura\":%.2f,\"humedad\":%.2f,\"uv\":%.2f,"
    "\"pulso\":%.0f,\"spo2\":%.0f,\"temp_corp\":%.1f,\"sim\":%s,\"salud\":%.0f}",
    DETECTOR, t, h, uv, v_pulso, v_spo2, v_tempc, SIMULAR_VITALES ? "true" : "false", salud);
  int codigo = http.POST(cuerpo);
  http.end();
  return codigo;
}

// Variables de la lectura actual (para redibujar al tocar una tecla)
float g_t, g_h, g_uv, g_salud; const char *g_estado, *g_reco, *g_nivel; int g_http;

void dibujar() {
  if (!oled_ok) return;
  switch (pant) {
    case 0: pantallaAvatar(g_salud, g_estado); break;
    case 1: pantallaVitales(g_http); break;
    case 2: pantallaAmbiente(g_t, g_h, g_uv, g_nivel, g_http); break;
    case 3: pantallaReco(g_reco); break;
  }
}

void actualizar() {
  // Ambiente real
  g_t = NAN; g_h = NAN;
  if (aht_ok) { sensors_event_t eh, et; aht.getEvent(&eh, &et); g_t = et.temperature; g_h = eh.relative_humidity; }
  else if (aht.begin()) aht_ok = true;
  // UV real
  float volt = 0; g_uv = leerUV(volt);
  g_nivel = (g_uv < 3) ? "bajo" : (g_uv < 6) ? "medio" : "ALTO";
  // Vitales
  if (MODO_DEMO) aplicarEscenario();
  else if (SIMULAR_VITALES) simularVitales();
  // Salud
  g_salud = evaluarSalud(v_pulso, v_spo2, v_tempc, g_uv, g_t, g_estado, g_reco);
  // RGB + zumbador segun salud
  if (g_salud >= 80)      rgb(0, 255, 0);
  else if (g_salud >= 50) rgb(255, 170, 0);
  else                  { rgb(255, 0, 0); beep(150); }
  // Envio
  g_http = enviarAlServidor(g_t, g_h, g_uv, g_salud);
  Serial.printf("SALUD:%.0f%% (%s) %s%s | P:%.0f S:%.0f Tc:%.1f UV:%.1f\n",
                g_salud, g_estado, escNombre, autoDemo ? " [AUTO]" : " [MAN]",
                v_pulso, v_spo2, v_tempc, g_uv);
}

void setup() {
  Serial.begin(115200); delay(300);
  Serial.println("\n== ESTACION DE ASTRONAUTA (con teclado) ==");
  pinMode(BUZZER_PIN, OUTPUT); digitalWrite(BUZZER_PIN, LOW);
  pinMode(LED_R_PIN, OUTPUT); pinMode(LED_G_PIN, OUTPUT); pinMode(LED_B_PIN, OUTPUT);
  rgb(0, 0, 0); analogReadResolution(12); randomSeed(esp_random());
  for (int f = 0; f < 4; f++) { pinMode(KP_FILAS[f], OUTPUT); digitalWrite(KP_FILAS[f], HIGH); }
  for (int c = 0; c < 3; c++) pinMode(KP_COLS[c], INPUT_PULLUP);
  Wire.begin(SDA_PIN, SCL_PIN);
  if (oled.begin(OLED_ADDR, true)) {
    oled_ok = true;
    oled.clearDisplay(); oled.setTextColor(SH110X_WHITE);
    oled.setTextSize(1); oled.setCursor(10, 20); oled.print("ESTACION");
    oled.setCursor(10, 34); oled.print("ASTRONAUTA"); oled.display();
    Serial.println("OLED OK.");
  } else Serial.println("ERROR: OLED (0x3C).");
  if (aht.begin()) { aht_ok = true; Serial.println("AHT OK."); }
  else Serial.println("ERROR: AHT (0x38).");
  conectarWiFi();
}

void loop() {
  actualizar();
  dibujar();

  // Espera INTERVALO_MS escaneando el teclado
  uint32_t t0 = millis();
  bool cambio = false;
  while (millis() - t0 < INTERVALO_MS) {
    int k = leerTeclado();
    if (k >= 0 && k != ultTecla) {
      ultTecla = k;
      if (manejarTecla(k)) {           // cambio escenario/modo
        pant = 0;                      // mostrar avatar
        actualizar(); dibujar();       // refresco inmediato
        cambio = true;
      }
    }
    if (k < 0) ultTecla = -1;          // tecla soltada
    delay(25);
  }

  if (!cambio) {
    pant = (pant + 1) % 4;
    if (autoDemo && ++escCont >= ESCENARIOS[escIdx].ciclos) { escCont = 0; escIdx = (escIdx + 1) % N_ESC; }
  }
}
