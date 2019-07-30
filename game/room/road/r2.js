module.exports = {
  id: "road_r2",
  title: "Room1",
  desc: "Stojíš u silnice kdesi v zapomenuté oblasti.",
  ext: "NUDA",
  atmosphere: require("./atmo.js"),
  exits: [
    {
      to: "zpátky k autu",
      room: "road_r1"
    },
    {
      to: "dál po silnici",
      room: "road_r3"
    }
  ],
  attrs: [],
  handlers: []
};
