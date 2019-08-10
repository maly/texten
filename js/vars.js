var vars = {};

var setVar = (n, v) => {
  vars[n] = v;
};

var getVar = n => (vars[n] ? vars[n] : 0);

var plusVar = n => setVar(n, getVar(n) + 1);

module.exports = { setVar, getVar, plusVar };
