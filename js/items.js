//

var parse = s => {
  var locations = s.reduce((prev, curr) => {
    prev[curr.id] = curr.where;
    return prev;
  }, {});
  console.log(locations);
};

module.exports = { parse };
