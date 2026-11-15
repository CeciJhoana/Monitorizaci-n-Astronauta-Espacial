/*
   Explorador GATT para ESP32 (core 3.x)
   - Se conecta a una MAC fija (tu Xiaomi Smart Band 9)
   - Lista TODOS los servicios y caracteristicas que expone
   - Intenta suscribirse al Heart Rate Measurement (0x2A37) e imprime datos

   NOTA: las bandas Xiaomi usan autenticacion cifrada. Es muy probable que
   se conecte y liste servicios, pero que NO envie notificaciones de pulso
   sin la clave de emparejamiento. Este sketch sirve para ver EXACTAMENTE
   que deja leer tu banda sin autenticacion.
*/
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEClient.h>
#include <BLEAddress.h>

// ---- Configuracion ----
static const char* TARGET_MAC = "08:16:d5:8d:59:10";  // tu banda
#define LED_ONBOARD   2

// UUIDs estandar de ritmo cardiaco (Bluetooth SIG)
static BLEUUID HRS_SERVICE_UUID((uint16_t)0x180D);  // Heart Rate Service
static BLEUUID HRM_CHAR_UUID((uint16_t)0x2A37);     // Heart Rate Measurement

static boolean doConnect = true;
static boolean connected = false;
static BLEClient* pClient = nullptr;

// ---- Callback de notificaciones (datos que llegan de la banda) ----
static void notifyCallback(BLERemoteCharacteristic* pChar,
                           uint8_t* pData, size_t length, bool isNotify) {
  Serial.print("[NOTIFY] ");
  Serial.print(pChar->getUUID().toString().c_str());
  Serial.print(" -> bytes: ");
  for (size_t i = 0; i < length; i++) {
    Serial.printf("%02X ", pData[i]);
  }
  // Interpretacion estandar de Heart Rate Measurement (0x2A37)
  if (pChar->getUUID().equals(HRM_CHAR_UUID) && length >= 2) {
    uint8_t flags = pData[0];
    uint16_t hr;
    if (flags & 0x01) {           // formato uint16
      hr = pData[1] | (pData[2] << 8);
    } else {                      // formato uint8
      hr = pData[1];
    }
    Serial.printf("| Pulso: %u bpm", hr);
  }
  Serial.println();
}

class MyClientCallbacks : public BLEClientCallbacks {
  void onConnect(BLEClient* c) override {
    Serial.println(">>> Conectado a la banda");
  }
  void onDisconnect(BLEClient* c) override {
    connected = false;
    Serial.println(">>> Desconectado");
  }
};

// ---- Recorre e imprime todos los servicios y caracteristicas ----
void dumpGatt(BLEClient* client) {
  Serial.println("\n================ SERVICIOS GATT ================");
  std::map<std::string, BLERemoteService*>* services = client->getServices();
  for (auto const& s : *services) {
    BLERemoteService* svc = s.second;
    Serial.printf("\n[SERVICE] %s\n", svc->getUUID().toString().c_str());

    std::map<std::string, BLERemoteCharacteristic*>* chars = svc->getCharacteristics();
    for (auto const& c : *chars) {
      BLERemoteCharacteristic* ch = c.second;
      Serial.printf("   - CHAR %s  [%s%s%s%s]\n",
                    ch->getUUID().toString().c_str(),
                    ch->canRead()     ? "R"  : "-",
                    ch->canWrite()    ? "W"  : "-",
                    ch->canNotify()   ? "N"  : "-",
                    ch->canIndicate() ? "I"  : "-");
      // Si se puede leer, intenta leer el valor
      if (ch->canRead()) {
        String v = ch->readValue();
        if (v.length() > 0) {
          Serial.print("        valor: ");
          for (size_t i = 0; i < v.length(); i++) Serial.printf("%02X ", (uint8_t)v[i]);
          Serial.println();
        }
      }
    }
  }
  Serial.println("\n===============================================");
}

bool connectToBand() {
  Serial.printf("Conectando a %s ...\n", TARGET_MAC);
  pClient = BLEDevice::createClient();
  pClient->setClientCallbacks(new MyClientCallbacks());

  BLEAddress addr(TARGET_MAC);
  // type = 1 (random) porque las bandas Xiaomi suelen usar direccion aleatoria.
  // Si falla, prueba con type 0 (public).
  if (!pClient->connect(addr, BLE_ADDR_TYPE_RANDOM)) {
    Serial.println("Fallo la conexion (random). Reintentando como public...");
    if (!pClient->connect(addr, BLE_ADDR_TYPE_PUBLIC)) {
      Serial.println("Fallo la conexion (public tambien).");
      return false;
    }
  }
  connected = true;

  // Lista todo lo que expone la banda
  dumpGatt(pClient);

  // Intenta suscribirse al ritmo cardiaco
  BLERemoteService* hrs = pClient->getService(HRS_SERVICE_UUID);
  if (hrs != nullptr) {
    Serial.println("\nServicio de Heart Rate (0x180D) encontrado.");
    BLERemoteCharacteristic* hrm = hrs->getCharacteristic(HRM_CHAR_UUID);
    if (hrm != nullptr && hrm->canNotify()) {
      hrm->registerForNotify(notifyCallback);
      Serial.println("Suscrito a notificaciones de pulso. Esperando datos...");
    } else {
      Serial.println("La caracteristica 0x2A37 no permite notify (o no existe).");
    }
  } else {
    Serial.println("\nNo expone el servicio estandar de Heart Rate (0x180D).");
    Serial.println("Probablemente usa su protocolo propietario cifrado.");
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nESP32 BLE GATT Explorer - Xiaomi Smart Band 9");

  pinMode(LED_ONBOARD, OUTPUT);
  digitalWrite(LED_ONBOARD, LOW);

  BLEDevice::init("ESP32-Explorer");
}

void loop() {
  if (doConnect) {
    if (connectToBand()) {
      digitalWrite(LED_ONBOARD, HIGH);
    }
    doConnect = false;  // solo intenta una vez al arrancar
  }

  // Si se cae la conexion, reintenta pasado un rato
  if (!connected && !doConnect) {
    digitalWrite(LED_ONBOARD, LOW);
    delay(5000);
    Serial.println("Reintentando conexion...");
    doConnect = true;
  }

  delay(1000);
}
