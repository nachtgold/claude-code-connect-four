import { describe, expect, mock, test } from 'claude-code/testing'

import { AI, COLS, YOU, bestMove, emptyBoard, newGame, play } from '../hooks/game'

const PANE = { component: 'Pane', requestId: 'connect-four',
  props: { title: 'Connect Four', isFocused: true, bodyColumns: 44, placement: 'inline',
    scroll: { offset: 0, bodyRows: 15 }, view: {} } } as const

describe('AI', () => {
  test('takes an immediate win', () => {
    const b = emptyBoard()
    for (const c of [0, 1, 2]) b[5 * COLS + c] = AI
    expect(bestMove(b)).toBe(3)
  })
  test('blocks a threatened four', () => {
    const b = emptyBoard()
    for (const c of [3, 4, 5]) b[5 * COLS + c] = YOU
    b[5 * COLS + 6] = AI
    expect(bestMove(b)).toBe(2)
  })
  test('one turn places the player piece and the AI answer', () => {
    const g = play(newGame(), 3)
    expect(g.board.filter(v => v === YOU)).toHaveLength(1)
    expect(g.board.filter(v => v === AI)).toHaveLength(1)
  })
})

const LANGS = [
  { env: 'en_US.UTF-8', hint: /Press 1–7/, yourTurn: /Your turn \(red\)/, thinking: /AI is thinking/, played: /AI played column/ },
  { env: 'de_DE.UTF-8', hint: /Drücke 1–7/, yourTurn: /Du bist dran \(rot\)/, thinking: /KI denkt nach/, played: /KI spielte Spalte/ },
]

for (const lang of LANGS)
  test(`${lang.env}: own piece first, then the AI thinks with input locked`, async ($, on) => {
    const clock = mock.clock(on)
    mock.env(on, { LANG: lang.env })
    on('settings.read', () => ({ value: {} }))
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: 'connect-four', surface, ...PANE })
      await ui.press({ key: 'new' })
      expect(await ui.find({ type: 'Text', text: lang.yourTurn })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: lang.hint })).toBeDefined()

      const pressed = ui.press({ key: 'drop-3' })
      await clock.settle()
      expect(await ui.findAll({ type: 'Text', text: '●' })).toHaveLength(1)
      expect(await ui.find({ type: 'Text', text: lang.thinking })).toBeDefined()

      const ignored = ui.press({ key: 'drop-0' })
      await clock.advance(2000)
      await pressed
      await ignored
      expect(await ui.findAll({ type: 'Text', text: '●' })).toHaveLength(2)
      expect(await ui.find({ type: 'Text', text: lang.played })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: lang.thinking })).toBeUndefined()
      await ui.unmount()
    }
  })
