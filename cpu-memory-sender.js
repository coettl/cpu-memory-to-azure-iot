const osu = require("node-os-utils");
const cpu = osu.cpu;
const chalk = require("chalk");
const Mqtt = require("azure-iot-device-mqtt").Mqtt;
const DeviceClient = require("azure-iot-device").Client;
const Message = require("azure-iot-device").Message;
const { switchLedOn, blinkLed5Seconds } = require("./blink");

if (process.argv.length < 3) {
    console.error("No connectionString provided!");
    return;
}

const connectionString = process.argv[2];

const client = DeviceClient.fromConnectionString(connectionString, Mqtt);

let twin = null;
let reportedPropertiesPatch = {
    sendInterval: 0,
    send_cpuWorkload: false,
    send_temperature: false
};

client.getTwin((err, receivedTwin) => {
    if (err) {
        console.log("Failed to get deviceTwin");
        return;
    }

    twin = receivedTwin;

    console.log("Got device twin", twin);

    listenToSendInterval();
    listenToCpuWorkload();
    listenToSendTemperature();
});

let sendIntervalId = null;
function startSendingData() {
    const sendInterval = reportedPropertiesPatch.sendInterval;
    stopSendingData();
    sendIntervalId = setInterval(() => {
        sendCombinedMessage();
    }, sendInterval);
    console.log(
        "Started sending data all " + sendInterval / 1000 + " seconds."
    );
}

function stopSendingData() {
    if (sendIntervalId !== null) {
        clearInterval(sendIntervalId);
        console.log("Stopped sending data");
    }
}

async function sendCombinedMessage() {
    const sendCpu = reportedPropertiesPatch.send_cpuWorkload;
    const sendTemperature = reportedPropertiesPatch.send_temperature;

    let sendObject = {};

    if (sendCpu) {
        sendObject = {};
        const cpuPercentage = await cpu.usage();
        sendObject.cpu = cpuPercentage;
    }

    if (sendTemperature) {
        const temperature = 20 + Math.random() * 15;
        sendObject.avg = temperature;
    }

    if (Object.keys(sendObject).length > 0) {
        const message = new Message(JSON.stringify(sendObject));
        console.log("Sending combinded Message: " + message.getData());
        client.sendEvent(message, error => {
            if (error) {
                console.error("send error: " + err.toString());
            } else {
                console.log("CombinedObject sent");
            }
        });
    } else {
        console.log("Nothing to send!");
    }
}

function listenToSendInterval() {
    twin.on("properties.desired.sendInterval", prop => {
        console.log("Desired sendInterval", prop);
        switchLedOn(3);

        const sendInterval = prop.value * 1000;
        reportedPropertiesPatch.sendInterval = sendInterval;
        sendUpdate("sendInterval", prop.value);
        startSendingData();
    });
}

function listenToCpuWorkload() {
    twin.on("properties.desired.send_cpuWorkload", prop => {
        console.log("Desired send_cpuWorkload", prop);
        switchLedOn(3);

        reportedPropertiesPatch.send_cpuWorkload = prop.value;
        sendUpdate("send_cpuWorkload", prop.value);
    });
}

function listenToSendTemperature() {
    twin.on("properties.desired.send_temperature", prop => {
        console.log("Desired send_temperature", prop);
        switchLedOn(3);

        reportedPropertiesPatch.send_temperature = prop.value;
        sendUpdate("send_temperature", prop.value);
    });
}

function sendUpdate(propertyName, propertyValue) {
    const patch = {
        [propertyName]: propertyValue
    };

    console.log("SendUpdate", patch);

    twin.properties.reported.update(patch, err => {
        if (err) {
            console.error("Failed to update " + propertyName, err);
        } else {
            console.log(
                "Successfully updated " +
                    propertyName +
                    ' with value "' +
                    propertyValue +
                    '"'
            );
        }
    });
}
