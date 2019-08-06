var texth = 24;
var textw = 10;
const padding = 5;
const maxLinesAtOnce = 13;
var ctx;
var supress = false;
var init = () => {
  ctx = document.getElementById("canvas").getContext("2d");
  ctx.font = "20px farroregular";
  ctx.fillStyle = "#eee";
  ctx.textBaseline = "top";
  printAt(" . ", 0, cline);
  printAt("     ", 0, cline);
};

var strings = require("../game/strings.js");

var cls = () => {
  ctx.clearRect(0, 0, 650, 490);
  cline = 0;
};
var printAt = function(text, x, y) {
  if (supress) return;
  ctx.clearRect(
    x * textw + padding,
    y * texth + padding,
    text.length * textw + 10,
    texth
  );
  ctx.fillText(text, x * textw + padding, y * texth + padding);
  //console.log("PRTAT", text, x, y);
};
/*
var clearRect = function(x, y, w, h) {
  ctx.clearRect(x * textw + padding, y * texth + padding, w * textw, h * texth);
};
*/
var cline = 0;
var maxline = 20;

//const main = require("../main.js");

var printLine = function(text) {
  printAt(text, 0, cline);
  cline++;
  if (cline == maxline) scrollUp();
};

var printSameLine = function(text) {
  //console.log("SAMELINE", text, cline);
  ctx.fillStyle = "#e4e";
  printAt(text, 0, cline);
  ctx.fillStyle = "#eee";
  //cline++;
  //if (cline==maxline) scrollUp();
};

var clearSameLine = () => {
  ctx.clearRect(0, cline * texth + padding, 650, texth);
};

var printText = async function(text, prevLineCount) {
  var lineCount = prevLineCount ? prevLineCount : 0;
  var slova = text.split(" ");
  var out = [];
  while (slova.length) {
    out.push(slova.shift());
    var w = ctx.measureText(out.join(" ")).width;
    if (w > 640) {
      //jsme přes
      slova.unshift(out.pop());
      printLine(out.join(" "));
      lineCount++;
      if (lineCount == maxLinesAtOnce) {
        //haveToPause
        printSameLine(strings.GENTER);

        var ww = new Promise(r => {
          window.setEnterWaiter(r);
        }); //.then(() => console.log("WAIT2"))
        await ww;
        //keyboard.wasEnterPressed()
        //console.log("WAIT", q);
        //cline--;

        lineCount = 0;
      }

      out = [];
    }
  }
  if (out.length) {
    printLine(out.join(" "));
    lineCount++;
  }
  return lineCount;
};

//var keyboard = require("./keyboard.js");

var printTextMultiline = async (t, hasWait) => {
  clearSameLine();
  var l = t.split("\n");
  //console.log("PTM", l, l.length);
  var lc = 0;
  //var hasWait = false;
  for (var i = 0; i < l.length; i++) {
    //console.log("PL", i, l[i], lc);
    lc = await printText(l[i], lc);
    //cline++;
  }
  //keyboard.key(0);
  if (!hasWait) return lc;
  printSameLine(strings.GENTER);
  var ww = new Promise(r => {
    window.setEnterWaiter(r);
  });
  await ww;
  clearSameLine();
  //printSameLine("         ");
  return lc;
};

var printTextRed = function(text) {
  ctx.fillStyle = "#e44";
  printText(text);
  ctx.fillStyle = "#eee";
};
var printTextYellow = function(text) {
  ctx.fillStyle = "#ee4";
  printText(text);
  ctx.fillStyle = "#eee";
};

var scrollUp = function() {
  var myImageData = ctx.getImageData(
    0,
    texth,
    640 + 2 * padding,
    480 + 2 * padding - texth
  );
  ctx.clearRect(0, 480 + 2 * padding - texth, 640 + 2 * padding, texth);
  ctx.putImageData(myImageData, 0, 0);
  cline--;
};

//todo:
/*
cls
správně mazat rámce
wait for enter po tisku (printAndWait) :)
*/

module.exports = {
  init,
  noPrint(q) {
    supress = q;
  },
  printAt,
  printLine,
  printSameLine,
  printText,
  printTextRed,
  printTextYellow,
  printTextMultiline,
  clearSameLine,
  cls
};
