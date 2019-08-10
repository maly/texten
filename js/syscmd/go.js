var display = require("../display.js");

module.exports = async (game, pars) => {
  console.log("GO", pars);
  var exit = game.getExitById(pars[0]);
  //game.where = pars[0];
  //console.log(exit);
  game.cls();
  display.printTextYellow("Jdeš " + exit.to);
  await game.cEnter(pars[0]);
};
