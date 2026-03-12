// TEXTEN engine — tick-based timer system
//
// Timers count down in "game ticks" (typically one tick = one player action).
// When a timer reaches zero its callback fires and the timer is removed.
//
// Usage:
//   const timers = createTimerSystem()
//   timers.add("auto-move", 5, () => movePlayer(state, "next_room"))
//   // after each player command:
//   timers.tick()

export const createTimerSystem = () => {
  const timers = new Map() // id → { remaining, callback }

  return {
    // Register a timer. Overwrites any existing timer with the same id.
    add: (id, ticks, callback) => {
      timers.set(id, { remaining: ticks, callback })
    },

    // Advance all timers by one tick. Fire and remove any that expire.
    tick: () => {
      // Snapshot entries so callbacks can safely add new timers
      for (const [id, timer] of [...timers]) {
        timer.remaining--
        if (timer.remaining <= 0) {
          timers.delete(id)
          timer.callback()
        }
      }
    },

    // Remove a timer without firing its callback.
    clear: (id) => timers.delete(id),

    has: (id) => timers.has(id),

    count: () => timers.size,
  }
}
