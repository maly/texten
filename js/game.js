//game state

const flex = require("./flexis.js");
const lang = require("./language.js");

var game = {};
var items;
var rooms;
var disp;
var strings;

//init

var init = () => {
  //inicializace hry
  game.items = {};
  game.itemAttrs = {};
  game.rooms = {};
  game.where = "";
};

var initItems = s => {
  var locations = s.reduce((prev, curr) => {
    prev[curr.id] = curr.where;
    return prev;
  }, {});
  game.items = locations;
  game.itemAttrs = s.reduce((prev, curr) => {
    prev[curr.id] = curr.attrs;
    prev[curr.id].push("shadow");
    return prev;
  }, {});
  items = s.map(q => {
    q.names = flex(q.name);
    q.adjs = q.adj ? flex(q.adj) : ["", "", "", "", "", ""];
    q.hasAttr = a => (game.itemAttrs[q.id].indexOf(a) < 0 ? false : true);
    q.isHere = () => game.items[q.id] === game.where;
    q.isMovable = () => game.itemAttrs[q.id].indexOf("nonmovable") < 0;
    q.isCrate = () =>
      game.itemAttrs[q.id].indexOf("crate") < 0 ? false : true;
    q.carry = () => game.items[q.id] === "*";
    q.addAttr = att => {
      if (!q.hasAttr(att)) game.itemAttrs[q.id].push(att);
    };
    q.removeAttr = att => {
      console.log("RATT", att, q.id);
      game.itemAttrs[q.id] = game.itemAttrs[q.id].filter(q => q !== att);
    };
    q.fullName = flex =>
      q.adjs[flex] ? q.adjs[flex] + " " + q.names[flex] : q.names[flex];
    return q;
  });
};

//todo roomAttrs
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
    var cratesHere = items
      .filter(
        q =>
        (game.items[q.id] === "*" || game.items[q.id] === game.where) &&
        q.isCrate()
      )
      .map(q => q.id);

    if (game.itemAttrs[id].indexOf("shadow") >= 0) return false;
    if (flt.player) {
      if (game.items[id] !== "*") return false;
    }
    if (flt.here) {
      if (game.items[id] !== game.where) return false;
    }
    if (flt.near) {
      if (game.items[id] !== game.where && game.items[id] !== "*") {
        if (!cratesHere || cratesHere.length === 0) return false;
        if (cratesHere.indexOf(game.items[id]) < 0) return false;
      }
    }

    if (flt.cratedHere) {
      if (!cratesHere || cratesHere.length === 0) return false;
      //console.log("CRATED HERE", q, cratesHere)
      if (cratesHere.indexOf(game.items[id]) < 0) return false;
      //if (game.items[id] !== game.where && game.items[id] !== "*") return false;
    }

    if (flt.hereOrCrated) {
      if (game.items[id] !== game.where) {
        if (!cratesHere || cratesHere.length === 0) return false;
        if (cratesHere.indexOf(game.items[id]) < 0) return false;
      }
    }
    //console.log("FLT1", q, flt);

    if (flt.movable) {
      //if (!getItem(id).hasAttr("nonmovable")) return false;
      if (game.itemAttrs[id].indexOf("nonmovable") >= 0) return false;
    }

    if (flt.hasAttr) {
      if (game.itemAttrs[id].indexOf(flt.hasAttr) < 0) return false;
    }
    if (flt.hasNotAttr) {
      if (game.itemAttrs[id].indexOf(flt.hasNotAttr) >= 0) return false;
    }
    //console.log("FLT", q);
    return true;
  });
  //console.log("QF", out);
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

var crateListItems = crate => {
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

var getExitById = e => {
  var xl = exitList();
  //console.log("GEID", xl, e);
  xl = xl.filter(q => {
    return q.room === e;
  });
  //console.log(xl);
  return xl[0];
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

var sysDecrate = p => {
  console.log("DECRATE", p);
  if (p.length === 0) return p;
  //todo: check
  return [p[0]];
};

//
//step ticker
var stepTickers = {};
var stepTickAll = () => {
  console.log("Steptick");
  for (var tickerId in stepTickers) {
    var ticker = stepTickers[tickerId];
    console.log("TIK", ticker);
    ticker.remain--;
    if (ticker.remain === 0) {
      //ticker.fn(gameObject);
      if (ticker.whereToGo) {
        cEnter(ticker.whereToGo);
        continue;
      }
    }
  }
};

//nastaví stepTicker, pokud ještě není (!)
var startStepTick = (id, tick) => {
  if (stepTickers[id]) return;
  stepTickers[id] = {
    remain: tick
  };
};

//stepTickers, který někam jde

var startStepTickToGo = (id, go, tick) => {
  startStepTick(id, tick);
  stepTickers[id].whereToGo = go;
};
//s tick end

var cInventory = () => {
  var l = playerListItems();
  if (l.length === 0) return strings.NOCARRY;
  //console.log("INV", l);

  items.filter(q => game.items[q.id] === "*").map(q => q.removeAttr("shadow"));

  return strings.HAVE + lang.listToText(l.map(q => itemFullName(q)[3]));
};

var cSee = () => {
  var l = roomListItems();
  if (l.length === 0) return "";
  return strings.SEE + lang.listToText(l.map(q => itemFullName(q)[3]));
};

var cExits = () => {
  var l = exitList();
  if (!l || l.length === 0) return ""; // strings.NOGO;
  return strings.CANGO + lang.listToText(l.map(q => q.to), ", nebo ");
};

var cLook = onlyFirst => {
  var room = getRoom(game.where);
  if (!room) return "";
  console.log("CLOOK", game.where, game.rooms[game.where], room);
  if (onlyFirst && game.rooms[game.where].looked) return "";
  console.log("SHOULD");
  game.rooms[game.where].looked = true;
  if (!room.ext) return "";
  console.log("MUST");
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
  var q = cLook(true);
  if (q) {
    out += "\n" + q;
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

  //deshadow
  items
    .filter(q => game.items[q.id] === game.where)
    .map(q => q.removeAttr("shadow"));
  return out;
};

var roomAtmo = () => {
  game.room = getRoom(game.where);
  var out = "";

  //atmosphere
  if (game.room.atmosphere) {
    var as = lang.fixString(game.room.atmosphere);
    if (as) out += "\n" + as;
  }

  if (out) disp(out);
};

var cEnter = async nroom => {
  if (nroom) game.where = nroom;
  game.room = getRoom(game.where);
  window.doOutput = false;
  if (game.room._beforeEnter) await game.room._beforeEnter(gameObject);
  await disp(roomEnter());
  if (game.room._enter) await game.room._enter(gameObject);
  window.doOutput = true;
  window.needKey0 = true;
};

var display = require("./display.js");

var condMoveItem = (itm, from, to) => {
  if (game.items[itm] == from) game.items[itm] = to;
};

//todo
//jak zviditelnit předmět v crate, aby byl jako "here"

//atributy předmětů součástí game state
/*
var sysExamine = pars => {
  var itm = getItem(pars[0]);
  console.log(itm, pars);
  display.printTextYellow("Zkoumáš " + itemFullName(itm)[3] + ".");
  disp(itm.desc);
  if (itm.isCrate()) {
    var inside = crateListItems(itm.id);
    disp("Uvnitř je " + lang.listToText(inside.map(q => itemFullName(q)[0])));
    //deshadow
    inside.map(q => q.removeAttr("shadow"));
  }
};
*/

var music = require("./music.js");
var video = require("./video.js");

var gameObject = {
  init,
  initItems,
  initRooms,
  display: f => {
    disp = t => f(lang.fixString(t));
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
  itemFullName,
  crateListItems,
  getExit,
  getExitById,
  cInventory,
  cSee,
  cExits,
  cLook,
  cOverlook,
  roomEnter,
  roomAtmo,
  cEnter,
  sysDecrate,
  sysExamine(pars, cmd) {
    require("./syscmd/examine.js")(gameObject, pars, cmd);
  },
  sysGo(pars, cmd) {
    require("./syscmd/go.js")(gameObject, pars, cmd);
  },
  sysItinerary(pars, cmd) {
    require("./syscmd/itinerary.js")(gameObject, pars, cmd);
  },
  sysDrop(pars, cmd) {
    require("./syscmd/drop.js")(gameObject, pars, cmd);
  },
  sysTake(pars, cmd) {
    require("./syscmd/take.js")(gameObject, pars, cmd);
  },
  condMoveItem,
  async sysRoomLook() {
    var out = "";
    out += cOverlook();
    var q = cLook(true);
    if (q) {
      out += "\n" + q;
    }
    out += "\n" + cExits();
    q = cSee();
    if (q) {
      out += "\n" + q;
    }
    await disp(out);
  },
  err(s) {
    display.printTextRed(lang.fixString(s));
  },
  dropItem(i) {
    game.items[i] = game.where;
  },
  takeItem(i) {
    game.items[i] = "*";
  },
  stepTickAll,
  startStepTickToGo,
  dispML: async t => {
    t = lang.fixString(t, gameObject);
    var n = await display.printTextMultiline(t, true);
    return n;
  },
  doDisp(s) {
    disp(s);
  },
  cls() {
    display.cls();
  },
  musicPlay(id) {
    music.fadeTo(id);
  },
  musicPlayList(id) {
    music.fadeToList(id);
  },
  videoPlay(id) {
    video.play(id);
  },
  async waitForEnter() {
    display.printSameLine("" + strings.GENTER + "          ");
    display.noPrint(true);
    var ww = new Promise(r => {
      window.setEnterWaiter(r);
    }); //.then(() => console.log("WAIT2"))
    await ww;
    display.noPrint(false);
  },
  vars: require("./vars.js")
};

var timers = require("./timer.js");

var gameSave = () => {
  var out = {
    ...game
  };
  delete out.room;
  out.vars = gameObject.vars.save();
  out.timers = timers.save();
  //steptickers
  out.stepTickers = {
    ...stepTickers
  };
  out.music = music.playlist();
  out.timestamp = new Date().getTime();
  return out;
};
var gameLoad = d => {
  console.log(d)
  music.fadeToList(d.music)
  game.items = d.items;
  game.itemAttrs = d.itemAttrs;
  game.rooms = d.rooms;
  stepTickers = {
    ...d.stepTickers
  };
  gameObject.vars.load(d.vars);
  timers.load(d.timers);
  game.where = d.where;
};

var LZString = require("lz-string");

window.gameSave = (id, remark) => {
  if (id < 1) return null;
  if (id > 9) return null;
  var gid = strings.GID;
  var ls;
  if (!window.localStorage[gid]) {
    ls = [];
  } else {
    ls = JSON.parse(
      LZString.decompressFromUTF16(window.localStorage.getItem(gid))
    );
  }
  var out = gameSave();
  out.remark = remark;
  ls[id - 1] = out;
  window.localStorage.setItem(
    gid,
    LZString.compressToUTF16(JSON.stringify(ls))
  );
  return out;
};

window.gameLoad = id => {
  if (id < 1) return null;
  if (id > 9) return null;
  var gid = strings.GID;
  if (!window.localStorage[gid]) {
    return null;
  }
  var ls = JSON.parse(
    LZString.decompressFromUTF16(window.localStorage.getItem(gid))
  );
  gameLoad(ls[id - 1]);
};

window.gameList = () => {
  var gid = strings.GID;
  if (!window.localStorage[gid]) {
    return null;
  }
  var ls = JSON.parse(
    LZString.decompressFromUTF16(window.localStorage.getItem(gid))
  );
  var list = ls.map((q, idx) => !q ? (idx + ". - - - P R Á Z D N É - - -") : (idx + ". " + new Date(q.timestamp).toLocaleString()) + " " + q.remark)
  //console.log(list)
};


module.exports = gameObject;