var ATLIST = {
  type: "shuffle",
  strings: [
    "Prší.",
    "Už dlouho kolem nic nejelo.",
    "Široko daleko ani živáčka."
  ],
  density: 2
};

module.exports = {
  id: "road_r1",
  title: "Room1",
  desc: "Stojíš na kraji silnice vedle svého auta.",
  ext: "Je pech píchnout na takovém místě, co? Široko daleko nikde nic, jen silnice, vlevo pole, vpravo pole, v dálce je vidět nějaké silo, za polem to vypadá na nějakou krajinu rybníků, ale tam ti asi těžko někdo pomůže... Jediná civilizace bude někde vepředu.",
  atmosphere: ATLIST,
  exits: [{
    to: "po krajnici furt dopředu",
    room: "road_r2"
  }],
  attrs: ["start"],
  handlers: []
};