var display = require("../display.js");

module.exports = async (game, pars) => {
  //console.log("I", pars);
  var inv = game.cInventory();
  //console.log(inv);
  display.printTextYellow(inv);
};
