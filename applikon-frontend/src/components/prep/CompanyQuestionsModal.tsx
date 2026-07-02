import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApplicationScreeningAnswers, useSaveApplicationScreeningAnswers } from '../../hooks/useScreeningAnswers'
import { FIXED_COMPANY_KEY } from './globalAnswers'
import type { Application, ScreeningAnswer, ScreeningAnswerRequest } from '../../types/domain'
import './prep.css'

const MAX_ANSWER = 1000

interface Item {
  label: string | null
  answer: string
  custom: boolean
}

/** Merge the saved per-application answers into the fixed "What do you know about us?"
 *  question followed by any custom questions. */
function buildItems(answers: ScreeningAnswer[]): Item[] {
  const fixed = answers.find(a => !a.custom && a.questionKey === FIXED_COMPANY_KEY)
  const custom = answers
    .filter(a => a.custom)
    .map(a => ({ label: a.label ?? '', answer: a.answer, custom: true }))
  return [{ label: null, answer: fixed?.answer ?? '', custom: false }, ...custom]
}

const toRequest = (items: Item[]): ScreeningAnswerRequest[] =>
  items.map(it =>
    it.custom
      ? { questionKey: null, label: it.label, answer: it.answer, custom: true }
      : { questionKey: FIXED_COMPANY_KEY, label: null, answer: it.answer, custom: false },
  )

/**
 * Modal editor for the per-application "About the company" prep — same layout/behaviour as
 * the global answers modal (fixed question + add/remove custom questions), saved as a
 * replace-all set of per-application screening answers.
 */
export function CompanyQuestionsModal({ application, onClose }: { application: Application; onClose: () => void }) {
  const { data, isLoading } = useApplicationScreeningAnswers(application.id)
  // Seed the editor only once the saved set is loaded, so custom questions are not lost.
  if (isLoading) return <div className="prep-modal-overlay" onClick={onClose} />
  return <CompanyQuestionsEditor applicationId={application.id} initial={data ?? []} onClose={onClose} />
}

function CompanyQuestionsEditor({
  applicationId,
  initial,
  onClose,
}: {
  applicationId: number
  initial: ScreeningAnswer[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { mutate, isPending } = useSaveApplicationScreeningAnswers(applicationId)
  const [items, setItems] = useState<Item[]>(() => buildItems(initial))

  const setAnswer = (index: number, value: string) =>
    setItems(items.map((it, i) => (i === index ? { ...it, answer: value } : it)))
  const setLabel = (index: number, value: string) =>
    setItems(items.map((it, i) => (i === index ? { ...it, label: value } : it)))
  const addCustom = () => setItems([...items, { label: '', answer: '', custom: true }])
  const removeCustom = (index: number) => setItems(items.filter((_, i) => i !== index))

  const save = () => mutate(toRequest(items), { onSuccess: onClose })

  return (
    <div className="prep-modal-overlay" onClick={onClose}>
      <div className="prep-modal" data-cy="company-questions-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="prep-modal-head">
          <h2>{t('cheatSheet.editCompanyTitle')}</h2>
          <button className="prep-modal-close" onClick={onClose} aria-label={t('app.close')}>×</button>
        </div>
        <div className="prep-modal-body">
          {items.map((item, index) => (
            <div className="prep-field" key={item.custom ? `custom-${index}` : 'fixed'}>
              <div className="prep-field-head">
                {item.custom ? (
                  <input
                    className="prep-label-input"
                    type="text"
                    value={item.label ?? ''}
                    placeholder={t('answers.customLabelPlaceholder')}
                    onChange={e => setLabel(index, e.target.value)}
                  />
                ) : (
                  <span className="prep-field-label">{t('cheatSheet.companyLabel')}</span>
                )}
                {item.custom && (
                  <button className="prep-remove-btn" onClick={() => removeCustom(index)} aria-label={t('answers.removeCustom')}>
                    ✕
                  </button>
                )}
              </div>
              <textarea
                className="prep-textarea"
                value={item.answer}
                maxLength={MAX_ANSWER}
                placeholder={t('answers.answerPlaceholder')}
                onChange={e => setAnswer(index, e.target.value)}
              />
              <div className="prep-counter">{item.answer.length}/{MAX_ANSWER}</div>
            </div>
          ))}
          <button className="prep-add-btn" data-cy="prep-add" onClick={addCustom}>+ {t('answers.addCustom')}</button>
        </div>
        <div className="prep-modal-actions">
          <button className="prep-modal-btn cancel" onClick={onClose}>{t('notes.cancel')}</button>
          <button className="prep-modal-btn save" data-cy="prep-save" onClick={save} disabled={isPending}>{t('notes.save')}</button>
        </div>
      </div>
    </div>
  )
}

export default CompanyQuestionsModal
