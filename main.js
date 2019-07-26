window.$ = window.jQuery = require("./node_modules/jquery/dist/jquery.min.js");
require("./node_modules/bootstrap/dist/js/bootstrap.min");
require("jquery-ui-dist/jquery-ui.js");

//v2 - complete rework of texten and game def


const commandCompiler = require("./commandCompiler.js");

const texten = require("./bones.js");
const g = require("./demo.js");

const display = require("./display.js")

const keyboard = require("./keyboard.js");


var t = new texten(g);

var out = function (text) {
    //console.log(text);
    display.printText(text);
}

t.setPrint(out);

var changeRoom = function () {
    //$("#display").html("");
    t.simpleRoom();
}

var doCommand = function (c) {
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
}

keyboard.init(doCommand);

$(window).bind("load", function () {

    changeRoom();
    keyboard.key(0);

});

//-----
$("body").bind("keydown",
    function (e) {
        if (e.keyCode == 8) {
            e.preventDefault();
            keyboard.key(8);
            return e;
        }
        return e;
    }
);

$("body").bind("keypress",
    function (e) {
        e.preventDefault();
        keyboard.key(e.charCode);
        return false;
    }
);