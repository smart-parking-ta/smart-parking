const mqtt = require('mqtt')

const host = 'broker.hivemq.com'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${host}:${port}`
const topic = 'esp32/ultrasonic1'

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
})

client.on('connect', () => {
    client.publish(topic, 'barier on 3', { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  })