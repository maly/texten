var rooms = [
  {
    id: "r1",
    title: "Room1",
    desc: "Stojíš v místnosti.",
    ext:
      "Je to docela malá místnost, na zemi jsou dřevěné parkety, na zdech zašlé tapety, na stropě štuk.",
    exits: [
      {
        to: "do chodby",
        room: "r2"
      },
      {
        to: "na balkon",
        room: "r3",
        attrs: ["inactive"]
      }
    ],
    attrs: ["player", "start"],
    handlers: []
  },
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
