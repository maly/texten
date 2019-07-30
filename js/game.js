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
    q.adjs = q.adj ? flex(q.adj) : ["", "", "", "", "", ""];
    q.hasAttr = a => (q.attrs.indexOf(a) < 0 ? false : true);
    q.isHere = () => game.items[q.id] === game.where;
    q.isCrate = () => (q.attrs.indexOf("crate") < 0 ? false : true);
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
    prev[curr.id] = {
      looked: false
    };
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

const noDia = require("./diacritic.js");

var getItemsBy = (name, flex) => {
  var pname = name.split(/\s+/);
  //console.log(pname);
  var names = items
    .map(q => {
      return {
        name: q.names.map(noDia)[flex],
        adj: q.adjs.map(noDia)[flex],
        id: q.id
      };
    })
    .filter(q => {
      if (pname.length === 1)
        if (q.name.indexOf(pname[0]) === 0) return true;
      if (pname.length === 2)
        if (q.adj.indexOf(pname[0]) === 0 && q.name.indexOf(pname[1]) === 0)
          return true;
      return false;
    });
  //console.log(names);
  return names;
};

var getExactItem = (name, is) => {
  var pname = name.split(/\s+/);
  var i = is.filter(q => {
    if (pname.length === 1)
      if (!q.adj && q.name.indexOf(pname[0]) === 0) return true;
    if (q.adj.indexOf(pname[0]) === 0) return true;
    if (pname.length === 2)
      if (q.adj.indexOf(pname[0]) === 0 && q.name.indexOf(pname[1]) === 0)
        return true;
    return false;
  });
  return i;
};

var filterItemsBy = (is, flt) => {
  var out = is.filter(q => {
    var id = q.id;
    if (flt.player) {
      if (game.items[id] !== "*") return false;
    }
    if (flt.here) {
      if (game.items[id] !== game.where) return false;
    }
    if (flt.near) {
      if (game.items[id] !== game.where && game.items[id] !== "*") return false;
    }

    if (flt.cratedHere) {
      var cratesHere = items.filter(q => ((game.items[q.id] === "*") || (game.items[q.id] === game.where)) && q.isCrate())
        .map(q => q.id);
      if (!cratesHere || cratesHere.length === 0) return false
      //console.log("CRATED HERE", q, cratesHere)
      if (cratesHere.indexOf(game.items[id]) < 0) return false;
      //if (game.items[id] !== game.where && game.items[id] !== "*") return false;
    }


    if (flt.movable) {
      if (getItem(id).attrs.indexOf("nonmovable") >= 0) return false;
    }

    if (flt.hasAttr) {
      if (getItem(id).attrs.indexOf(flt.hasAttr) < 0) return false;
    }
    if (flt.hasNotAttr) {
      if (getItem(id).attrs.indexOf(flt.hasNotAttr) >= 0) return false;
    }
    return true;
  });
  return out;
};

var getFilteredItemsBy = (name, flex, flt) =>
  filterItemsBy(getItemsBy(name, flex), flt);

var playerListItems = () => {
  var l = items.filter(q => game.items[q.id] === "*");
  return l;
};

var roomListItems = () => {
  var l = items.filter(q => game.items[q.id] === game.where);
  return l;
};

var crateListItems = (crate) => {
  var l = items.filter(q => game.items[q.id] === crate);
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

var getExit = e => {
  var exit = noDia(e);
  var xl = exitList().filter(q => {
    return noDia(q.to).indexOf(exit) >= 0;
  });
  console.log("XL", xl, e);
  return xl;
};

var itemFullName = item => {
  //console.log(item);
  return [
    (item.adjs[0] ? item.adjs[0] + " " : "") + item.names[0],
    (item.adjs[1] ? item.adjs[1] + " " : "") + item.names[1],
    (item.adjs[2] ? item.adjs[2] + " " : "") + item.names[2],
    (item.adjs[3] ? item.adjs[3] + " " : "") + item.names[3],
    (item.adjs[4] ? item.adjs[4] + " " : "") + item.names[4]
  ];
};

var sysDecrate = (p) => {
  console.log(p);
  //todo: check
  return [p[0]]
}

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
  game.room = getRoom(game.where);
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

  //atmosphere
  if (game.room.atmosphere) {
    var as = lang.fixString(game.room.atmosphere);
    if (as) out += "\n" + as;
  }
  return out;
};

var cEnter = () => {
  disp(roomEnter());
};

const display = require("./display.js");

//todo
//jak zviditelnit předmět v crate, aby byl jako "here"

var sysExamine = (pars) => {
  var itm = getItem(pars[0]);
  console.log(itm, pars)
  display.printTextYellow("Zkoumáš " + itemFullName(itm)[3] + ".")
  disp(itm.desc);
  if (itm.isCrate()) {
    var inside = crateListItems(itm.id);
    disp("Uvnitř je " + lang.listToText(inside.map(q => itemFullName(q)[0])))
  }
}

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
  getExactItem,
  getItemsBy,
  getFilteredItemsBy,
  playerListItems,
  getExit,
  cInventory,
  cSee,
  cExits,
  cLook,
  cOverlook,
  roomEnter,
  cEnter,
  sysDecrate,
  sysExamine
};