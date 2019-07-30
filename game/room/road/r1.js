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
  ext: "Je pech píchnout v takové slotě, co?",
  atmosphere: ATLIST,
  exits: [{
    to: "po krajnici furt dopředu",
    room: "road_r2"
  }],
  attrs: ["start"],
  handlers: []
};