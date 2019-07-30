var texth = 24;
var textw = 10;
const padding = 5;
const maxLinesAtOnce = 13;
var init = () => {
  ctx = document.getElementById("canvas").getContext("2d");
  ctx.font = "20px farroregular";
  ctx.fillStyle = "#eee";
  ctx.textBaseline = "top";
  printAt(" ", 0, cline);
};
var printAt = function (text, x, y) {
  ctx.clearRect(
    x * textw + padding,
    y * texth + padding,
    text.length * textw,
    texth
  );
  ctx.fillText(text, x * textw + padding, y * texth + padding);
};

var clearRect = function (x, y, w, h) {
  ctx.clearRect(x * textw, y * texth, w * textw, h * texth);
};

var cline = 0;
var maxline = 20;


const main = require("../main.js")

var printLine = function (text) {
  printAt(text, 0, cline);
  cline++;
  if (cline == maxline) scrollUp();
};

var printSameLine = function (text) {
  ctx.fillStyle = "#ee4";
  printAt(text, 0, cline);
  ctx.fillStyle = "#eee";
  //cline++;
  //if (cline==maxline) scrollUp();
};

var printText = async function (text, prevLineCount) {
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
      lineCount++
      if (lineCount == maxLinesAtOnce) {
        //haveToPause
        printSameLine("[ENTER]")

        var ww = new Promise((r, j) => {
          window.setEnterWaiter(r);
        }) //.then(() => console.log("WAIT2"))
        var q = await ww;
        //keyboard.wasEnterPressed()
        console.log("WAIT", q);
        cline--

        lineCount = 0;
      }

      out = [];
    }
  }
  if (out.length) {
    printLine(out.join(" "));
    lineCount++
  }
  return lineCount
};

var printTextMultiline = async (t, hasWait) => {
  var l = t.split("\n");
  var lc = 0;
  //var hasWait = false;
  for (i = 0; i < l.length; i++) {
    lc = await printText(l[i], lc);
  }
  if (!hasWait) return lc;
  printSameLine("[ENTER]")
  var ww = new Promise((r, j) => {
    window.setEnterWaiter(r);
  })
  var q = await ww;
  return lc
};

var printTextRed = function (text) {
  ctx.fillStyle = "#e44";
  printText(text);
  ctx.fillStyle = "#eee";
};

var scrollUp = function () {
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
  printAt,
  printLine,
  printSameLine,
  printText,
  printTextRed,
  printTextMultiline
};