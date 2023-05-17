/*
This example uses FreeRTOS softwaretimers as there is no built-in Ticker library
*/
#include <stdio.h>
#include <string.h>
#include <WiFi.h>
extern "C"
{
#include "freertos/FreeRTOS.h"
#include "freertos/timers.h"
}
#include <AsyncMqttClient.h>
#include <Servo.h>

#define WIFI_SSID "rel"
#define WIFI_PASSWORD "gerigiroda"

#define MQTT_HOST IPAddress(192, 168, 43, 213)
#define MQTT_PORT 1883

// Servo Variable
Servo myservo;
int pos = 170;

// Ultrasonic variable
const int trigPin = 5;
const int echoPin = 18;
#define SOUND_SPEED 0.034
#define CM_TO_INCH 0.393701
long duration;
float distanceCm;
float distanceInch;

// Current State for Barrier & Ultrasonic
bool checkInPass = false;
bool checkOutPass = false;

AsyncMqttClient mqttClient;
TimerHandle_t mqttReconnectTimer;
TimerHandle_t wifiReconnectTimer;

void connectToWifi()
{
    Serial.println("Connecting to Wi-Fi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void connectToMqtt()
{
    Serial.println("Connecting to MQTT...");
    mqttClient.connect();
}

void WiFiEvent(WiFiEvent_t event)
{
    Serial.printf("[WiFi-event] event: %d\n", event);
    switch (event)
    {
    case SYSTEM_EVENT_STA_GOT_IP:
        Serial.println("WiFi connected");
        Serial.println("IP address: ");
        Serial.println(WiFi.localIP());
        connectToMqtt();
        break;
    case SYSTEM_EVENT_STA_DISCONNECTED:
        Serial.println("WiFi lost connection");
        // xTimerStop(mqttReconnectTimer, 0); // ensure we don't reconnect to MQTT while reconnecting to Wi-Fi
        // xTimerStart(wifiReconnectTimer, 0);
        break;
    }
}

void onMqttConnect(bool sessionPresent)
{
    Serial.println("Connected to MQTT.");
    Serial.print("Session present: ");
    Serial.println(sessionPresent);

    uint16_t packetIdSub2 = mqttClient.subscribe("backend/checkOut", 2);
    Serial.print("Subscribing at QoS 2, packetId: ");
    Serial.println(packetIdSub2);
}

void onMqttDisconnect(AsyncMqttClientDisconnectReason reason)
{
    Serial.println("Disconnected from MQTT.");

    if (WiFi.isConnected())
    {
        xTimerStart(mqttReconnectTimer, 0);
    }
}

void onMqttSubscribe(uint16_t packetId, uint8_t qos)
{
    Serial.println("Subscribe acknowledged.");
    Serial.print("  packetId: ");
    Serial.println(packetId);
    Serial.print("  qos: ");
    Serial.println(qos);
}

void onMqttUnsubscribe(uint16_t packetId)
{
    Serial.println("Unsubscribe acknowledged.");
    Serial.print("  packetId: ");
    Serial.println(packetId);
}

bool includeString(char text[], char searchString[])
{
    char *result = strstr(text, searchString);
    if (result != NULL)
    {
        return true;
    }
    else
    {
        printf("'%s' not found in '%s'.\n", searchString, text);
        return false;
    }
}

void onMqttMessage(char *topic, char *payload, AsyncMqttClientMessageProperties properties, size_t len, size_t index, size_t total)
{
    Serial.println("Publish received.");
    Serial.print("  topic: ");
    Serial.println(topic);
    Serial.print("  qos: ");
    Serial.println(properties.qos);
    Serial.print("  dup: ");
    Serial.println(properties.dup);
    Serial.print("  retain: ");
    Serial.println(properties.retain);
    Serial.print("  len: ");
    Serial.println(len);
    Serial.print("  index: ");
    Serial.println(index);
    Serial.print("  total: ");
    Serial.println(total);
    Serial.println(" payload ");
    Serial.println(payload);

    if (strcmp(topic, "backend/checkIn") == 0)
    {
        if (includeString(payload, "OPEN"))
        {
            barrierOpen();
            checkInPass = true;
        }
        else if (includeString(payload, "CLOSE"))
        {
            checkInPass = false;
            barrierClosed();
        }
        else
        {
            Serial.println("there is no condition for this payload input");
        }
    }

    else if (strcmp(topic, "backend/checkOut") == 0)
    {
        if (includeString(payload, "OPEN"))
        {
            barrierOpen();
            checkOutPass = true;
        }
        else if (includeString(payload, "CLOSE"))
        {
            checkOutPass = false;
            barrierClosed();
        }
        else
        {
            Serial.println("there is no condition for this payload input");
        }
    }
    else
    {
        Serial.println("there is no condition for this topic");
    }
}

void onMqttPublish(uint16_t packetId)
{
    Serial.println("Publish acknowledged.");
    Serial.print("  packetId: ");
    Serial.println(packetId);
}

// fungsi untuk membuka barrier
void barrierOpen()
{
    for (pos = 170; pos >= 80; pos -= 1)
    { // goes from 0 degrees to 180 degrees
        // in steps of 1 degree
        myservo.write(pos); // tell servo to go to position in variable 'pos'
        delay(15);          // waits 15ms for the servo to reach the position
    }
}

// fungsi untuk menutup barrier
void barrierClosed()
{
    for (pos = 80; pos <= 170; pos += 1)
    { // goes from 0 degrees to 180 degrees
        // in steps of 1 degree
        myservo.write(pos); // tell servo to go to position in variable 'pos'
        delay(15);          // waits 15ms for the servo to reach the position
    }
}

// fungsi untuk mengaktifkan sensor ultrasonic
void ultrasonicListen()
{
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
    distanceCm = duration * SOUND_SPEED / 2;

    // Convert to inches
    distanceInch = distanceCm * CM_TO_INCH;

    // Prints the distance in the Serial Monitor
    Serial.print("Distance (cm): ");
    Serial.println(distanceCm);
    delayMicroseconds(1000);
}

void ultrasonicPublishClose(char phase[])
{
    Serial.println("Publishing at Ultrasonic for Closing the Barrier");

    if (strcmp(phase, "checkIn") == 0)
    {
        mqttClient.publish("backend/checkIn", 2, false, "CLOSE");
    }
    else if (strcmp(phase, "checkOut") == 0)
    {
        mqttClient.publish("backend/checkOut", 2, false, "CLOSE");
    }
}

void setup()
{
    Serial.begin(115200);
    Serial.println();
    Serial.println();
    myservo.attach(13);

    pinMode(trigPin, OUTPUT); // Sets the trigPin as an Output
    pinMode(echoPin, INPUT);  // Sets the echoPin as an Input

    mqttReconnectTimer = xTimerCreate("mqttTimer", pdMS_TO_TICKS(2000), pdFALSE, (void *)0, reinterpret_cast<TimerCallbackFunction_t>(connectToMqtt));
    wifiReconnectTimer = xTimerCreate("wifiTimer", pdMS_TO_TICKS(2000), pdFALSE, (void *)0, reinterpret_cast<TimerCallbackFunction_t>(connectToWifi));

    WiFi.onEvent(WiFiEvent);

    mqttClient.onConnect(onMqttConnect);
    mqttClient.onDisconnect(onMqttDisconnect);
    mqttClient.onSubscribe(onMqttSubscribe);
    mqttClient.onUnsubscribe(onMqttUnsubscribe);
    mqttClient.onMessage(onMqttMessage);
    mqttClient.onPublish(onMqttPublish);
    mqttClient.setServer(MQTT_HOST, MQTT_PORT);

    connectToWifi();
}

void loop()
{
    // buat kondisi jika ultrasonik perlu dinyalain atau ngga
    // state apa yang bikin ultrasonik itu aktif atau inaktif

    // jika state sudah open, maka ultrasonik aktif
    if (checkInPass)
    {
        ultrasonicListen();

        // jika jarak ultrasonik <3 meter, maka publish message (closed ke topic backend/checkIn)
        if (distanceCm >= 5 && distanceCm <= 10)
        {
            ultrasonicPublishClose("checkIn");
            delay(2000);
        }

        // Masalahnya kalau pake variabel checkInPass false di subscribe itu harus jalanin servo yang perlu beberapa detik
        // sedangkan disini itu terus loop tiap frame jadinya beberapa loop ini statenya masih checkInPass true;
        // jadinya solusinya menggunakan delay
    }

    if (checkOutPass)
    {
        ultrasonicListen();

        // jika jarak ultrasonik <3 meter, maka publish message (closed ke topic backend/checkIn)
        if (distanceCm >= 5 && distanceCm <= 10)
        {
            ultrasonicPublishClose("checkOut");
            delay(2000);
        }
    }

    // saat aktif ultrasonik akan mendeteksi terus menerus

    // ada dua sensor ultrasonic, gimana jalan bersamaan?
}