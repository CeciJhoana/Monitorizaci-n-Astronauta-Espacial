/*
   DETECTOR DE PINES DE TECLADO MATRICIAL
   --------------------------------------
   No sabemos a que pines del ESP32 esta cableado el teclado.
   Este sketch lo averigua: pon TODOS los pines candidatos con pull-up,
   y uno a uno los pone en LOW para ver si otro pin cae a LOW
   (eso pasa cuando una tecla une una fila con una columna).

   USO: abre el monitor serie, PRESIONA Y MANTEN una tecla.
        Te dira "TECLA entre pin X y pin Y".
        Prueba varias teclas (de distintas filas/columnas) y anota los pares.
        Con eso deducimos los 4 pines de fila y los 4 de columna.

   Pines candidatos = GPIO libres (se excluyen los usados por sensores:
   4,5,18,19 RGB/buzzer; 21,22 I2C; 34 UV; y strapping 0,2,12,15).
*/
#include <Arduino.h>

// Pines candidatos ampliados (se agregan 0,2,4,5,12,15,18,19 por si la 4a columna esta ahi)
const int DRIVE[] = {12, 13, 14, 15, 16, 17, 23, 25, 26, 27, 32, 33};
const int NDRV = sizeof(DRIVE) / sizeof(DRIVE[0]);

const int READP[] = {12, 13, 14, 15, 16, 17, 23, 25, 26, 27, 32, 33};
const int NRD = sizeof(READP) / sizeof(READP[0]);

void todosPullup() {
  for (int i = 0; i < NRD; i++) pinMode(READP[i], INPUT_PULLUP);
}

void setup() {
  Serial.begin(115200);
  delay(400);
  Serial.println("\n== DETECTOR DE TECLADO ==");
  Serial.println("Presiona y manten una tecla. Anota el par de pines.");
  todosPullup();
}

void loop() {
  for (int i = 0; i < NDRV; i++) {
    int d = DRIVE[i];
    pinMode(d, OUTPUT);
    digitalWrite(d, LOW);
    delayMicroseconds(50);
    for (int j = 0; j < NRD; j++) {
      int r = READP[j];
      if (r == d) continue;
      if (digitalRead(r) == LOW) {
        Serial.printf("TECLA entre pin %d  y  pin %d\n", d, r);
        pinMode(d, INPUT_PULLUP);
        todosPullup();
        delay(400);   // antirebote: espera antes de seguir escaneando
        return;
      }
    }
    pinMode(d, INPUT_PULLUP);
  }
  delay(40);
}
