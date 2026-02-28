# WebSerial Particle Field & Audio

An interactive audiovisual experience controlled by a physical potentiometer via WebSerial. This project uses an Arduino Uno to send sensor data to a p5.js sketch, which visualizes a "breathing" particle field and generates resonant sound.

## Demo


[Watch the Demo Video](IMG_6951.MOV)

## Features
- **Physical Control:** Adjust the particle field's radius, speed, and noise influence using a potentiometer.
- **Dynamic Audio:** Sine-wave oscillator frequency and amplitude respond to the sensor data.
- **WebSerial API:** Real-time communication between the browser and Arduino (no server required).

## Hardware Setup
- **Microcontroller:** Arduino Uno (or compatible)
- **Sensor:** 10k Ohm Potentiometer
- **Wiring:** 
  - VCC to 5V
  - GND to GND
  - Signal to Pin **A0**

## Software Setup

### 1. Arduino
1. Open the `src/main.cpp` file or copy the code to the Arduino IDE.
2. Upload the sketch to your Arduino Uno.
3. Note the COM port used.

### 2. Browser
1. Open `index.html` in a WebSerial-compatible browser (Google Chrome or Microsoft Edge).
2. Click the **Connect to Serial** button.
3. Select your Arduino's COM port from the list.
4. If the audio is silent, click anywhere on the canvas to enable it.

## Technologies Used
- [p5.js](https://p5js.org/)
- [WebSerial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Arduino](https://www.arduino.cc/)
- [p5.sound](https://p5js.org/reference/#/libraries/p5.sound)
