// Designating pins
// Lights
const int ledBlue = 13;
const int ledGreen = 12;
const int ledRed = 11;
const int ledYellow = 10;
// Button
const int buttonPin = 2;

// Button input default to 0
int buttonState = 0;
// Make sure to only send one input. A single button press usually sends a dozen or so
bool once = false;

// Setting up pins and starting serial
void setup() {
  // Lights are output
  pinMode(ledBlue, OUTPUT);
  pinMode(ledGreen, OUTPUT);
  pinMode(ledRed, OUTPUT);
  pinMode(ledYellow, OUTPUT);
  // Button is input
  pinMode(buttonPin, INPUT);
  // Start input
  Serial.begin(9600);
}

// Main body of program
void loop() 
{
  // Get button input
  buttonState = digitalRead(buttonPin);
  // If button pressed
  if (buttonState == HIGH)
  {
    // Send a single "button"
    if (!once)
    {
      // Set once to true so only one message gets sent
      once = true;
      Serial.println("button");
    }
  }
  // Reset once flag to false
  else
  {
    once = false;
  }

  // If recieving input from p5
  while (Serial.available() > 0)
  {
    // Assigning 1 or 0 to color variables
    int red = Serial.parseInt();
    int yellow = Serial.parseInt();
    int blue = Serial.parseInt();
    int green = Serial.parseInt();

    // Once we hit a new line char
    if (Serial.read() == '\n')
    {
      // If we recieved a 1 in the formatted string
      // Turn that light on
      // Otherwise turn that light off
      if (red == 1) 
      {
        digitalWrite(ledRed,HIGH);
      } else digitalWrite(ledRed,LOW);
      if (yellow == 1) 
      {
        digitalWrite(ledYellow,HIGH);
      } else digitalWrite(ledYellow,LOW);
      if (green == 1) 
      {
        digitalWrite(ledGreen,HIGH);
      } else digitalWrite(ledGreen,LOW);
      if (blue == 1) 
      {
        digitalWrite(ledBlue,HIGH);
      } else digitalWrite(ledBlue,LOW);
    }
  }
 }

