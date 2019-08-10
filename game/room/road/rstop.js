module.exports = {
  id: "road_rstop",
  desc: " ",
  ext: " ",
  attrs: [],
  exits: [],
  async _enter(g) {
    await g.waitForEnter();
    console.log("onEnter", g);
    await g.dispML(require("./stopText.js"));

    g.cEnter("r1");
    //g.startStepTick("roadr1", () => g.cEnter("r1"), 3);
    //g.startStepCounter(()=>{g.cEnter("road_rstop")})
  },
  handlers: []
};
