var _timers = {};
var timer = function(id, ticks) {
  this.remain = ticks;
  this.id = id; //_timerId++;
  _timers[this.id] = {
    tick: () => {
      if (this.remain) this.remain--;
    },
    state: () => {
      return this.remain;
    },
    set: v => {
      this.remain = v;
    }
  };
  this.state = () => this.remain;
  this.remove = () => {
    delete _timers[this.id];
  };
  return this;
};
var allTick = () => {
  for (var timer in _timers) {
    _timers[timer].tick();
  }
};

var save = () => {
  var out = {};
  for (var t in _timers) {
    out[t] = _timers[t].state();
  }
  return out;
};
var load = n => {
  for (var t in n) {
    if (_timers[t]) _timers[t].set(n[t]);
  }
};

module.exports = {
  timer,
  allTick,
  save,
  load
};
