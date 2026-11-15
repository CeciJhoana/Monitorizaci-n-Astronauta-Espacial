/*
   TEST de teclado matricial 4x3 (sin libreria)
   FILAS:    13, 14, 26, 27   (salidas)
   COLUMNAS: 25, 32, 33       (entradas con pull-up)
   Imprime la tecla presionada. Sirve para calibrar el mapa:
   si presionas "1" y sale otra, reordenamos filas/columnas.
*/
#include <Arduino.h>

const int FILAS[4] = {13, 14, 26, 27};
const int COLS[3]  = {25, 32, 33};

char MAPA[4][3] = {
  {'1', '2', '3'},
  {'4', '5', '6'},
  {'7', '8', '9'},
  {'*', '0', '#'}
};

void setup() {
  Serial.begin(115200);
  delay(400);
  Serial.println("\n== TEST TECLADO 4x3 ==");
  Serial.println("Presiona teclas; aqui sale la que detecta.");
  for (int f = 0; f < 4; f++) { pinMode(FILAS[f], OUTPUT); digitalWrite(FILAS[f], HIGH); }
  for (int c = 0; c < 3; c++) pinMode(COLS[c], INPUT_PULLUP);
}

int fPin = -1, cPin = -1;
char leerTecla(int &fp, int &cp) {
  char k = 0; fp = -1; cp = -1;
  for (int f = 0; f < 4; f++) {
    digitalWrite(FILAS[f], LOW);
    delayMicroseconds(50);
    for (int c = 0; c < 3; c++) {
      if (digitalRead(COLS[c]) == LOW) { k = MAPA[f][c]; fp = FILAS[f]; cp = COLS[c]; }
    }
    digitalWrite(FILAS[f], HIGH);
  }
  return k;
}

char ultima = 0;
void loop() {
  int fp, cp;
  char k = leerTecla(fp, cp);
  if (k && k != ultima) {
    Serial.printf("TECLA %c -> fila=%d col=%d\n", k, fp, cp);
    ultima = k;
  }
  if (!k) ultima = 0;
  delay(30);
}
