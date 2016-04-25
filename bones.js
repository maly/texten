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

	var findItemsByRoom = function(room) {
		var out = [];
		for (var k in state.game.items) {
			var item = state.game.items[k];
			if (item.where == room) out.push(item);
		}
		return out;
	};

	var readableItemName = function(name) {
		var out = name.A;
		if (name.AD1) out = name.AD1 + " " + name.A;
		if (name.AD2) out = name.AD1 + " " +name.AD2 + " " +name.A;
		return out;
	};

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

	var getItemsHere = function() {
		return superJoin(findItemsByRoom(state.here).map(function(f){return readableItemName(f.name);}), ", ", " a ");
	}

	init(g);

	return {
		init: function(){init(g);},
		log: function(){console.log(getState());},
		itemsHere: getItemsHere
	}
}