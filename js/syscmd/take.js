var display = require("../display.js");
var lang = require("../language.js");

module.exports = async (game, pars, cmd) => {
  var itm = game.getItem(pars[0]);
  console.log("Take", itm, pars);
  if (!itm.isMovable()) {
    if (cmd._nonmovable) {
      game.err(lang.formatItem(cmd._nonmovable, itm));
      return;
    }
  }
  display.printTextYellow("Vzal jsi " + game.itemFullName(itm)[3] + ".");
  game.takeItem(itm.id);
};
