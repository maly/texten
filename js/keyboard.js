/////editor

//var doCommand = null;
var enterFlag = false;
window.doOutput = false;
const display = require("/js/display.js");

var eline = "> ";
var lastWaiter = null;
var key = function(k) {
  //console.log("KK", k);
  if (k == 7) {
    //recall last
    eline += lastWaiter;
  } else if (k == 13) {
    //if (doOutput && eline.length > 2) display.clearSameLine(eline + " ");
    //if (doOutput) display.clearSameLine(eline + " ");
    waiter = eline.substr(2).trim();
    enterFlag = true;
    lastWaiter = eline.substr(2).trim();
    //console.log("WA", waiter);
    //doCommand(eline.substr(2).trim());
    eline = "> ";
    return;
  } else if (k == 8) {
    if (eline.length > 2) {
      eline = eline.substr(0, eline.length - 1);
      if (window.doOutput) display.printSameLine(eline + "_ ");
    }
  } else if (!k) {
    eline = "> ";
    //console.log("KEY 0", window.doOutput, eline);
    if (window.doOutput) display.printSameLine(eline + "_ ");
  } else {
    eline += String.fromCharCode(k);
  }

  if (window.doOutput) display.printSameLine(eline + "_");
};

var waiter = null;

var waitForLine = () => {
  var line = waiter;
  waiter = null;
  return line;
};

var wasEnterPressed = () => {
  if (enterFlag) {
    enterFlag = false;
    return true;
  }
  return false;
};
module.exports = {
  init() {},
  key,
  doOutput(d) {
    window.doOutput = d;
  },
  waitForLine,
  wasEnterPressed
};
