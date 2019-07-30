const display = require("./display.js");
const nomusic = true;

var timer = require("./timer.js")

const keyboard = require("./keyboard.js");
const game = require("./game.js");

var introTimer;

var FSM = {
    state: "begin",
    newState(ns) {
        FSM.state = ns;
        FSM.states[FSM.state].start();
    },
    states: {
        begin: {
            //state 0
            start() {
                if (!nomusic) $("#music1")[0].play();
                $("#music1")[0].volume = 0.4;
                $("#music2")[0].pause();
                $("#video1")[0].play();
                $("#video2")[0].pause();
                $("#video1").show();
                $("#video2").hide();
                $("#maingame").hide();
                introTimer = new timer.timer("intro", 300);
            },
            test() {
                if (introTimer.state() === 0) {
                    introTimer.remove();
                    FSM.newState("titlescreen");
                }
            }
        },
        titlescreen: {
            start() {
                $("#introscreen").show();
            },
            test() {
                if (keyboard.wasEnterPressed()) {
                    FSM.newState("intro0");
                }
            }
        },
        intro0: {
            done: false,
            async start() {
                //console.log(this)
                $("#introscreen").hide();
                $("#maingame").show();
                keyboard.doOutput(true);
                var intro0 = require("../game/introText.js")
                var n = await display.printTextMultiline(intro0, true)
                //console.log("DONEPRINT")
                this.done = true
                keyboard.wasEnterPressed()
            },
            test() {
                if (this.done) {
                    display.cls();
                    FSM.newState("game0");
                }
            }
        },
        game0: {
            start() {
                $("#introscreen").hide();
                $("#maingame").show();
                if (!nomusic) $("#music2")[0].play();
                $("#music2")[0].volume = 0.4
                $("#music1")[0].pause();
                $("#music2").show();
                $("#music1").hide();
                $("#video2").show();
                $("#video1").hide();
                $("#video2")[0].play();
                $("#video1")[0].pause();
                keyboard.doOutput(true);
                game.cEnter();
                keyboard.key(0);
            },
            test() {}
        }
    }
};

module.exports = FSM