//
const md5 = require("md5");
//list items to natural language
var listToText = (s, d) => {
  if (!d) d = " a ";
  //var s = l.map(q => q.names[3]);
  var out = "";
  for (var i = 0; i < s.length; i++) {
    out += s[i];
    if (i === s.length - 1) out += ".";
    else if (i === s.length - 2) out += d;
    else out += ", ";
  }
  return out;
};

var listToQuestion = s => {
  //var s = l.map(q => q.names[3]);
  var out = "";
  for (var i = 0; i < s.length; i++) {
    out += s[i];
    if (i === s.length - 1) out += "?";
    else if (i === s.length - 2) out += ", nebo ";
    else out += ", ";
  }
  return out;
};

//string fixes
var savedStrings = {};

var oneShuffle = array => array.sort(() => Math.random() - 0.5);
var shuffle = array => {
  for (var i = 0; i < 5000; i++) {
    array = oneShuffle(array);
    return array;
  }
};

var lShuffle = s => {
  //zamichat a pak furt dokola
  if (typeof s.index === "undefined") {
    s.index = 0;
    s.strings = shuffle(s.strings);
  }
  var out = s.strings[s.index];
  s.index++;
  if (s.index >= s.strings.length) s.index = 0;
  return out;
};
var lLoop = s => {
  //zamichat a pak furt dokola
  if (typeof s.index === "undefined") {
    s.index = 0;
  }
  var out = s.strings[s.index];
  s.index++;
  if (s.index >= s.strings.length) s.index = 0;
  return out;
};

var lShot = s => {
  //1, 2, 3, ... 9, "", ""
  if (typeof s.index === "undefined") {
    s.index = 0;
  }
  if (s.index >= s.strings.length) return "";
  var out = s.strings[s.index];
  s.index++;
  return out;
};

var lLast = s => {
  //1, 2, 3, ... 9, 9, 9
  if (typeof s.index === "undefined") {
    s.index = 0;
  }
  if (s.index >= s.strings.length) s.index--;
  var out = s.strings[s.index];
  s.index++;
  return out;
};

var lRand = s => {
  var idx = Math.floor(Math.random() * s.strings.length);

  return s.strings[idx];
};

var prepareSaved = sx => {
  var type = "";
  switch (sx[1].toUpperCase()) {
    case "S":
      type = "shuffle";
      break;
    case "O":
      type = "oneshoot";
      break;
    case "L":
      type = "loop";
      break;
    case "R":
      type = "rand";
      break;
    case "T":
      type = "last";
      break;
  }
  if (!type) return sx;
  var strings = sx
    .substr(2)
    .match(/\[.*?\]/g)
    .map(q => q.substr(1, q.length - 2));
  //console.log(sx, strings);
  return { type, strings };
};

/*
typy obsahu:

prostý string
seznam (objekt s typem a řetězci a denzitou)
string s nahrazením.

[S[x1][x2][x3]...] - S je fyp (S,O,L,R,T), pak jsou řetězce
*/

var fixString = s => {
  if (typeof s === "string") {
    //zpracování řetězců
    var mulfix = s.match(/\[(.\[.*?\])\]/g);
    if (!mulfix || !mulfix.length) return s; //just a simple string
    for (var t of mulfix) {
      var sign = md5(t);
      if (!savedStrings[sign]) {
        /// prepare
        savedStrings[sign] = prepareSaved(t);
      }
      var out = fixString(savedStrings[sign]);
      //console.log(savedStrings[sign]);
      s = s.replace(t, out);
    }
    return s; //po všech replacementech
  }
  //object. Asi list

  //probabilita
  if (!s.density) s.density = 1;
  if (Math.random() > 1 / s.density) return "";

  //je inicializovaný?
  switch (s.type) {
    case "shuffle":
      return lShuffle(s);
    case "oneshot":
      return lShot(s);
    case "loop":
      return lLoop(s);
    case "rand":
      return lRand(s);
    case "last":
      return lLast(s);
  }
};

//formátovat řetězec s palceholderem pro předmět

/*
#0, #1, #2 ... item name podle pádu
^0, ^1 ... dtto, ale s prvním písmenem velkým
*/

var formatItem = (s, itm) => {
  var replaces = s.match(/\#[0-9]/g);
  if (replaces)
    for (var t of replaces) {
      var flex = parseInt(t[1]);
      s = s.replace(t, itm.fullName(flex));
    }

  replaces = s.match(/\^[0-9]/g); //capitalize
  if (replaces)
    for (var t of replaces) {
      var flex = parseInt(t[1]);
      var fn = itm.fullName(flex);
      fn = fn[0].toUpperCase() + fn.substr(1);
      s = s.replace(t, fn);
    }
  return s;
};

module.exports = { listToText, listToQuestion, fixString, formatItem };
