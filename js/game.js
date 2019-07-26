//game state

const flex = require("./flexis.js");
const lang = require("./language.js");

var game = {};
var items;
var rooms;
var disp;
var strings;

//init

var init = g => {
  //inicializace hry
  game.items = {};
  game.rooms = {};
  game.where = "";
};

var initItems = s => {
  var locations = s.reduce((prev, curr) => {
    prev[curr.id] = curr.where;
    return prev;
  }, {});
  game.items = locations;
  items = s.map(q => {
    q.names = flex(q.name);
    q.adjs = q.adj ? flex(q.adj) : ["", "", "", ""];
    q.hasAttr = a => (q.attrs.indexOf(a) < 0 ? false : true);
    q.isHere = () => game.items[q.id] === game.where;
    q.carry = () => game.items[q.id] === "*";
    return q;
  });
};

var initRooms = s => {
  rooms = s.map(q => {
    q.hasAttr = a => (q.attrs.indexOf(a) < 0 ? false : true);
    return q;
  });
  var startRoom = rooms.filter(q => q.hasAttr("start"));
  if (startRoom.length == 1) game.where = startRoom[0].id;
  game.rooms = s.reduce((prev, curr) => {
    prev[curr.id] = { looked: false };
    return prev;
  }, {});
};

var get = () => game;

var getItem = id => {
  var i = items.filter(q => q.id === id);
  if (i.length !== 1) return null;
  i = i[0];
  i.where = game.items[id];
  return i;
};

var playerListItems = () => {
  var l = items.filter(q => game.items[q.id] === "*");
  return l;
};

var roomListItems = () => {
  var l = items.filter(q => game.items[q.id] === game.where);
  return l;
};

var getRoom = id => {
  var i = rooms.filter(q => q.id === id);
  if (i.length !== 1) return null;
  i = i[0];
  return i;
};

var exitList = () => {
  var room = getRoom(game.where);
  if (!room) return null;
  return room.exits;
};

var itemFullName = item => {
  console.log(item);
  return [
    (item.adjs[0] ? item.adjs[0] + " " : "") + item.names[0],
    (item.adjs[1] ? item.adjs[1] + " " : "") + item.names[1],
    (item.adjs[2] ? item.adjs[2] + " " : "") + item.names[2],
    (item.adjs[3] ? item.adjs[3] + " " : "") + item.names[3]
  ];
};

var cInventory = () => {
  var l = playerListItems();
  if (l.length === 0) return strings.NOCARRY;
  return strings.HAVE + lang.listToText(l.map(q => itemFullName(q)[3]));
};

var cSee = () => {
  var l = roomListItems();
  if (l.length === 0) return "";
  return strings.SEE + lang.listToText(l.map(q => itemFullName(q)[3]));
};

var cExits = () => {
  var l = exitList();
  if (l.length === 0) return strings.NOGO;
  return strings.CANGO + lang.listToText(l.map(q => q.to));
};

var cLook = onlyFirst => {
  var room = getRoom(game.where);
  if (!room) return "";
  if (onlyFirst && game.rooms[game.where].looked) return "";
  game.rooms[game.where].looked = true;
  if (!room.ext) return "";
  return room.ext;
};
var cOverlook = () => {
  var room = getRoom(game.where);
  if (!room) return "";
  return room.desc;
};

var roomEnter = () => {
  var out = "";
  out += cOverlook();
  var q = cLook();
  if (q) {
    out += " " + q;
  }
  out += "\n" + cExits();
  q = cSee();
  if (q) {
    out += "\n" + q;
  }
  return out;
};

var cEnter = () => {
  disp(roomEnter());
};

module.exports = {
  init,
  initItems,
  initRooms,
  display: f => {
    disp = f;
  },
  initStrings: f => {
    strings = f;
  },
  get,
  getItem,
  playerListItems,
  cInventory,
  cSee,
  cExits,
  cLook,
  cOverlook,
  roomEnter,
  cEnter
};
