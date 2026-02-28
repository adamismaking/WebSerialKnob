#include <Arduino.h>

const int POT_PIN = A0;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int potValue = analogRead(POT_PIN);
  Serial.println(potValue);
  delay(10); 
}
