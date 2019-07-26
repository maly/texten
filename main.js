window.$ = window.jQuery = require("./node_modules/jquery/dist/jquery.min.js");
require("./node_modules/bootstrap/dist/js/bootstrap.min");
require("jquery-ui-dist/jquery-ui.js");

const commandCompiler = require("./commandCompiler.js");

const texten = require("./bones.js");
const g = require("./demo.js");

const display = require("./display.js")




var t = new texten(g);

var out = function(text){
	//console.log(text);
	display.printText(text);
}

t.setPrint(out);

var changeRoom = function() {
	//$("#display").html("");
	t.simpleRoom();
}

var doCommand = function(c) {
	console.log(c);
	var hey = t.parseAndDo(c);
	console.log("HEY",hey);
	if (!hey) return false;
	if (hey == "CHANGE ROOM") changeRoom();
	if (typeof hey == "object") {
		display.printTextRed(hey[0]);
	}

	key(0);
	return false;
}

$(window).bind("load", function(){

	changeRoom();
	key(0);
	
});

/////editor

var eline = "> ";
var key = function(k) {
	if (k==13) {
		display.printLine(eline+" ");
		doCommand(eline.substr(2).trim());
		eline = "> ";
		return;
	}
	else if (k==8) {
		if (eline.length>2) {
			eline=eline.substr(0,eline.length-1);
			display.printSameLine(eline+"_ ");
		}
	} else if (!k) {
		eline = "> ";
		display.printSameLine(eline+"_ ");
	} else {eline += String.fromCharCode(k);}

	display.printSameLine(eline+"_");
}

//-----
$("body").bind("keydown",
	function (e){
		if (e.keyCode==8) {
			e.preventDefault();
			key(8);
			return e;}
		return e;
	}
);

$("body").bind("keypress",
	function (e){
		e.preventDefault();
		key(e.charCode);
		return false;
	}
);
