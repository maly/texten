
var commandCompiler = function(text) {


var aliases = {

	"exists": "E",
	"here": "H",
	"carry": "C",
	"item-in-room": "P",
	"attr-set": "AS",
	"attr-reset": "AR",

	"counter-is-zero": "CZ",
	"counter-is-equal": "CE",
	"counter-is-greater": "CG",
	"counter-is-less": "CL",
	"counter-is-running": "CR",

	"room-attribut": "RA",

	"flag": "F",

	"not-exists": "NE",
	"not-here": "NH",
	"not-carry": "NC",
	"not-item-in-room": "NP",

	"counter-is-not-zero": "NCZ",
	"counter-is-not-equal": "NCE",
	"counter-is-not-greater": "NCG",
	"counter-is-not-less": "NCL",
	"counter-is-not-running": "NCR",

	"not-room-attribut": "NRA",

	"not-flag": "NF",

//COMMANDS

	"exchange-items": "X",
	"drop-item": "D",
	"pick-item": "P",
	"insert-item-into": "I",
	"kill-item": "K",
	"invoke-item-in": "M",

	"use-item": "U",
	"use-item-on": "UON",

	"goto": "G",
	"exit": "E",

	"set-flag": "FS",
	"reset-flag": "FR",
	"invert-flag": "FX",

	"item-add-attr": "AA",
	"item-remove-attr": "AR",
	"item-set-attr": "AS",

	"counter-trigger": "CT",
	"counter-inc": "CI",
	"counter-dec": "CD",
	"counter-set-value": "CV",
	"counter-stop": "CX",
	"counter-run": "CR",
	"counter-add": "CA",
	"counter-sub": "CS",

	"exit-activate": "EA",
	"exit-deactivate": "EI",

	"item-handler": "IH",

	"print-inventory": "PI",
	"print-item-description": "PD",
	"print-room-description": "PR",
	"print-room-exits": "PX",
	"print-room-items": "PC",
	"print-crate-items": "PL",

	"print": ".",

	"break": "B"
};

var findAlias = function(cmd){
	for (var k in aliases) {
		if (k.toUpperCase() == cmd.toUpperCase()) 
			return aliases[k];
	}
	return cmd;
}

var singleSpace = function(text) {
	while(text.indexOf("  ")!= -1) {
		text = text.replace("  ", " ");
	}
	return text;
}

var stringsBack = function(text,strings) {
	for (var k in strings) {
		text = text.replace('{'+k+'}', strings[k].substr(1, strings[k].length-2));
	}		
	return text;
}

var cmdp = function(text){

	var strings = text.match(/".*?"/g);
	for (var k in strings) {
		text = text.replace(strings[k],'{'+k+'}');
	}	

	//console.log(text, strings);

	var cmds = text.split(";");

	var cmda = cmds.map(function(s){
		s = singleSpace(s.trim());
		var n = s.split(" ").map(function(t){return stringsBack(t,strings);});

		n[0] = findAlias(n[0]);
		return n;
	});
	return cmda;
}

// [".","Prohlížíš si $"],["PD","$"],["IH","$","examine"]

// .,Prohlížíš si $ # PD,$ # IH,$,examine

//console.log(JSON.stringify(cmdp('. "Prohlížíš si $" ; PD $;IH $ examine')));


var cond = function(text) {
	text = singleSpace(text.trim());
	if (text == "always") return [];
	var ands = text.split("or");
	var conds = ands.map(function (txt){
		var sg = txt.split("and").map(function(t){
			var atom = t.trim();
			var arr = atom.split(" ");
			arr[0] = findAlias(arr[0]);
			return arr;
		});

		return sg;
	})
	return conds;
}


//
//console.log(JSON.stringify(cond('C $ and AS $ nonmovable')));

//console.log(JSON.stringify(cond('C $ or AS $ nonmovable')));

//console.log(JSON.stringify(cond('always')));

var rule = function(text) {
	var term = text.split(":");
	if (term.length == 1) {term[1] = term[0];term[0]="always"}
	var c = cond(term[0]);
	var m = cmdp(term[1]);
	return [c,m];
}


// [[["NH","$"]]],[[".","V téhle místnosti nevidíš nic takového"],["B"]]

//console.log(JSON.stringify(rule('NH $: . "V téhle místnosti nevidíš nic takového";B')));

//console.log(JSON.stringify(rule('always: . "Botník hoří";CT bothor')));

//console.log(JSON.stringify(rule('. "Máš u sebe ";PI')));

var lines = text.split("###");
var out = lines.map(function(f){return rule(f);});
return out;

}