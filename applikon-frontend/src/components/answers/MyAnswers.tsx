import { useEffect, useState } from 'react'
import type { ParseKeys } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useScreeningAnswers, useSaveScreeningAnswers } from '../../hooks/useScreeningAnswers'
import type { ScreeningAnswer, ScreeningAnswerRequest } from '../../types/domain'
import './MyAnswers.css'

// Fixed template — stable keys; labels come from i18n (answers.questions.<key>).
// These are global (one set per user). "What do you know about the company" is NOT
// here — it is per-application (Application.companyResearch, edited in the cheat sheet).
export const FIXED_QUESTION_KEYS = [
  'about-me',
  'why-changing',
  'project',
  'expected-salary',
] as const

const MAX_ANSWER_LENGTH = 1000

// Editable row — mirrors the wire shape minus server-assigned fields.
interface Item {
  questionKey: string | null
  label: string | null
  answer: string
  custom: boolean
}

/** Merge the server set into the fixed template, then append custom questions. */
function buildItems(server: ScreeningAnswer[]): Item[] {
  const fixed: Item[] = FIXED_QUESTION_KEYS.map((key) => {
    const found = server.find((a) => !a.custom && a.questionKey === key)
    return { questionKey: key, label: null, answer: found?.answer ?? '', custom: false }
  })
  const custom: Item[] = server
    .filter((a) => a.custom)
    .map((a) => ({ questionKey: null, label: a.label ?? '', answer: a.answer, custom: true }))
  return [...fixed, ...custom]
}

const toRequest = (items: Item[]): ScreeningAnswerRequest[] =>
  items.map((i) => ({ questionKey: i.questionKey, label: i.label, answer: i.answer, custom: i.custom }))

const hasContent = (items: Item[]): boolean =>
  items.some((i) => i.answer.trim() !== '' || (i.custom && (i.label ?? '').trim() !== ''))

export function MyAnswers() {
  const { t } = useTranslation()
  const { data: serverAnswers, isLoading } = useScreeningAnswers()
  const { saveDebounced, isPending, isSuccess } = useSaveScreeningAnswers()

  // Local editable copy — kept separate from the query cache so in-flight saves
  // never clobber what the user is currently typing. Initialized once from the server.
  const [items, setItems] = useState<Item[] | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (serverAnswers && items === null) {
      setItems(buildItems(serverAnswers))
    }
  }, [serverAnswers, items])

  // Single mutation point: update local state and schedule a debounced save.
  // Only ever called from user actions, so the initial load never triggers a save.
  const applyChange = (next: Item[]) => {
    setItems(next)
    saveDebounced(toRequest(next))
  }

  const handleAnswerChange = (index: number, value: string) => {
    if (!items) return
    const next = items.map((item, i) =>
      i === index ? { ...item, answer: value.slice(0, MAX_ANSWER_LENGTH) } : item
    )
    applyChange(next)
  }

  const handleLabelChange = (index: number, value: string) => {
    if (!items) return
    const next = items.map((item, i) => (i === index ? { ...item, label: value } : item))
    applyChange(next)
  }

  const handleAddCustom = () => {
    if (!items) return
    applyChange([...items, { questionKey: null, label: '', answer: '', custom: true }])
  }

  const handleRemoveCustom = (index: number) => {
    if (!items) return
    applyChange(items.filter((_, i) => i !== index))
  }

  if (isLoading || items === null) {
    return <p className="loading">{t('app.loading')}</p>
  }

  // Empty state — nothing filled yet and the user hasn't chosen to start.
  if (!revealed && !hasContent(items)) {
    return (
      <div className="answers">
        <div className="answers-empty">
          <div className="answers-empty-icon">📝</div>
          <h2>{t('answers.emptyTitle')}</h2>
          <p>{t('answers.emptyDescription')}</p>
          <button className="answers-fill-btn" onClick={() => setRevealed(true)}>
            {t('answers.fillIn')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="answers">
      <div className="answers-header">
        <div>
          <h2>{t('answers.title')}</h2>
          <p className="answers-subtitle">{t('answers.subtitle')}</p>
        </div>
        <span className="answers-status" aria-live="polite">
          {isPending ? t('answers.saving') : isSuccess ? t('answers.saved') : ''}
        </span>
      </div>

      <div className="answers-list">
        {items.map((item, index) => {
          const label = item.custom
            ? item.label ?? ''
            : t(`answers.questions.${item.questionKey}` as unknown as ParseKeys)
          return (
            <div className="answer-card" key={item.custom ? `custom-${index}` : item.questionKey}>
              <div className="answer-card-head">
                {item.custom ? (
                  <input
                    className="answer-label-input"
                    type="text"
                    value={item.label ?? ''}
                    placeholder={t('answers.customLabelPlaceholder')}
                    onChange={(e) => handleLabelChange(index, e.target.value)}
                  />
                ) : (
                  <label className="answer-label">{label}</label>
                )}
                {item.custom && (
                  <button
                    className="answer-remove-btn"
                    onClick={() => handleRemoveCustom(index)}
                    aria-label={t('answers.removeCustom')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <textarea
                className="answer-textarea"
                value={item.answer}
                maxLength={MAX_ANSWER_LENGTH}
                placeholder={t('answers.answerPlaceholder')}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
              />
              <div className="answer-counter">{item.answer.length}/{MAX_ANSWER_LENGTH}</div>
            </div>
          )
        })}
      </div>

      <button className="answers-add-btn" onClick={handleAddCustom}>
        + {t('answers.addCustom')}
      </button>
    </div>
  )
}

export default MyAnswers
