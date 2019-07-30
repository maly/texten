var rooms = [
  require("./room/road/r1.js"),
  require("./room/road/r2.js"),
  require("./room/r1.js"),
  {
    id: "r2",
    title: "Room2",
    desc: "Stojíš v chodbě",
    exits: [
      {
        to: "do pokoje",
        room: "r1"
      }
    ],
    attrs: [],
    handlers: []
  },
  {
    id: "r3",
    title: "Room3",
    desc:
      "Stojíš na malém balkonu nad rušnou ulicí. Zábradlí vypadá docela zpuchřelé, tak bych se, být tebou, neopíral...",
    exits: [
      {
        to: "do pokoje",
        room: "r1"
      }
    ],
    attrs: [],
    handlers: []
  }
];

module.exports = rooms;
