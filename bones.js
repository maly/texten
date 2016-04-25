var texten = function(g) {

	var game;
	var state;

	var init = function(g) {
		state = {game:g};
		state.here = findRoomByAttr("player");
	};

	var findRoomByAttr = function(attr) {
		for (var k in state.game.rooms) {
			var room = state.game.rooms[k];
			if (room.attrs.indexOf(attr)!=-1) return room.id;
		}
		return null;
	};

	var findRoomById = function(roomId) {
		for (var k in state.game.rooms) {
			var room = state.game.rooms[k];
			if (room.id == roomId) return room;
		}
		return null;
	};

	var findCommandById = function(id) {
		for (var k in state.game.commands) {
			var command = state.game.commands[k];
			if (command.id == id) return command;
		}
		return null;
	};

	var findItemById = function(id) {
		for (var k in state.game.items) {
			var item = state.game.items[k];
			if (item.id == id) return item;
		}
		return null;
	};



	var findItemsByRoom = function(room) {
		var out = [];
		for (var k in state.game.items) {
			var item = state.game.items[k];
			if (item.where == room) out.push(item);
		}
		return out;
	};

	var findExitsByRoom = function(roomId) {
		var out = [];
		var room = findRoomById(roomId);
		for (var k in room.exits) {
			var exit = room.exits[k];
			if (!exit.attrs || exit.attrs.indexOf("inactive") == -1) out.push(exit);
		}
		return out;
	};


	var readableItemName = function(name) {
		var out = name.A;
		if (name.AD1) out = name.AD1 + " " + name.A;
		if (name.AD2) out = name.AD1 + " " +name.AD2 + " " +name.A;
		return out;
	};

	//inteligentní join - a, b, c, d a e
	var superJoin = function (arr, delimiter, last) {
		var out = "";
		if (arr.length == 1) return arr[0];
		for (var k = 0;k<arr.length;k++){
			out += arr[k];
			if (k < arr.length - 2) out += delimiter; else 
			if (k == arr.length - 2) out += last;
		}
		return out;
	}

	var getState = function() {return state;}

	//seznam toho co vidíš
	var getItemsHere = function() {
		return superJoin(findItemsByRoom(state.here).map(function(f){return readableItemName(f.name);}), ", ", " a ");
	};

	//seznam toho co máš
	var getItinerary = function() {
		return superJoin(findItemsByRoom("*").map(function(f){return readableItemName(f.name);}), ", ", " a ");
	};


	//seznam východů
	var getExitsHere = function() {
		return superJoin(findExitsByRoom(state.here).map(function(f){return f.to;}), ", ", " a ");
	};

	//popis místnosti
	var getRoomHere = function() {
		var room = findRoomById(state.here);
		return room.desc;
	};

	//COND
	var evalCond = function(cond, params){
		if (cond.length == 0) return true;
		for (var k in cond) {
			var condAnd = cond[k];
			if (evalCondAnd(condAnd,params)) return true;
		}
		return false;
	};

	var evalCondAnd = function(cond, params){
		if (cond.length == 0) return true;
		for (var k in cond) {
			var condAnd = cond[k];
			if (!evalSimpleCond(condAnd,params)) return false;
		}
		return true;
	};

	var getItemByIdCond = function(id,params) {
		if (id == "$") id = params[0];
		if (id == "#") id = params[1];
		//console.log("FIBIC", id);
		return findItemById(id);
	}

	var evalSimpleCond = function(cond, params){
		//console.log("COND", cond);
		var item1, item2, room;
		switch (cond[0]) {
			case "AR": //attribute is not set for item X
				item1 = getItemByIdCond(cond[1], params);
				return (item1.attrs.indexOf(cond[2])==-1);
			case "AS": //attribute is set for item X
				item1 = getItemByIdCond(cond[1], params);
				return (item1.attrs.indexOf(cond[2])!=-1);
		}
		return false;
	};


	//commands
	var doCommandById = function(cid, params) {
		var cmd = findCommandById(cid);
		var does = cmd.does;
		for (var k in does) {
			var sub = does[k];
			var cond = sub[0];
			var actions = sub[1];

			var doit = evalCond(cond,params);
			console.log(cond,doit);
			if (doit) {doCommands(actions,params)}
		}
	};

	var doCommands = function(action,params) {
		if (action.length==0) return;
		for (var k in action) {
			doSingleCommand(action[k], params);
		}
	};

	var doSingleCommand = function(cmd, params) {
		switch(cmd[0]) {
			case "P": //pick an item
				item1 = getItemByIdCond(cmd[1], params);
				item1.where = "*";
				return;
		}
	};

	init(g);

	return {
		init: function(){init(g);},
		log: function(){console.log(getState());},
		itemsHere: getItemsHere,
		exitsHere: getExitsHere,
		roomHere: getRoomHere,
		doCommand: doCommandById,
		itinerary: getItinerary
	}
}