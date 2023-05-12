const mqtt = require("mqtt");
require("dotenv").config();

const connectMqtt = (req, res, next) => {
  const host = "192.168.43.213";
  const port = 1883;
  const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

  //   const connectUrl = `mqtt://${host}:${port}`;
  const connectUrl = `mqtt://${host}:${port}`;
  //unisiasi client mqtt dan jika memang error connect akan dilakukan reconnect
  //dengan periode 5 detik
  const client = mqtt.connect(connectUrl, {
    // username: process.env.USERNAME_CLIENT_MQTT,
    // password: process.env.PASSWORD_CLIENT_MQTT,
    clientId,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 5000,
  });

  //ketika state sudah connect, maka akan log ke console bahwa sudah connect
  client.on("connect", () => {
    console.log(`Connected to ${connectUrl}`);
    client.publish("backend/heyhey", "Hello from backend");
  });

  client.on("error", (error) => {
    console.error(`Failed to connect to broker: ${error}`);
  });

  client.on("reconnect", () => {
    console.log("Attempting to reconnect to broker...");
  });

  client.on("offline", () => {
    console.log("Broker is offline, retrying connection...");
  });

  client.on("close", () => {
    console.log("Connection to broker closed, retrying connection...");
  });

  client.on("end", () => {
    console.log("Connection to broker ended, retrying connection...");
  });

  //ketika program ini terinterupsi, maka client akan disconnect dari broker
  process.on("SIGINT", () => {
    console.log("Disconnecting client...");
    client.end(() => {
      console.log("Client disconnected.");
      process.exit();
    });
  });
};

connectMqtt();
module.exports = { connectMqtt };
