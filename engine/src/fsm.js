// TEXTEN engine — finite state machine
//
// Each state is a plain object with optional callbacks:
//   enter()  — called when entering the state
//   tick()   — called each game tick while in the state
//   exit()   — called when leaving the state
//
// Usage:
//   const fsm = createFSM(
//     {
//       titlescreen: { enter: showTitle, tick: checkKeypress },
//       game:        { enter: startGame, tick: gameLoop },
//     },
//     "titlescreen"
//   )
//   fsm.tick()                // call in rAF / game loop
//   fsm.transition("game")   // when player presses Enter on title

export const createFSM = (states, initialState) => {
  if (!states || typeof states !== "object") {
    throw new TypeError("createFSM: states must be a plain object")
  }
  if (typeof initialState !== "string") {
    throw new TypeError("createFSM: initialState must be a string")
  }
  if (!states[initialState]) {
    throw new Error(`createFSM: initial state '${initialState}' not found in states`)
  }

  let current = initialState

  // Enter the initial state immediately
  states[current]?.enter?.()

  return {
    getState: () => current,

    tick: () => {
      states[current]?.tick?.()
    },

    transition: (newState) => {
      if (!states[newState]) {
        throw new Error(`createFSM: unknown state '${newState}'`)
      }
      states[current]?.exit?.()
      current = newState
      states[current]?.enter?.()
    },
  }
}
