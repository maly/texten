var display = require("../display.js");
const lang = require("../language.js");

var sysExamine = (game, pars) => {
  var itm = game.getItem(pars[0]);
  console.log(itm, pars);
  display.printTextYellow("Zkoumáš " + game.itemFullName(itm)[3] + ".");
  game.doDisp(itm.desc);
  if (itm.isCrate()) {
    var inside = game.crateListItems(itm.id);
    game.doDisp(
      "Uvnitř je " + lang.listToText(inside.map(q => game.itemFullName(q)[0]))
    );
    //deshadow
    inside.map(q => q.removeAttr("shadow"));
  }
};

module.exports = sysExamine;
