export type Thinking = { isThinking: boolean; done: number; total: number }
export type Cell = 0 | 1 | 2
export type Game = {
  board: Cell[]
  winner: 0 | 1 | 2 | 3
  line: number[]
  lastMove: number
  score: { you: number; ai: number; draw: number }
}

declare module 'claude-code' {
  interface PluginState {
    'connect-four': { game: Game; thinking: Thinking }
  }
}
