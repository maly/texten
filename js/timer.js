var _timers = {};
var _timerId = 0;
var timer = function (id, ticks) {
    this.remain = ticks;
    this.id = id; //_timerId++;
    _timers[this.id] = {
        tick: () => {
            if (this.remain) this.remain--;
        },
        state: () => {
            return this.remain;
        }
    };
    this.state = () => this.remain;
    this.remove = () => {
        delete _timers[this.id]
    }
    return this;
};
var allTick = () => {
    for (var timer in _timers) {
        _timers[timer].tick();
    }
}
module.exports = {
    timer,
    allTick
}