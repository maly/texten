window.$ = window.jQuery = require("./node_modules/jquery/dist/jquery.min.js");
require("./node_modules/bootstrap/dist/js/bootstrap.min");
require("jquery-ui-dist/jquery-ui.js");
import "babel-polyfill";

//v2 - complete rework of texten and game def

const commandCompiler = require("./commandCompiler.js");

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
game.cEnter();

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

keyboard.init(doCommand);

var cmd;
cmd = keyboard.waitForLine();

cmd.then(q => {
  console.log("RES", q);
});

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
