//FLEX
/*

"bot-a,y,ě,u"
"botník-,u,u"
"louč-,e,i"
*/

var flex = s => {
  var f = s.split(",");
  var first = f[0];
  var [core, postfix] = first.split("-");
  //console.log(core, postfix);
  var tvary = [];
  tvary[0] = core + postfix;
  tvary[1] = core + f[1];
  tvary[2] = core + f[2];
  if (f.length === 3) {
    tvary[3] = tvary[0];
  } else {
    tvary[3] = core + f[3];
  }
  //console.log(tvary);
  return tvary;
};

module.exports = flex;
