
var commandCompiler = function(text) {

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
		//console.log(n);
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
			//console.log(atom);
			return atom.split(" ");
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