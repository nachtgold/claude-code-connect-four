# Connect Four for Claude Code

A Claude Code mod: type `/connect-four` and a pane opens where you play Connect Four against an AI.

```
⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪
⚪ ⚪ ⚪ ⚪ ⚪ ⚪ ⚪
⚪ ⚪ ⚪ 🟡 ⚪ ⚪ ⚪
⚪ ⚪ 🔴 🔴 ⚪ ⚪ ⚪
⚪ 🟡 🔴 🟡 ⚪ ⚪ ⚪
🔴 🟡 🟡 🔴 🔴 ⚪ ⚪
1  2  3  4  5  6  7
Press 1–7 (columns, left to right) to drop your red piece. Four in a row wins.
⠹ AI is thinking  ▰▰▰▱▱▱▱
You 2 · AI 1 · Draws 0
n: New game  q: Close
```

🔴 you · 🟡 the AI · ⚪ empty. In Claude Code the pieces are drawn as red and yellow `●`.

## Controls

| Key | Action |
| --- | --- |
| `1`–`7` or click `↓` | drop your (red) piece into that column |
| `n` | new game (the score is kept) |
| `q` / `Esc` | close the pane |

Your piece shows right away; while the AI (yellow) thinks, a progress bar runs and input is locked.
The winning four is highlighted.

## AI

Minimax with alpha-beta pruning, 7 plies deep, centre columns first. It takes immediate wins and
blocks your threats. Change `DEPTH` in `hooks/game.ts` to make it weaker or stronger.

## Language

Texts are English or German. German is used when Claude Code's `language` setting says so
(`"language": "german"` in `~/.claude/settings.json`) or, without that setting, when the locale
(`LC_ALL`, `LC_MESSAGES`, `LANG`) starts with `de`. Everything else gets English.

## Install

Requires Claude Code 2.1.287 or later (tested with 2.1.288). Works in the terminal and in the Code tab
of the Claude Desktop app.

```bash
claude plugin marketplace add nachtgold/claude-code-connect-four
claude plugin install connect-four@connect-four
```

Start `claude` (or run `/reload-plugins` in an open session), then type `/connect-four`.

To try it without installing:

```bash
git clone https://github.com/nachtgold/claude-code-connect-four.git
claude --plugin-dir ./claude-code-connect-four
```

## Development

```bash
claude plugin validate .
claude plugin test .
```

`tsconfig.json` extends the types Claude Code writes to `.claude-plugin/types/` once it has loaded
the mod; after that, `tsc -p .` type-checks it.

## License

MIT
