import type { Cell, Game } from '../types'

export const ROWS = 6
export const COLS = 7
export const YOU = 1
export const AI = 2
const DEPTH = 7
const ORDER = [3, 2, 4, 1, 5, 0, 6]

export const emptyBoard = (): Cell[] => Array(ROWS * COLS).fill(0)

export const newGame = (score = { you: 0, ai: 0, draw: 0 }): Game => ({
  board: emptyBoard(),
  winner: 0,
  line: [],
  lastMove: -1,
  score,
})

export const dropRow = (board: Cell[], col: number): number => {
  for (let r = ROWS - 1; r >= 0; r--) if (board[r * COLS + col] === 0) return r
  return -1
}

const DIRS: ReadonlyArray<readonly [number, number]> = [[0, 1], [1, 0], [1, 1], [1, -1]]

export const findLine = (board: Cell[]): { who: Cell; line: number[] } | undefined => {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const who = board[r * COLS + c]
      if (!who) continue
      for (const [dr, dc] of DIRS) {
        const line = [0, 1, 2, 3].map(i => [r + dr * i, c + dc * i] as const)
        if (line.every(([y, x]) => y >= 0 && y < ROWS && x >= 0 && x < COLS && board[y * COLS + x] === who))
          return { who, line: line.map(([y, x]) => y * COLS + x) }
      }
    }
  return undefined
}

const windowScore = (cells: Cell[]): number => {
  const ai = cells.filter(v => v === AI).length
  const you = cells.filter(v => v === YOU).length
  if (ai && you) return 0
  if (ai === 3) return 5
  if (ai === 2) return 2
  if (you === 3) return -6
  if (you === 2) return -2
  return 0
}

const evaluate = (board: Cell[]): number => {
  let score = 0
  for (let r = 0; r < ROWS; r++) if (board[r * COLS + 3] === AI) score += 3
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      for (const [dr, dc] of DIRS) {
        const er = r + dr * 3, ec = c + dc * 3
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue
        score += windowScore([0, 1, 2, 3].map(i => board[(r + dr * i) * COLS + c + dc * i] ?? 0))
      }
  return score
}

const minimax = (board: Cell[], depth: number, alpha: number, beta: number, aiTurn: boolean): number => {
  const won = findLine(board)
  if (won) return won.who === AI ? 100000 + depth : -100000 - depth
  if (board.every(v => v !== 0)) return 0
  if (depth === 0) return evaluate(board)
  let best = aiTurn ? -Infinity : Infinity
  for (const c of ORDER) {
    const r = dropRow(board, c)
    if (r < 0) continue
    board[r * COLS + c] = aiTurn ? AI : YOU
    const v = minimax(board, depth - 1, alpha, beta, !aiTurn)
    board[r * COLS + c] = 0
    if (aiTurn) { best = Math.max(best, v); alpha = Math.max(alpha, v) }
    else { best = Math.min(best, v); beta = Math.min(beta, v) }
    if (alpha >= beta) break
  }
  return best
}

export const ORDERED = ORDER

/** How good dropping an AI piece in `col` is; undefined when the column is full. */
export const scoreColumn = (board: Cell[], col: number, depth = DEPTH): number | undefined => {
  const r = dropRow(board, col)
  if (r < 0) return undefined
  const work = [...board]
  work[r * COLS + col] = AI
  return minimax(work, depth - 1, -Infinity, Infinity, false)
}

export const pickBest = (scores: Map<number, number>): number => {
  let best = -1, bestScore = -Infinity
  for (const c of ORDER) {
    const v = scores.get(c)
    if (v !== undefined && v > bestScore) { bestScore = v; best = c }
  }
  return best
}

export const bestMove = (board: Cell[], depth = DEPTH): number => {
  const scores = new Map<number, number>()
  for (const c of ORDER) {
    const v = scoreColumn(board, c, depth)
    if (v !== undefined) scores.set(c, v)
  }
  return pickBest(scores)
}

const place = (game: Game, col: number, who: Cell): Game => {
  const r = dropRow(game.board, col)
  if (r < 0) return game
  const board = [...game.board]
  board[r * COLS + col] = who
  const won = findLine(board)
  const full = board.every(v => v !== 0)
  const winner = won ? (won.who as 1 | 2) : full ? 3 : 0
  const score = { ...game.score }
  if (winner === 1) score.you++
  if (winner === 2) score.ai++
  if (winner === 3) score.draw++
  return { board, winner, line: won?.line ?? [], lastMove: r * COLS + col, score }
}

/** The person drops a piece in `col`; the game unchanged when that is not allowed. */
export const playerMove = (game: Game, col: number): Game =>
  game.winner || dropRow(game.board, col) < 0 ? game : place(game, col, YOU)

/** The AI drops a piece in `col`. */
export const aiMove = (game: Game, col: number): Game =>
  game.winner || col < 0 ? game : place(game, col, AI)

/** The person's move and the AI's answer at once. */
export const play = (game: Game, col: number): Game => {
  const after = playerMove(game, col)
  return after === game || after.winner ? after : aiMove(after, bestMove(after.board))
}
