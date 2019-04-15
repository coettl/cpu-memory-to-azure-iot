const osu = require("node-os-utils");
const cpu = osu.cpu;
const chalk = require("chalk");
const Mqtt = require("azure-iot-device-mqtt").Mqtt;
const DeviceClient = require("azure-iot-device").Client;
const Message = require("azure-iot-device").Message;
// const blink = require("./blink");

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
        blinkLed5Seconds();

        const sendInterval = prop.value * 1000;
        reportedPropertiesPatch.sendInterval = sendInterval;
        sendUpdate("sendInterval", prop.value);
        startSendingData();
    });
}

function listenToCpuWorkload() {
    twin.on("properties.desired.send_cpuWorkload", prop => {
        console.log("Desired send_cpuWorkload", prop);
        blinkLed5Seconds();

        reportedPropertiesPatch.send_cpuWorkload = prop.value;
        sendUpdate("send_cpuWorkload", prop.value);
    });
}

function listenToSendTemperature() {
    twin.on("properties.desired.send_temperature", prop => {
        console.log("Desired send_temperature", prop);
        blinkLed5Seconds();

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

const Gpio = require("onoff").Gpio; //include onoff to interact with the GPIO
const LED = new Gpio(4, "out"); //use GPIO pin 4, and specify that it is output

let blinkIntervalId = null;
let blinkInProgress = false;

function blinkLed5Seconds() {
    if (!blinkInProgress) {
        blinkInProgress = true;
        blinkIntervalId = setInterval(blinkLED, 250); //run the blinkLED function every 250ms
        setTimeout(endBlink, 5000); //stop blinking after 5 seconds
    }
}

function blinkLED() {
    //function to start blinking
    if (LED.readSync() === 0) {
        //check the pin state, if the state is 0 (or off)
        LED.writeSync(1); //set pin state to 1 (turn LED on)
    } else {
        LED.writeSync(0); //set pin state to 0 (turn LED off)
    }
}

function endBlink() {
    clearInterval(blinkIntervalId); // Stop blink intervals
    LED.writeSync(0); // Turn LED off
    LED.unexport(); // Unexport GPIO to free resources
    blinkInProgress = false;
}

process.on("SIGINT", () => {
    led.unexport();
    button.unexport();
});
