//

//list items to natural language
var listToText = s => {
  //var s = l.map(q => q.names[3]);
  var out = "";
  for (var i = 0; i < s.length; i++) {
    out += s[i];
    if (i === s.length - 1) out += ".";
    else if (i === s.length - 2) out += " a ";
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

var oneShuffle = array => array.sort(() => Math.random() - 0.5);
var shuffle = array => {
  for (i = 0; i < 5000; i++) {
    array = oneShuffle(array);
    return array;
  }
};

var density = d => Math.random() < 1 / d;

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

var fixString = s => {
  if (typeof s === "string") return s;
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

module.exports = { listToText, listToQuestion, fixString };
