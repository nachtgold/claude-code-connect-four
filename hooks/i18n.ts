export type Lang = 'en' | 'de'

const TEXTS = {
  en: {
    commandDescription: 'Play Connect Four against the AI',
    opened: 'Connect Four opened. Keys 1–7 drop a piece, n = new game, Esc closes.',
    youWon: 'You won! 🎉',
    aiWon: 'The AI won.',
    draw: 'Draw.',
    thinking: 'AI is thinking',
    yourTurn: 'Your turn (red).',
    aiPlayed: (col: number) => `AI played column ${col}. Your turn.`,
    score: (you: number, ai: number, draw: number) => `You ${you} · AI ${ai} · Draws ${draw}`,
    newGame: 'New game',
    close: 'Close',
  },
  de: {
    commandDescription: 'Connect Four gegen die KI spielen',
    opened: 'Connect Four geöffnet. Tasten 1–7 werfen einen Stein, n = neues Spiel, Esc schließt.',
    youWon: 'Du hast gewonnen! 🎉',
    aiWon: 'Die KI hat gewonnen.',
    draw: 'Unentschieden.',
    thinking: 'KI denkt nach',
    yourTurn: 'Du bist dran (rot).',
    aiPlayed: (col: number) => `KI spielte Spalte ${col}. Du bist dran.`,
    score: (you: number, ai: number, draw: number) => `Du ${you} · KI ${ai} · Remis ${draw}`,
    newGame: 'Neues Spiel',
    close: 'Schließen',
  },
} as const

export type Texts = (typeof TEXTS)[Lang]

export const isGerman = (value: unknown) =>
  typeof value === 'string' && /^(de\b|de[-_]|german|deutsch)/i.test(value.trim())

export const texts = (lang: Lang): Texts => TEXTS[lang]
