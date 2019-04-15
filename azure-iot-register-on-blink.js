const chalk = require("chalk");
const { blinkLed } = require("./blink");

function onBlink(request, response) {
    // Function to send a direct method reponse to your IoT hub.
    function directMethodResponse(err) {
        if (err) {
            console.error(
                chalk.red(
                    "An error ocurred when sending a method response:\n" +
                        err.toString()
                )
            );
        } else {
            console.log(
                chalk.green(
                    "Response to method '" +
                        request.methodName +
                        "' sent successfully."
                )
            );
        }
    }

    console.log(chalk.green("blink method received"));

    const { blinkTimeInSeconds, blinkIntervalInMs } = request.payload;
    blinkLed(blinkTimeInSeconds, blinkIntervalInMs);

    response.send(200, "Successfully blinked!", directMethodResponse);
}

function registerOnBlink(client) {
    client.onDeviceMethod("blink", onBlink);
}

module.exports = { registerOnBlink };
