/////editor

var doCommand = null;
const display = require("/js/display.js");

var eline = "> ";
var key = function(k) {
  if (k == 13) {
    display.printLine(eline + " ");
    waiter = eline.substr(2).trim();
    console.log("WA", waiter);
    //doCommand(eline.substr(2).trim());
    eline = "> ";
    return;
  } else if (k == 8) {
    if (eline.length > 2) {
      eline = eline.substr(0, eline.length - 1);
      display.printSameLine(eline + "_ ");
    }
  } else if (!k) {
    eline = "> ";
    display.printSameLine(eline + "_ ");
  } else {
    eline += String.fromCharCode(k);
  }

  display.printSameLine(eline + "_");
};

var waiter = null;

var waitForLine = () => {
  var line = waiter;
  waiter = null;
  return line;
};

module.exports = {
  init: doCommandCB => {
    doCommand = doCommandCB;
  },
  key,
  waitForLine
};
