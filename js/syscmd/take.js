var display = require("../display.js");

module.exports = async (game, pars) => {
  var itm = game.getItem(pars[0]);
  console.log("Take", itm, pars);
  display.printTextYellow("Vzal jsi " + game.itemFullName(itm)[3] + ".");
  game.takeItem(itm.id);
};
