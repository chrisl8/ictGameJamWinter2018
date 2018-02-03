const webPort = 3000;

const five = require("johnny-five");
const blessed = require('blessed');
const express = require('express');

const stationList = require('./stationList');

// Dump Station data
// for (let i = 0; i < stationList.length; i++) {
//     stationList[i].forEach(button => {
//         console.log(`Station ${i} button ${button.id} is ${button.label}.`);
//     })
// }

const screen = blessed.screen({
    smartCSR: true
});
// The boxes must not be defined before declaring a screen.
const screenBoxes = require('./screenBoxes');

screen.title = 'Push the Button!';

// Append our box to the screen.
screen.append(screenBoxes.topBox);
screen.append(screenBoxes.introductionBox);
screen.append(screenBoxes.waitingToArm1box);
screen.append(screenBoxes.waitingToArm2box);

screenBoxes.introductionBox.pushLine("In the Twenty-Fourth and a Halfth Century humanity has expanded across the galaxy. There are many special people with heroic tasks to accomplish. There are also a lot of mundane tasks that we thought robots would be doing by now, but the the robots have better things to do . . . or perhaps you are a robot, that is also a possibility.\n" +
    "You have one job: push the button . . . buttons . . . and turn the knobs and flip the switches.\n\n" +
 "Arm both stations to begin!");

screenBoxes.waitingToArm1box.setContent("{center}Waiting for Station 1 to Arm.{/center}");
screenBoxes.waitingToArm2box.setContent("{center}Waiting for Station 2 to Arm.{/center}");

let stationOneArmed = false;
screen.key(['a'], (ch, key) => {
    if (stationOneArmed) {
        screenBoxes.waitingToArm1box.setContent("{center}Waiting for Station 1 to Arm.{/center}");
        stationOneArmed = false;
        screen.render();
    } else {
        screenBoxes.waitingToArm1box.setContent("");
        stationOneArmed = true;
        screen.render();
    }
});

let readyToPlay = false;
// Screen change test on t.
screen.key(['t'], function (ch, key) {
    if (readyToPlay) {
        readyToPlay = false;
        screen.remove(screenBoxes.leftBox);
        screen.remove(screenBoxes.rightBox);
        screen.append(screenBoxes.introductionBox);
        screen.append(screenBoxes.waitingToArm1box);
        screen.append(screenBoxes.waitingToArm2box);
        screen.render();
    } else {
        screen.remove(screenBoxes.introductionBox);
        screen.remove(screenBoxes.waitingToArm1box);
        screen.remove(screenBoxes.waitingToArm2box);
        screen.append(screenBoxes.leftBox);
        screen.append(screenBoxes.rightBox);
        screen.render();
        readyToPlay = true;
    }
});

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});

// Render the screen.
screen.render();

let counter = 0;
let boxLineCount = 1; // Start at 1 - Be sure to test this!
const addALineLeft = function () {
    setTimeout(() => {
        if (readyToPlay) {
            if (boxLineCount > screenBoxes.leftBox.height - 2) { // -2 for borders
                screenBoxes.leftBox.deleteTop();
            } else {
                boxLineCount++;
            }
            screenBoxes.leftBox.pushLine(counter + ". Here is another line of text.");
            // screenBoxes.box.pushLine("Height: " + box.height + " Width: " + box.width + " Lines: " + box.content.length);
            counter++;
            screen.render();
        }
        addALineLeft();
    }, 1000);
};

let counter2 = 0;
let boxLineCount2 = 1; // Start at 1 - Be sure to test this!
const addALineRight = function () {
    setTimeout(() => {
        if (readyToPlay) {
            if (boxLineCount2 > screenBoxes.rightBox.height - 2) { // -2 for borders
                screenBoxes.rightBox.deleteTop();
            } else {
                boxLineCount2++;
            }
            screenBoxes.rightBox.pushLine(counter2 + ". Right side line.");
            // screenBoxes.box.pushLine("Height: " + box.height + " Width: " + box.width + " Lines: " + box.content.length);
            counter2++;
            screen.render();
        }
        addALineRight();
    }, 1500);
};

addALineLeft();
addALineRight();

const app = express();

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

const webServer = app.listen(webPort);
// with Sockets?
// const socket = require('socket.io').listen(webServer);

// If no path is given, return files from parent folder (in lieu of what I usually put in 'public')
// This will allow the web site to run from this process too.
app.use(express.static(__dirname + '/../'));

app.get('/stations', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(stationList));
});


// Johnny Five section
// TODO: Set up all Johnny Five devices and set them to update the stationList objects.
const board = new five.Board();

// http://johnny-five.io/api/button/

const johnnyFiveObjects = {};

board.on("ready", function () {

    for (let i = 0; i < stationList.length; i++) {
        stationList[i].forEach(input => {
            if (['switch', 'button'].indexOf(input.type) !== -1) {
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`] = new five.Button({
                    pin: input.pin,
                    isPullup: true
                });
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`].on("press", () => {
                    input.hasBeenPressed = true;
                    input.currentStatus = 'on';
                });
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`].on("hold", () => {
                    input.currentStatus = 'on';
                });
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`].on("release", () => {
                    input.currentStatus = 'off';
                });
            }
            console.log(`Station ${i} input ${input.id} is ${input.label}.`);
        })
    }

});

const gameState = {
    atGameIntro: true,
    gameStarted: false,
    gameOver: false,
};

// TODO: If we are at the intro, don't start until both switches are armed.
// IF somebody disarms a switch, pause the game until it is armed again, then resume.

function primaryGameLoop() {

    if (gameState.atGameIntro) {

    }

    // Are we at the intro or in the game?

    // Is the game over?

    // Are we waiting for input?

    // Is the input good?

    // Update score.

    // Update digits "timer" "clock"

    setTimeout(primaryGameLoop, 10);
}

primaryGameLoop();
