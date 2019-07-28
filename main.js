window.$ = window.jQuery = require("./node_modules/jquery/dist/jquery.min.js");
require("./node_modules/bootstrap/dist/js/bootstrap.min");
require("jquery-ui-dist/jquery-ui.js");
import "babel-polyfill";

const nomusic = true;
//import "/css/hologram-webfont.ttf";

//v2 - complete rework of texten and game def

const commandCompiler = require("./commandCompiler.js");

const parser = require("./js/parser.js");
window.parser = parser;

const texten = require("./bones.js");
const g = require("./demo.js");

const display = require("./js/display.js");

const keyboard = require("./js/keyboard.js");

const flex = require("./js/flexis.js");

flex("bot-a,y,ě,u");
flex("botník-,u,u");
flex("louč-,e,i");

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

var t = new texten(g);
/*
var out = function(text) {
  //console.log(text);
  display.printText(text);
};

t.setPrint(out);
*/
var changeRoom = function() {
  //$("#display").html("");
  t.simpleRoom();
};

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

var _timers = {};
var _timerId = 0;
var timer = function(id, ticks) {
  this.remain = ticks;
  this.id = id; //_timerId++;
  _timers[this.id] = {
    tick: () => {
      if (this.remain) this.remain--;
    },
    state: () => {
      return this.remain;
    }
  };
};

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
        $("#music1")[0].volume = 0.2;
        $("#music2")[0].pause();
        $("#video1")[0].play();
        $("#video2")[0].pause();
        $("#video1").show();
        $("#video2").hide();
        $("#maingame").hide();
        new timer("intro", 300);
      },
      test() {
        if (_timers.intro.state() === 0) {
          delete _timers.intro;
          FSM.newState("titlescreen");
        }
      }
    },
    titlescreen: {
      start() {
        $("#introscreen").show();
      },
      test() {
        if (wasEnterPressed()) {
          FSM.newState("game0");
        }
      }
    },
    game0: {
      start() {
        $("#introscreen").hide();
        $("#maingame").show();
        if (!nomusic) $("#music2")[0].play();
        $("#music2")[0].volume = 0.2;
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

var wasEnterPressed = () => {
  if (enterFlag) {
    enterFlag = false;
    return true;
  }
  return false;
};

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
    command.params.map(q => (q[0].id ? q[0].id : q[0].room))
  );
};

var tick = 0;
var gameTime = 0;
var enterFlag = false;
var lineWaiter = null;
var endless = () => {
  //command handling

  var cmd;
  cmd = keyboard.waitForLine();
  if (cmd !== null) {
    enterFlag = true;
    if (cmd) {
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

  //state machine handling

  FSM.states[FSM.state].test();

  //timer handling
  tick++;
  gameTime++;
  if (tick > 60) {
    tick = 0;
    //console.log("TICK");
  }
  for (var timer in _timers) {
    _timers[timer].tick();
  }
  /*
  for (var timer of _timers) {
    timer.tick();
  }
  */
  requestAnimationFrame(endless);
};

var onLoad = () => {
  display.init();
  //FSM.newState("begin");
  FSM.newState("game0");
  requestAnimationFrame(endless);
};

$(window).bind("load", function() {
  //changeRoom();
  keyboard.key(0);
});

//-----
$("body").bind("keydown", function(e) {
  if (e.keyCode == 8) {
    e.preventDefault();
    keyboard.key(8);
    return e;
  }
  return e;
});

$("body").bind("keypress", function(e) {
  e.preventDefault();
  keyboard.key(e.charCode);
  return false;
});

$(document).ready(onLoad);
