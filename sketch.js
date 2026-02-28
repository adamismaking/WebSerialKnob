/**
 * p5.js WebSerial Particle Field (Audiovisual Version)
 * 
 * Visualization: A "breathing" particle field controlled by an Arduino potentiometer.
 * Sound: A resonant sine-wave oscillator that breathes with the particles.
 */

let serialPort;
let connected = false;

// Sensor data
let rawPotValue = 0;
let smoothedPotValue = 0;

// Audio
let osc;
let filter;
let audioStarted = false;

// Particles configuration
let particles = [];
const numParticles = 600;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  background(0);
  
  // Initialize particles
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }

  // Audio setup: Low-pass filter for a "softer" sound
  // We'll initialize these here, but they won't make sound until osc.start() and osc.amp()
  try {
    filter = new p5.LowPass();
    osc = new p5.Oscillator('sine');
    osc.disconnect(); 
    osc.connect(filter);
    osc.start();
    osc.amp(0); // Start silent
    console.log("Audio initialized");
  } catch (e) {
    console.error("Audio initialization failed:", e);
  }

  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      if (connected) return;
      
      console.log("Connect button clicked");

      // Resume audio context (required by browsers)
      if (!audioStarted) {
        try {
          userStartAudio().then(() => {
            audioStarted = true;
            console.log("Audio started successfully");
          });
        } catch (e) {
          console.error("Failed to start audio:", e);
        }
      }

      try {
        console.log("Requesting serial port...");
        serialPort = await navigator.serial.requestPort();
        await serialPort.open({ baudRate: 115200 });
        console.log("Connected to serial port at 115200 baud");
        connected = true;
        connectBtn.innerText = "Connected!";
        connectBtn.style.display = 'none';
        readSerial();
      } catch (e) {
        console.error('Serial Connection Error: ', e);
        alert('Connection Error: ' + e.message + "\n\nTry refreshing and using Chrome or Edge.");
      }
    });
  }
}

function draw() {
  background(0, 0.15); 

  // Smooth the raw sensor data
  smoothedPotValue = lerp(smoothedPotValue, rawPotValue, 0.05);

  // Map sensor value to visual parameters
  let targetRadius = map(smoothedPotValue, 0, 1023, 50, height * 0.4);
  let globalSpeed = map(smoothedPotValue, 0, 1023, 0.002, 0.02);
  let noiseInfluence = map(smoothedPotValue, 0, 1023, 0, 80);

  // Map sensor value to audio parameters
  if (connected && audioStarted && osc) {
    try {
      // Frequency: 100Hz (low hum) to 400Hz (resonant tone)
      let freq = map(smoothedPotValue, 0, 1023, 100, 400);
      osc.freq(freq, 0.1); // 0.1s ramp for smooth pitch shift
      
      // Amplitude: Soft breathing volume
      let vol = map(smoothedPotValue, 0, 1023, 0.05, 0.25);
      osc.amp(vol, 0.1);

      // Filter: Open up the sound as it gets louder
      let filterFreq = map(smoothedPotValue, 0, 1023, 200, 2000);
      filter.freq(filterFreq);
    } catch (e) {
      console.error("Audio update error:", e);
    }
  }

  push();
  translate(width / 2, height / 2);
  for (let p of particles) {
    p.update(globalSpeed, targetRadius, noiseInfluence);
    p.display();
  }
  pop();

  // On-screen information
  if (connected) {
    fill(0, 0, 50);
    textAlign(LEFT, TOP);
    textSize(14);
    text(`Sensor: ${Math.round(rawPotValue)}`, 20, 20);
    if (!audioStarted) {
      fill(0, 80, 80);
      text("Click screen to enable audio if silent", 20, 40);
    }
  } else {
    fill(0, 0, 70);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("1. Connect Arduino Uno\n2. Click 'Connect to Serial'\n3. Turn Potentiometer", width / 2, height / 2 + 50);
  }
}

// Ensure audio starts if user clicks anywhere on the canvas
function mousePressed() {
  if (!audioStarted && connected) {
    userStartAudio().then(() => {
      audioStarted = true;
      console.log("Audio started via mouse press");
    });
  }
}

class Particle {
  constructor() {
    this.angle = random(TWO_PI);
    this.baseDist = random(0.8, 1.2);
    this.size = random(1.5, 4);
    this.noiseOffset = random(1000);
    this.rotation = 0;
    
    this.x = 0; this.y = 0;
    this.px = 0; this.py = 0;
    this.velocity = 0;
  }

  update(speed, radius, noiseAmount) {
    this.rotation += speed;
    this.px = this.x; this.py = this.y;

    let n = noise(this.angle + frameCount * 0.01, this.noiseOffset);
    let offset = map(n, 0, 1, -noiseAmount, noiseAmount);
    let r = (radius * this.baseDist) + offset;
    
    this.x = cos(this.angle + this.rotation) * r;
    this.y = sin(this.angle + this.rotation) * r;
    this.velocity = dist(this.x, this.y, this.px, this.py);
  }

  display() {
    let hue = map(this.velocity, 0, 10, 210, 180);
    let brightness = map(this.velocity, 0, 10, 40, 100);
    let saturation = map(this.velocity, 0, 10, 80, 0); 

    noStroke();
    fill(hue, saturation, brightness, 0.8);
    ellipse(this.x, this.y, this.size, this.size);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

async function readSerial() {
  while (serialPort && serialPort.readable) {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    try {
      let partialLine = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("Serial stream closed");
          break;
        }
        
        partialLine += value;
        let lines = partialLine.split(/\r?\n/);
        partialLine = lines.pop();

        for (let line of lines) {
          let trimmed = line.trim();
          if (trimmed !== "") {
            let val = parseInt(trimmed);
            if (!isNaN(val)) {
              rawPotValue = constrain(val, 0, 1023);
            }
          }
        }
      }
    } catch (e) {
      console.error('Serial Reading Error:', e);
      connected = false;
    } finally {
      reader.releaseLock();
    }
  }
}
