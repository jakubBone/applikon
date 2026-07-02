import type { ScreeningAnswer, ScreeningAnswerRequest } from '../../types/domain'

// Fixed template — stable keys; labels come from i18n (answers.questions.<key>).
// These are global (one set per user). "What do you know about the company" is NOT
// here — it is per-application (Application.companyResearch).
export const FIXED_QUESTION_KEYS = [
  'about-me',
  'why-changing',
  'project',
] as const

export const MAX_ANSWER_LENGTH = 1000

// Editable row — mirrors the wire shape minus server-assigned fields.
export interface Item {
  questionKey: string | null
  label: string | null
  answer: string
  custom: boolean
}

/** Merge the server set into the fixed template, then append custom questions. */
export function buildItems(server: ScreeningAnswer[]): Item[] {
  const fixed: Item[] = FIXED_QUESTION_KEYS.map((key) => {
    const found = server.find((a) => !a.custom && a.questionKey === key)
    return { questionKey: key, label: null, answer: found?.answer ?? '', custom: false }
  })
  const custom: Item[] = server
    .filter((a) => a.custom)
    .map((a) => ({ questionKey: null, label: a.label ?? '', answer: a.answer, custom: true }))
  return [...fixed, ...custom]
}

export const toRequest = (items: Item[]): ScreeningAnswerRequest[] =>
  items.map((i) => ({ questionKey: i.questionKey, label: i.label, answer: i.answer, custom: i.custom }))

export const hasContent = (items: Item[]): boolean =>
  items.some((i) => i.answer.trim() !== '' || (i.custom && (i.label ?? '').trim() !== ''))
