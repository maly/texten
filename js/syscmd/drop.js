var display = require("../display.js");

module.exports = async (game, pars) => {
  var itm = game.getItem(pars[0]);
  console.log("DROP", itm, pars);
  display.printTextYellow("Položil jsi " + game.itemFullName(itm)[3] + ".");
  game.dropItem(itm.id);
};
