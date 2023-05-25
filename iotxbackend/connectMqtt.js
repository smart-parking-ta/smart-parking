const mqtt = require("mqtt");
require("dotenv").config();

//variable untuk menghitung berapa kali reconnect
let counterReconnect = 0;

//fungsi untuk connect ke broker mqtt
const connectMqtt = (req, res, next) => {
  let error = new Error();
  try {
    const host = process.env.HOST_MQTT;
    const port = process.env.PORT_MQTT;
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

    const connectUrl = `mqtt://${host}:${port}`;

    //unisiasi client mqtt dan jika memang error connect akan dilakukan reconnect
    //dengan periode 5 detik
    const client = mqtt.connect(connectUrl, {
      username: process.env.USERNAME_CLIENT_MQTT,
      password: process.env.PASSWORD_CLIENT_MQTT,
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
    });

    //ketika state sudah connect, maka akan log ke console bahwa sudah connect
    client.on("connect", () => {
      counterReconnect = 0;
      console.log(`Connected to ${connectUrl}`);
      req.mqtt = client;
      next();
    });

    client.on("error", (error) => {
      console.error(`Failed to connect to broker: ${error}`);
    });

    client.on("reconnect", () => {
      console.log("Attempting to reconnect to broker...");
      counterReconnect++;

      //jika reconnect sudah melebihi 5 kali, maka akan memberikan pesan error sekaligus masih berusaha untuk reconnect
      if (counterReconnect > 5) {
        console.log("Reconnect failed, exiting...");
        // process.exit(1);
        error.code = 503;
        error.messages = "Failed to connect to broker";
        req.mqttError = error;
        next();
      }
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
  } catch (err) {
    // console.log(err);
    res.status(err.code).send(err.messages).end();
  }
};

module.exports = { connectMqtt };
