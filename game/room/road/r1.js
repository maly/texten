module.exports = {
  id: "road_r1",
  title: "Room1",
  desc: "Stojíš na kraji silnice vedle svého auta.",
  ext:
    "Je pech píchnout na takovém místě, co? Široko daleko nikde nic, jen silnice, vlevo pole, vpravo pole, v dálce je vidět nějaké silo, za polem to vypadá na nějakou krajinu rybníků, ale tam ti asi těžko někdo pomůže... Jediná civilizace bude někde před tebou.",
  atmosphere: require("./atmo.js"),
  exits: [
    {
      to: "po krajnici dopředu",
      room: "road_r2"
    },
    {
      to: "do auta",
      room: "road_auto"
    }
  ],
  attrs: ["start"],
  _enter(g) {
    console.log("onEnter", g);
    g.startStepTickToGo("roadr1", "road_rstop", 7);
    //g.startStepCounter(()=>{g.cEnter("road_rstop")})
  },
  handlers: []
};
