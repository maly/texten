window.$ = window.jQuery = require("./node_modules/jquery/dist/jquery.min.js");
require("./node_modules/bootstrap/dist/js/bootstrap.min");
require("jquery-ui-dist/jquery-ui.js");
import "babel-polyfill";


//import "/css/hologram-webfont.ttf";

//v2 - complete rework of texten and game def

//const commandCompiler = require("./commandCompiler.js");

const parser = require("./js/parser.js");
window.parser = parser;

//const texten = require("./bones.js");
//const g = require("./demo.js");

const display = require("./js/display.js");

const keyboard = require("./js/keyboard.js");

const flex = require("./js/flexis.js");

const game = require("./js/game.js");
game.init();

var items = require("./game/items.js");
var rooms = require("./game/rooms.js");
//const items = require("./js/items.js");

const lang = require("./js/language.js");
window.lang = lang;
const verbs = require("./game/commands.js");
parser.setVerbs(verbs);

game.initItems(items);
game.initRooms(rooms);
//game.initCommands(verbs);
game.initStrings(require("./game/strings.js"));

game.display(t => {
    console.log(t);
    display.printTextMultiline(t);
});

console.log(game.get());

console.log(game.getItem("bota").hasAttr("crate"));
console.log(game.getItem("botnik").hasAttr("crate"));
console.log(game.getItem("nuz").carry());

console.log(game.cInventory());
console.log(game.roomEnter());

// Play returns a unique Sound ID that can be passed
// into any method on Howl to control that specific sound.
//var id1 = sound.play();
//var id2 = sound.play();

// Fade out the first sound and speed up the second.
//sound.fade(1, 0, 1000, id1);

//var t = new texten(g);
/*
var out = function(text) {
  //console.log(text);
  display.printText(text);
};

t.setPrint(out);
*/

/*
var doCommand = function(c) {
  console.log(c);
  var hey = t.parseAndDo(c);
  console.log("HEY", hey);
  if (!hey) return false;
  if (hey == "CHANGE ROOM") changeRoom();
  if (typeof hey == "object") {
    display.printTextRed(hey[0]);
  }

  keyboard.key(0);
  return false;
};
*/
//keyboard.init(doCommand);



var FSM = require("./js/FSM.js")

var timer = require("./js/timer.js")

var doCommand = async command => {
    if (command.params) {
        //fix params
        for (var i = 0; i < command.params.length; i++) {
            var par = command.params[i];
            if (par.length > 1) {
                //nejednoznačnost
                //nejednoznačný směr
                if (command.pattern[i] === "^") {
                    var il = par.map(q => {
                        return q.to;
                    });
                    display.printText("Máš na mysli " + lang.listToQuestion(il));
                    var ww = new Promise((r, j) => {
                        lineWaiter = r;
                    });
                    /*
                          lineWaiter = c => {
                            console.log("Waiter", c);
                          };
                          */
                    var q = await ww;
                    var dir = game.getExit(q);
                    console.log("Směr", dir);
                    if (dir.length != 1) {
                        display.printTextRed(
                            "Musíš být asi ještě přesnější, stále nerozumím."
                        );
                        return;
                    }
                    command.params[i] = dir;
                    continue;
                }
                //nejednoznačný předmět
                var il = par.map(i => {
                    var q = game.getItem(i.id);
                    return q.adjs[3] ? q.adjs[3] + " " + q.names[3] : q.names[3];
                });
                display.printText("Máš na mysli " + lang.listToQuestion(il));
                var ww = new Promise((r, j) => {
                    lineWaiter = r;
                });
                var q = await ww;
                var itm = game.getExactItem(q, par);
                if (itm.length != 1) {
                    display.printTextRed(
                        "Musíš být asi ještě přesnější, stále nerozumím."
                    );
                    return;
                }
                command.params[i] = itm;
            }
        }
    }

    console.log(
        "COMMAND",
        command.id,
        command.params /*.map(q => (q[0].id ? q[0].id : q[0].room)*/

    );
    var parnames = command.params.map(q => (q[0].id ? q[0].id : q[0].room));
    var syscmd = parser.getVerbById(command.id);
    if (syscmd._prerun) syscmd._prerun(parnames, game)
    if (syscmd._run) syscmd._run(parnames, game)
    if (syscmd._postrun) syscmd._postrun(parnames, game)
};

var tick = 0;
var gameTime = 0;
//var enterFlag = false;
var lineWaiter = null;
var enterWaiter = null;
var endless = () => {
    //command handling


    var cmd;
    cmd = keyboard.waitForLine();
    if (cmd !== null) {

        if (enterWaiter) {
            var q = enterWaiter;
            enterWaiter = null;
            q(cmd);
        } else if (cmd) {
            console.log("RES", cmd);
            if (lineWaiter) {
                var q = lineWaiter;
                lineWaiter = null;
                q(cmd);
            } else {
                var pc = parser.parse(cmd);
                console.log(pc);
                if (pc.length > 1) {
                    display.printTextRed("Nejsem si úplně jist, co mám udělat");
                } else if (pc.length < 1) {
                    display.printTextRed("To nechápu, promiň");
                } else {
                    //Máme command!
                    var command = pc[0];
                    doCommand(command);
                }
            }
        }
        keyboard.key(0);
    }


    //var kbd = keyboard.getInput();
    //console.log(kbd)

    //state machine handling

    FSM.states[FSM.state].test();

    //timer handling
    tick++;
    gameTime++;
    if (tick > 60) {
        tick = 0;
        //console.log("TICK");
    }
    timer.allTick()

    requestAnimationFrame(endless);
};

var onLoad = () => {
    display.init();
    FSM.newState("begin");
    //FSM.newState("titlescreen");
    FSM.newState("intro0");
    requestAnimationFrame(endless);
};

$(window).bind("load", function () {
    //changeRoom();
    keyboard.key(0);
});

//-----
$("body").bind("keydown", function (e) {
    //console.log("KD", e.keyCode);
    if (e.keyCode == 8) {
        e.preventDefault();
        keyboard.key(8);
        return e;
    } else if (e.keyCode == 38) {
        e.preventDefault();
        keyboard.key(7);
        return e;
    }

    return e;
});

$("body").bind("keypress", function (e) {
    e.preventDefault();
    keyboard.key(e.charCode);
    return false;
});

$(document).ready(onLoad);

window.setLineWaiter = (lw) => lineWaiter = lw
window.setEnterWaiter = (lw) => enterWaiter = lw