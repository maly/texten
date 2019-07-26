var texth = 24;
var textw = 10;
const padding = 5;
var ctx = document.getElementById("canvas").getContext("2d");
ctx.font = "20px hologramregular";
ctx.fillStyle = "#eee";
ctx.textBaseline = "top";

var printAt = function(text, x, y) {
  ctx.clearRect(
    x * textw + padding,
    y * texth + padding,
    text.length * textw,
    texth
  );
  ctx.fillText(text, x * textw + padding, y * texth + padding);
};

var clearRect = function(x, y, w, h) {
  ctx.clearRect(x * textw, y * texth, w * textw, h * texth);
};

var cline = 0;
var maxline = 20;

var printLine = function(text) {
  printAt(text, 0, cline);
  cline++;
  if (cline == maxline) scrollUp();
};

var printSameLine = function(text) {
  ctx.fillStyle = "#ee4";
  printAt(text, 0, cline);
  ctx.fillStyle = "#eee";
  //cline++;
  //if (cline==maxline) scrollUp();
};

var printText = function(text) {
  var slova = text.split(" ");
  var out = [];
  while (slova.length) {
    out.push(slova.shift());
    var w = ctx.measureText(out.join(" ")).width;
    if (w > 640) {
      //jsme přes
      slova.unshift(out.pop());
      printLine(out.join(" "));
      out = [];
    }
  }
  if (out.length) {
    printLine(out.join(" "));
  }
};
var printTextMultiline = t => {
  var l = t.split("\n");
  for (i = 0; i < l.length; i++) {
    printText(l[i]);
  }
};

var printTextRed = function(text) {
  ctx.fillStyle = "#e44";
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

module.exports = {
  printAt,
  printLine,
  printSameLine,
  printText,
  printTextRed,
  printTextMultiline
};
