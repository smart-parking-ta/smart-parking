#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Servo.h>



// Replace the next variables with your SSID/Password combination
const char* ssid = "Dirrr";
const char* password = "kuyang1234";

// Add your MQTT Broker IP address, example:
const char* mqtt_server = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient client(espClient);
Servo servo1;
long lastMsg = 0;
char msg[50];
int value = 0;

//configure ultrasonic sensor configuration
const int trigPin = 13;
const int echoPin = 18;
static const int servoPin = 5;


//define sound speed in cm/uS
#define SOUND_SPEED 0.034
#define CM_TO_INCH 0.393701

long duration;
float distanceCm;
float distanceInch;

// LED Pin
const int ledPin = 4;

void setup() {
  Serial.begin(115200);

  servo1.attach(servoPin);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  pinMode(trigPin, OUTPUT); // Sets the trigPin as an Output
  pinMode(echoPin, INPUT); // Sets the echoPin as an Input
}

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String messageTemp;
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();

  // Changes the output state according to the message
  if (String(topic) == "esp32/output") {
    Serial.print("Changing output to ");
    if(messageTemp == "on"){
      Serial.println("on");
      digitalWrite(ledPin, HIGH);
    }
    else if(messageTemp == "off"){
      Serial.println("off");
      digitalWrite(ledPin, LOW);
    }
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("hakimclient")) {
      Serial.println("connected");
      // Subscribe
	  // client.subscribe("esp32/output");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void servoFunc(){
    // Servo
    // Buat nutup
  for(int posDegrees = 80; posDegrees <= 180; posDegrees++) {
        servo1.write(posDegrees);
//        Serial.println(posDegrees);
        delay(10);
    }

// Buat membuka
    for(int posDegrees = 180; posDegrees >= 80; posDegrees--) {
        servo1.write(posDegrees);
//        Serial.println(posDegrees);
        delay(10);
    }

}
void loop() {
  
  if (!client.connected()) {
      reconnect();
  }
  client.loop();

  // Clears the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

    // Reads the echoPin, returns the sound wave travel time in microseconds
  duration = pulseIn(echoPin, HIGH);
  
  // Calculate the distance
  distanceCm = duration * SOUND_SPEED/2;
  
  // Convert to inches
  distanceInch = distanceCm * CM_TO_INCH;
  
  // Prints the distance in the Serial Monitor
  Serial.print("Distance (cm): ");
  Serial.println(distanceCm);
  Serial.print("Distance (inch): ");
  Serial.println(distanceInch);

  if (distanceCm < 15){
    servoFunc();
  }
  delay(500);

  long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;

  char distanceString[8];
  dtostrf(distanceCm, 1, 2, distanceString);
  client.publish("esp32/ultrasonic", distanceString);
  
  delay(1000);
  }
}
