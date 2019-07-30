var ATLIST = {
  type: "shuffle",
  strings: [
    "Někde v dálce štěká pes. Je tu někde nějaký?",
    "Šustí listí.",
    "Jako bys cítil puch skládky.",
    "Něco tu slabě bzučí. Asi elektrické vedení."
  ],
  density: 3
};

module.exports = {
  id: "r1",
  title: "Room1",
  desc: "Stojíš v místnosti.",
  ext:
    "Je to docela malá místnost, na zemi jsou dřevěné parkety, na zdech zašlé tapety, na stropě štuk.",
  atmosphere: ATLIST,
  exits: [
    {
      to: "do chodby",
      room: "r2"
    },
    {
      to: "do prdele",
      room: "rx"
    },
    {
      to: "na balkon",
      room: "r3",
      attrs: ["inactive"]
    }
  ],
  _enter(g) {
    g.musicPlay("music2");
    g.videoPlay("video2");
  },
  attrs: ["player"],
  handlers: []
};
