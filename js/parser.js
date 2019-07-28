var verbs = null;

const noDia = require("./diacritic.js");
const game = require("./game.js");

var verblist = () => verbs.map(q => q._cmd).flat();

var isSpecial = s => "^%$#@({".indexOf(s[0]) >= 0;

var matchPattern = (pattern, set) => {
  var patFix = noDia(pattern)
    .split(/\s+/)
    .filter(q => q.length > 0);
  var p = patFix
    .map(q => (isSpecial(q) ? "(.*?)" : q.substr(0, 3) + "\\S*?"))
    .join(" ");
  p = "^" + p + "$";
  var patt = new RegExp(p);
  //match set
  //console.log(p, set);
  var out = set.match(patt);
  if (!out) return null;
  out.unshift(patFix.filter(q => isSpecial(q)));
  out.unshift(pattern);
  return out;
};

var findVerb = v => verbs.filter(q => q._cmd.indexOf(v) >= 0);

/*
^ - exit
% - item here, not nonmovable
@ - item here
$ - item carry
# - here or carry
*/

var special = s => {
  if (s[0] === "^") return ["exit"];
  if (s[0] === "%")
    return ["item", s.length === 1 ? 3 : s[1], { here: true, movable: true }];
  if (s[0] === "@") return ["item", s.length === 1 ? 3 : s[1], { here: true }];
  if (s[0] === "$")
    return ["item", s.length === 1 ? 3 : s[1], { player: true }];
  if (s[0] === "#") return ["item", s.length === 1 ? 3 : s[1], { near: true }];
};

const parse = text => {
  var s = text.split(/\s+/).filter(q => q.length > 0);
  var v = verblist();
  var setfix = s.map(noDia).join(" ");
  var m = v
    .map(q => matchPattern(q, setfix))
    .filter(q => q !== null)
    .map(q => {
      var verbN = findVerb(q.shift());
      if (!verbN) return null;
      verbN = verbN[0];
      var verb = { id: verbN.id };
      verb.pattern = q.shift();
      q.shift();
      verb.params = q;
      return verb;
    })
    .map(q => {
      //      console.log(q.id, q.params, q.pattern);
      for (var i = 0; i < q.pattern.length; i++) {
        var test = special(q.pattern[i]);
        var what = test.shift();
        console.log("what,test", what, test);
        switch (what) {
          case "item":
            q.params[i] = game.getFilteredItemsBy(
              q.params[i],
              parseInt(test[0]),
              test[1]
            );
            break;
          case "exit":
            q.params[i] = game.getExit(q.params[i]);
            break;
        }
      }
      console.log("QMAP", q);
      return q;
      //console.log(game.getFilteredItemsBy(q.params[0], 3, { player: true }));
    })
    .filter(q => {
      return (
        q.params.map(q => q.length).reduce((p, c) => p + c, 0) >=
        q.params.length
      );
    });

  console.log("Parsed:", m);
  return m;
};

module.exports = {
  parse,
  setVerbs(vs) {
    verbs = vs;
  }
};
