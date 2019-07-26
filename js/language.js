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

module.exports = { listToText };
