module.exports = {
  id: "road_rstop",
  desc: " ",
  ext: " ",
  attrs: [],
  exits: [],
  async _beforeEnter(g) {
    g.cls();
  },
  async _enter(g) {
    //await g.waitForEnter();
    //console.log("onEnter", g);
    await g.dispML(require("./stopText.js"));
    g.condMoveItem("rezerva", "*", "botnik"); //pokud máš u sebe rezervu, hodíš ji na korbu
    g.condMoveItem("hever", "*", "botnik");
    g.cls();
    g.cEnter("road_van");
    //g.startStepTick("roadr1", () => g.cEnter("r1"), 3);
    //g.startStepCounter(()=>{g.cEnter("road_rstop")})
  },
  handlers: []
};
