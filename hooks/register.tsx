import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { isGerman, texts } from './i18n'
import type { Lang } from './i18n'
import { COLS, ORDERED, ROWS, aiMove, dropRow, newGame, pickBest, playerMove, scoreColumn } from './game'

const PANE = 'connect-four'
const game = atom({ plugin: 'connect-four', key: 'game' } as const, newGame())
const thinking = atom({ plugin: 'connect-four', key: 'thinking' } as const, { isThinking: false, done: 0, total: 0 })
const MIN_THINK_MS = 400
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
let isBusy = false
let lang: Promise<Lang> | undefined

/** German when Claude Code's `language` setting or the locale says so, English otherwise. */
const detectLang = async ($: EngineInterface): Promise<Lang> => {
  const { language } = await $.settings.read()
  if (typeof language === 'string' && language.trim()) return isGerman(language) ? 'de' : 'en'
  const locale =
    (await $.env.get('LC_ALL')) || (await $.env.get('LC_MESSAGES')) || (await $.env.get('LANG')) ||
    Intl.DateTimeFormat().resolvedOptions().locale
  return isGerman(locale) ? 'de' : 'en'
}
const t$ = async ($: EngineInterface) => texts(await (lang ??= detectLang($)))

/** Shows the person's piece first, then lets the AI think column by column so the pane redraws in between. */
const turn = async ($: EngineInterface, col: number) => {
  if (isBusy) return
  isBusy = true
  try {
    let isAiTurn = false
    await update($, game, cur => {
      const next = playerMove(cur, col)
      isAiTurn = next !== cur && !next.winner
      return next
    })
    if (!isAiTurn) return

    const { board } = await read($, game)
    const columns = ORDERED.filter(c => dropRow(board, c) >= 0)
    const started = await $.clock.now()
    const scores = new Map<number, number>()
    await update($, thinking, () => ({ isThinking: true, done: 0, total: columns.length }))
    for (const [i, c] of columns.entries()) {
      await $.clock.sleep(30)
      const v = scoreColumn(board, c)
      if (v !== undefined) scores.set(c, v)
      await update($, thinking, t => ({ ...t, done: i + 1 }))
    }
    const rest = MIN_THINK_MS - ((await $.clock.now()) - started)
    if (rest > 0) await $.clock.sleep(rest)
    await update($, game, cur => aiMove(cur, pickBest(scores)))
  } finally {
    await update($, thinking, () => ({ isThinking: false, done: 0, total: 0 }))
    isBusy = false
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'connect-four',
      description: (await t$($)).commandDescription,
    })
    return next(e)
  })

  on('command.run', { command: 'connect-four' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Connect Four', focus: true, closeOnEscape: true, rows: 14, columns: 44 })
    return { text: (await t$($)).opened }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const g = await read($, game)
    const t = await read($, thinking)
    const tx = await t$($)

    const status =
      g.winner === 1 ? tx.youWon
      : g.winner === 2 ? tx.aiWon
      : g.winner === 3 ? tx.draw
      : t.isThinking
        ? `${SPINNER[t.done % SPINNER.length]} ${tx.thinking}  ${'▰'.repeat(t.done)}${'▱'.repeat(t.total - t.done)}`
      : g.lastMove < 0 ? tx.yourTurn
      : tx.aiPlayed((g.lastMove % COLS) + 1)

    const cell = (i: number) => {
      const v = g.board[i]
      const inLine = g.line.includes(i)
      if (v === 0) return <Text dimColor>·</Text>
      return (
        <Text color={v === 1 ? 'red' : 'yellow'} bold={inLine || i === g.lastMove} inverse={inLine}>
          ●
        </Text>
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          {Array.from({ length: COLS }, (_, c) => (
            <Box key={`col-${c}`} flexDirection="column" alignItems="center" width={5}>
              {Array.from({ length: ROWS }, (_, r) => cell(r * COLS + c))}
              <Button
                key={`drop-${c}`}
                plain
                hotkey={String(c + 1)}
                label="↓"
                dimColor={t.isThinking || g.winner !== 0 || dropRow(g.board, c) < 0}
                autoFocus={c === 3 ? true : undefined}
                onPress={() => turn($, c)}
              />
            </Box>
          ))}
        </Box>
        <Text> </Text>
        <Text bold={g.winner !== 0}>{status}</Text>
        <Text dimColor>{tx.score(g.score.you, g.score.ai, g.score.draw)}</Text>
        <Box flexDirection="row" gap={2}>
          <Button key="new" hotkey="n" plain label={tx.newGame} variant="primary" dimColor={t.isThinking}
            onPress={() => (isBusy ? undefined : update($, game, cur => newGame(cur.score)))} />
          <Button key="close" hotkey="q" plain label={tx.close} role="dismiss"
            onPress={() => $.ui.close({ id: PANE })} />
        </Box>
      </Box>
    )
  })
}
