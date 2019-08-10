module.exports = {
  id: "road_r3",
  title: "Room1",
  desc: "Jdeš po silnici kdesi v zapomenuté oblasti.",
  ext: "Nekonečná, nudná, ničím zvláštní silnice",
  atmosphere: require("./atmo.js"),
  exits: [
    {
      to: "zpátky k autu",
      room: "road_r2"
    },
    {
      to: "dál po silnici",
      room: "road_r3"
    }
  ],
  attrs: [],
  handlers: []
};
