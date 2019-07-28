/////editor

var doCommand = null;
var doOutput = false;
const display = require("/js/display.js");

var eline = "> ";
var lastWaiter = null;
var key = function(k) {
  //console.log("KK", k);
  if (k == 7) {
    //recall last
    eline += lastWaiter;
  } else if (k == 13) {
    if (doOutput) display.printLine(eline + " ");
    waiter = eline.substr(2).trim();
    lastWaiter = eline.substr(2).trim();
    //console.log("WA", waiter);
    //doCommand(eline.substr(2).trim());
    eline = "> ";
    return;
  } else if (k == 8) {
    if (eline.length > 2) {
      eline = eline.substr(0, eline.length - 1);
      if (doOutput) display.printSameLine(eline + "_ ");
    }
  } else if (!k) {
    eline = "> ";
    if (doOutput) display.printSameLine(eline + "_ ");
  } else {
    eline += String.fromCharCode(k);
  }

  if (doOutput) display.printSameLine(eline + "_");
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
  doOutput(d) {
    doOutput = d;
  },
  waitForLine
};
