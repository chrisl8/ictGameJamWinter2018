"use strict";
const webPort = 3000;

const five = require("johnny-five");
const blessed = require('blessed');
const express = require('express');
const {spawn} = require('child_process');

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

screenBoxes.introductionBox.setContent("{center}Booting Universe, please stand by . . .");

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});

// Render the screen.
screen.render();

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
    const dataToSend = {
        buttonState: stationList,
        score: gameState.score,
        timeRemaining: (gameState.maxTime * (1000 / loopTime)) - gameState.timeElapsed,
    };
    res.send(JSON.stringify(dataToSend));
});


// Johnny Five section
// TODO: Set up all Johnny Five devices and set them to update the stationList objects.
const board = new five.Board({
    repl: false, // IF ou don't want the REPL to display, because maybe you are doing something else on the terminal, turn it off this way.
    debug: false, // Same for the "debug" messages like board Found and Connected.
});

// http://johnny-five.io/api/button/

const johnnyFiveObjects = {};

const gameState = {
    atGameIntro: true,
    gameStarted: false,
    gameOver: false,
    boardInitiated: false,
    waitingForInput: false,
    nextInstructionForSide1: 1,
    nextInstructionForSide2: 1,
    requiredKnobPosition1: null,
    requiredKnobPosition2: null,
    score: 0,
    lastThreeInputs: [0, 0, 0],
    timeElapsed: 0,
    initialTIme: 10,
    maxTime: 10,
    clockUpdate: 0,
};

board.on("ready", function () {

    johnnyFiveObjects.digitalReadout2 = new five.Led.Digits({
        controller: "HT16K33",
    });
    johnnyFiveObjects.digitalReadout1 = new five.Led.Digits({
        controller: "HT16K33",
    });

    for (let i = 0; i < stationList.length; i++) {
        stationList[i].forEach(input => {
            if (['switch', 'button'].indexOf(input.type) !== -1) {
                let isPullup = true;
                if (input.subType === "arm") {
                    isPullup = false;
                }
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`] = new five.Button({
                    pin: input.pin,
                    isPullup: isPullup
                });
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`].on("press", () => {
                    input.hasBeenPressed = true;
                    input.currentStatus = 'on';
                    let soundName = '1';
                    if (input.correct) {
                        soundName = '328120__kianda__powerup';
                        if (input.subType === 'big') {
                            soundName = 'theOneButton';
                        }
                    }
                    if (input.subType === 'arm') {
                        soundName = '369867__samsterbirdies__radio-beep';
                    }
                    spawn("aplay", [`sounds/${soundName}.wav`]);
                });
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`].on("hold", () => {
                    input.currentStatus = 'on';
                });
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`].on("release", () => {
                    input.hasBeenPressed = true;
                    input.currentStatus = 'off';
                    if (input.type === 'switch') {
                        let soundName = '4';
                        if (input.correct) {
                            soundName = '328120__kianda__powerup';
                        }
                        spawn("aplay", [`sounds/${soundName}.wav`]);
                    }
                });
            } else if (input.type === "knob") {
                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`] = new five.Sensor({
                    pin: input.pin,
                    threshold: 1, // This will emit a 'change' if it changes by this much.
                    // freq: 250 // This will emit data every x milliseconds, even if no change has occured.
                });

                // Inject the `sensor` hardware into
                // the Repl instance's context;
                // allows direct command line access
                // board.repl.inject({
                //     pot: potentiometer
                // });

                // "data" get the current reading from the potentiometer
                /*
              potentiometer.on("data", function() {
                console.log(this.value, this.raw);
              });
              */

                johnnyFiveObjects[`${i}-${input.type}-${input.subType}-${input.id}`].on("change", function () {
                    input.hasBeenPressed = true;
                    input.currentStatus = this.value;
                    // console.log(input);
                })

            }
            // console.log(`Station ${i} input ${input.id} is ${input.label}.`);
        })
    }

    gameState.boardInitiated = true;

});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const loopTime = 10;

function getRange(int) {
    const ranges = {
        down: {less: 10, greater: 950},
        left: {less: 950, greater: 600},
        up: {less: 600, greater: 300},
        right: {less: 300, greater: 10}
    };
    for (const vector in ranges) {
        if (int < ranges[vector].less && int > ranges[vector].greater) {
            // we found the right one
            return vector;
        } else if (ranges[vector].less < ranges[vector].greater) {
            if (int < ranges[vector].less || int > ranges[vector].greater) {
                return vector;
            }
        }
    }
}

function getRandVector() {
    const possibleVectors = ["up", "down", "left", "right"];
    const rand = Math.floor(Math.random() * possibleVectors.length);
    return possibleVectors[rand];
}

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function updateDigitalReadout() {
    if (gameState.clockUpdate > 5) {
        const output = pad((gameState.maxTime * (1000 / loopTime)) - gameState.timeElapsed, 4);
        johnnyFiveObjects.digitalReadout1.print(output);
        johnnyFiveObjects.digitalReadout2.print(output);
        gameState.clockUpdate = 0;
    } else {
        gameState.clockUpdate++;
    }
}

function primaryGameLoop() {
    if (gameState.boardInitiated) {
        if (gameState.atGameIntro) {
            updateDigitalReadout();
            screen.append(screenBoxes.introductionBox);
            screenBoxes.introductionBox.setContent("In the Twenty-Fourth and a Halfth Century humanity has expanded across the galaxy. There are many special people with heroic tasks to accomplish. There are also a lot of mundane tasks that we thought robots would be doing by now, but the the robots have better things to do . . . or perhaps you are a robot, that is also a possibility.\n" +
                "You have one job: push the button . . . buttons . . . and turn the knobs and flip the switches.\n\n" +
                "Arm both stations to begin!");
            if (stationList[0][0].currentStatus !== 'on') {
                screenBoxes.waitingToArm1box.setContent("{center}Waiting for Station 1 to Arm.{/center}");
                screen.append(screenBoxes.waitingToArm1box);
            } else {
                screen.remove(screenBoxes.waitingToArm1box);
            }
            if (stationList[1][0].currentStatus !== 'on') {
                screenBoxes.waitingToArm2box.setContent("{center}Waiting for Station 2 to Arm.{/center}");
                screen.append(screenBoxes.waitingToArm2box);
            } else {
                screen.remove(screenBoxes.waitingToArm2box);
            }
            if (stationList[0][0].currentStatus === 'on' && stationList[1][0].currentStatus === 'on') {
                gameState.atGameIntro = false;
            }
            screen.render();
        } else if (!gameState.gameStarted) {
            gameState.score = 0;
            screen.remove(screenBoxes.introductionBox);
            screen.append(screenBoxes.commandBox);
            screenBoxes.commandBox.setContent("{center}Get ready!{/center}");
            screen.render();
            gameState.gameStarted = true;
        } else if (gameState.gameOver) {
            if (stationList[0][0].currentStatus !== 'off') {
                screenBoxes.waitingToArm1box.setContent("{center}Waiting for Station 1 to DISARM.{/center}");
                screen.append(screenBoxes.waitingToArm1box);
                screen.render();
            } else {
                screen.remove(screenBoxes.waitingToArm1box);
                screen.render();
            }
            if (stationList[1][0].currentStatus !== 'off') {
                screenBoxes.waitingToArm2box.setContent("{center}Waiting for Station 2 to DISARM.{/center}");
                screen.append(screenBoxes.waitingToArm2box);
                screen.render();
            } else {
                screen.remove(screenBoxes.waitingToArm2box);
                screen.render();
            }
            if (stationList[0][0].currentStatus === 'off' && stationList[1][0].currentStatus === 'off') {
                gameState.gameOver = false;
                gameState.timeElapsed = 0;
                gameState.maxTime = gameState.initialTIme;
                gameState.score = 0;
                gameState.waitingForInput = false;
                gameState.gameStarted = false;
                gameState.atGameIntro = true;
                screen.remove(screenBoxes.commandBox);
                screen.render();
            } else {
                screenBoxes.commandBox.setContent(`GAME OVER!\n
            \n\nYOUR SCORE: ${gameState.score}
            \n\nYou had ONE BUTTON (or switch . . . or knob . . .) to push, but you failed . . .
            \n\nPlease DISARM both Stations to try again.
            `);
                screen.render();
            }
        } else if ((gameState.maxTime * (1000 / loopTime)) - gameState.timeElapsed < 1) {
            screen.remove(screenBoxes.leftBottomBox);
            screen.remove(screenBoxes.rightBottomBox);
            screen.render();
            johnnyFiveObjects.digitalReadout1.print('0000');
            johnnyFiveObjects.digitalReadout2.print('0000');
            gameState.gameOver = true;
        } else if (gameState.waitingForInput) {
            let done = true;
            if (stationList[0][gameState.nextInstructionForSide1].hasBeenPressed && stationList[1][gameState.nextInstructionForSide2].hasBeenPressed) {
                let soundName = '328120__kianda__powerup';
                if (stationList[0][gameState.nextInstructionForSide1].type === "knob") {
                    if (getRange(stationList[0][gameState.nextInstructionForSide1].currentStatus) !== gameState.requiredKnobPosition1) {
                        done = false;
                    } else {
                        spawn("aplay", [`sounds/${soundName}.wav`]);
                    }
                }
                if (stationList[1][gameState.nextInstructionForSide2].type === "knob") {
                    if (getRange(stationList[1][gameState.nextInstructionForSide2].currentStatus) !== gameState.requiredKnobPosition2) {
                        done = false;
                    } else {
                        spawn("aplay", [`sounds/${soundName}.wav`]);
                    }
                }
            } else {
                done = false;
            }
            if (done) {
                gameState.score++;
                gameState.waitingForInput = false;
                gameState.timeElapsed = 0;
                if (gameState.maxTime > 2) {
                    gameState.maxTime--;
                }
            } else {
                gameState.timeElapsed++;
            }
            screen.append(screenBoxes.leftBottomBox);
            updateDigitalReadout();
            screenBoxes.leftBottomBox.setContent(`Time Left: ${(gameState.maxTime * (1000 / loopTime)) - gameState.timeElapsed}`);
            screen.append(screenBoxes.rightBottomBox);
            screenBoxes.rightBottomBox.setContent(`SCORE: ${gameState.score}`);
            screen.render();
        } else if (!gameState.waitingForInput && !gameState.gameOver) {
            // Clear all inputs
            for (let i = 0; i < stationList.length; i++) {
                stationList[i].forEach(button => {
                    button.hasBeenPressed = false;
                    button.correct = false;
                })
            }

            gameState.nextInstructionForSide1 = getRandomInt(1, stationList[0].length - 1);
            while (gameState.lastThreeInputs.indexOf(gameState.nextInstructionForSide1) !== -1) {
                gameState.nextInstructionForSide1 = getRandomInt(1, stationList[0].length - 1);
            }
            gameState.lastThreeInputs[0] = gameState.lastThreeInputs[1];
            gameState.lastThreeInputs[1] = gameState.nextInstructionForSide1;

            gameState.nextInstructionForSide2 = getRandomInt(1, stationList[1].length - 1);
            while (gameState.lastThreeInputs.indexOf(gameState.nextInstructionForSide2) !== -1) {
                gameState.nextInstructionForSide2 = getRandomInt(1, stationList[1].length - 1);
            }
            gameState.lastThreeInputs[2] = gameState.nextInstructionForSide2;

            let displayNameForStation1 = stationList[0][gameState.nextInstructionForSide1].label;
            stationList[0][gameState.nextInstructionForSide1].correct = true;
            let displayNameForStation2 = stationList[1][gameState.nextInstructionForSide2].label;
            stationList[1][gameState.nextInstructionForSide2].correct = true;

            for (let i = 0; i < 2; i++) {
                let nextInstruction = 'nextInstructionForSide1';
                let knobDirection = getRandVector();
                if (i === 1) {
                    nextInstruction = 'nextInstructionForSide2';
                }
                let displayName;
                if (stationList[i][gameState[nextInstruction]].type === "button") {
                    displayName = stationList[i][gameState[nextInstruction]].funName;
                } else if (stationList[i][gameState[nextInstruction]].type === "switch") {
                    if (stationList[i][gameState[nextInstruction]].currentStatus === 'on') {
                        displayName = `Turn ${stationList[i][gameState[nextInstruction]].funName} Off.`;
                    } else {
                        displayName = `Turn ${stationList[i][gameState[nextInstruction]].funName} ON.`;
                    }
                } else if (stationList[i][gameState[nextInstruction]].type === "knob") {
                    displayName = `Set ${stationList[i][gameState[nextInstruction]].funName} to ${stationList[i][gameState[nextInstruction]][knobDirection]}`;
                }
                if (i === 0) {
                    displayNameForStation1 = displayName;
                    gameState.requiredKnobPosition1 = knobDirection;
                } else {
                    displayNameForStation2 = displayName;
                    gameState.requiredKnobPosition2 = knobDirection;
                }
            }
            screenBoxes.commandBox.setContent(`\n${displayNameForStation1}\n
            \n
            and
            \n
            \n${displayNameForStation2}`);
            screen.render();
            gameState.waitingForInput = true;
        } else {
            screenBoxes.commandBox.setContent(`ERROR: Universe has crashed, please reboot it . . .`);
            screen.render();
        }

        // Are we at the intro or in the game?

        // Is the game over?

        // Are we waiting for input?

        // Is the input good?

        // Update score.

        // Update digits "timer" "clock"
    }
    setTimeout(primaryGameLoop, loopTime);
}

primaryGameLoop();
