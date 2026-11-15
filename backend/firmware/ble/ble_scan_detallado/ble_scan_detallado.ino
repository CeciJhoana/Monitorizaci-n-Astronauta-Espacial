/*
   Escaner BLE DETALLADO - busca una Xiaomi Smart Band
   Muestra de cada dispositivo: direccion, nombre, RSSI, UUIDs de servicio
   y datos de fabricante. Marca con [>>> XIAOMI <<<] los candidatos
   (servicio 0xFEE0/0xFEE1 o fabricante 0x0157).
*/
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

BLEScan* pBLEScan;

static String hexStr(const String& s) {
  String out;
  char buf[4];
  for (size_t i = 0; i < s.length(); i++) {
    snprintf(buf, sizeof(buf), "%02x", (uint8_t)s[i]);
    out += buf;
  }
  return out;
}

class CB : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice d) override {
    bool xiaomi = false;
    String linea = "DISP ";
    linea += d.getAddress().toString().c_str();
    linea += "  rssi=" + String(d.getRSSI());

    if (d.haveName()) linea += "  nombre='" + String(d.getName().c_str()) + "'";

    // Servicios anunciados
    for (int i = 0; i < d.getServiceUUIDCount(); i++) {
      String u = d.getServiceUUID(i).toString().c_str();
      linea += "  svc=" + u;
      u.toLowerCase();
      if (u.indexOf("fee0") >= 0 || u.indexOf("fee1") >= 0 || u.indexOf("180d") >= 0)
        xiaomi = true;
    }

    // Datos de fabricante (Xiaomi = 0x0157 -> empieza '5701' en little-endian)
    if (d.haveManufacturerData()) {
      String md = hexStr(d.getManufacturerData());
      linea += "  mfg=" + md;
      if (md.startsWith("5701")) xiaomi = true;
    }

    if (xiaomi) linea += "   [>>> XIAOMI / HR <<<]";
    Serial.println(linea);
  }
};

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n== ESCANER BLE DETALLADO (buscando Xiaomi Band) ==");
  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new CB());
  pBLEScan->setActiveScan(true);   // pide scan response (trae nombre/mas datos)
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99);
}

void loop() {
  Serial.println("--- escaneando 5s ---");
  pBLEScan->start(5, false);
  pBLEScan->clearResults();
  delay(500);
}
