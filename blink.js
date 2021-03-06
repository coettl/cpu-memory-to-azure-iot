const Gpio = require("onoff").Gpio; //include onoff to interact with the GPIO

const LED = new Gpio(4, "out"); //use GPIO pin 4, and specify that it is output

let blinkIntervalId = null;
let blinkInProgress = false;

function blinkLed(seconds, interval) {
    if (!blinkInProgress) {
        blinkInProgress = true;
        blinkIntervalId = setInterval(blinkLED, interval); //run the blinkLED function every 250ms
        setTimeout(endBlink, seconds * 1000); //stop blinking after 5 seconds
    }
}

function blinkLed5Seconds() {
    if (!blinkInProgress) {
        blinkInProgress = true;
        blinkIntervalId = setInterval(blinkLED, 250); //run the blinkLED function every 250ms
        setTimeout(endBlink, 5000); //stop blinking after 5 seconds
    }
}

function switchLedOn(seconds) {
    if (!blinkInProgress) {
        blinkInProgress = true;
        LED.writeSync(1);
        setTimeout(() => {
            LED.writeSync(0);
            blinkInProgress = false;
        }, seconds * 1000);
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
    blinkInProgress = false;
}

process.on("SIGINT", () => {
    LED.unexport();
});

module.exports = { blinkLed, blinkLed5Seconds, switchLedOn };
