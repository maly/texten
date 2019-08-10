var display = require("../display.js");
const lang = require("../language.js");

var sysExamine = (game, pars) => {
  var itm = game.getItem(pars[0]);
  console.log(itm, pars);
  display.printTextYellow("Zkoumáš " + game.itemFullName(itm)[3] + ".");
  game.doDisp(itm.desc);
  if (itm.isCrate()) {
    var inside = game.crateListItems(itm.id);
    if (inside && inside.length) {
      game.doDisp(
        "[R[Objevil jsi][Našel jsi][Uvnitř vidíš][Uvnitř jsi našel]] " +
          lang.listToText(inside.map(q => game.itemFullName(q)[3]))
      );
    }
    //deshadow
    inside.map(q => q.removeAttr("shadow"));
  }
};

module.exports = sysExamine;
