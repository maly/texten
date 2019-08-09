var item = {
  id: "auto",
  name: "aut-o,a,u,o,ě",
  adj: "svoje-,,,,",
  desc:
    "Dodge Grand Caravan. Takové slušné SUV, sedm míst, hodně prostoru pro spoustu krámů...",
  attrs: ["nonmovable", "crate"],
  where: "road_r1",

  strings: {
    ctake: "Do kapsy se ti nevejde, za sebou ho nepotáhneš... To fakt nepůjde."
  },
  actions: {
    csitinto(itm, game /*, syscmd*/) {
      game.doDisp("Sedl sis do auta.");
      game.cEnter("road_auto");
    }
  }
};

module.exports = item;
