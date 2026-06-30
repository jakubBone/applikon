import { useEffect, useState } from 'react'
import type { ParseKeys } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useScreeningAnswers } from '../../hooks/useScreeningAnswers'
import { useUpdateCompanyResearch } from '../../hooks/useApplications'
import { FIXED_QUESTION_KEYS } from '../answers/MyAnswers'
import type { Application } from '../../types/domain'
import './CheatSheetModal.css'

const MAX_COMPANY_LENGTH = 1000

interface Props {
  application: Application
  // Pre-formatted proposed salary for this application (null → none recorded).
  salary: string | null
  onClose: () => void
}

export function CheatSheetModal({ application, salary, onClose }: Props) {
  const { t } = useTranslation()
  const [, setSearchParams] = useSearchParams()
  const { data: answers = [] } = useScreeningAnswers()
  const { saveDebounced, isPending, isSuccess } = useUpdateCompanyResearch()

  // Local editable copy of the per-application company note; autosaves on change.
  const [company, setCompany] = useState(application.companyResearch ?? '')

  // Esc closes the modal — fast exit during a call.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCompanyChange = (value: string) => {
    const next = value.slice(0, MAX_COMPANY_LENGTH)
    setCompany(next)
    saveDebounced(application.id, next)
  }

  const goToAnswers = () => {
    onClose()
    setSearchParams(params => { params.set('view', 'answers'); params.delete('app'); return params })
  }

  // Compose the global answers read view: fixed (in order) then custom; only filled ones.
  const fixed = FIXED_QUESTION_KEYS.map(key => ({
    label: t(`answers.questions.${key}` as unknown as ParseKeys),
    answer: answers.find(a => !a.custom && a.questionKey === key)?.answer ?? '',
  }))
  const custom = answers.filter(a => a.custom).map(a => ({ label: a.label ?? '', answer: a.answer }))
  const composed = [...fixed, ...custom].filter(i => i.answer.trim() !== '')
  const hasAnswers = composed.length > 0

  return (
    <div className="cheat-overlay" onClick={onClose}>
      <div className="cheat-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="cheat-head">
          <div>
            <h2>{t('cheatSheet.title')}</h2>
            <p className="cheat-company">{application.company}</p>
          </div>
          <button className="cheat-close" onClick={onClose} aria-label={t('app.close')}>×</button>
        </div>

        {/* Proposed salary — per application */}
        <div className="cheat-section">
          <span className="cheat-label">{t('cheatSheet.salaryLabel')}</span>
          <span className="cheat-salary">{salary ?? '—'}</span>
        </div>

        {/* Per-application company note — editable, autosaves */}
        <div className="cheat-section">
          <div className="cheat-section-head">
            <span className="cheat-label">{t('cheatSheet.companyLabel')}</span>
            <span className="cheat-status" aria-live="polite">
              {isPending ? t('answers.saving') : isSuccess ? t('answers.saved') : ''}
            </span>
          </div>
          <textarea
            className="cheat-textarea"
            value={company}
            maxLength={MAX_COMPANY_LENGTH}
            placeholder={t('cheatSheet.companyPlaceholder')}
            onChange={e => handleCompanyChange(e.target.value)}
          />
          <div className="cheat-counter">{company.length}/{MAX_COMPANY_LENGTH}</div>
        </div>

        {/* Global "My answers" — read view + edit link */}
        <div className="cheat-section">
          <div className="cheat-section-head">
            <span className="cheat-label">{t('cheatSheet.answersTitle')}</span>
            <button className="cheat-edit-link" onClick={goToAnswers}>{t('cheatSheet.editAnswers')}</button>
          </div>
          {hasAnswers ? (
            <div className="cheat-answers">
              {composed.map((item, i) => (
                <div className="cheat-answer" key={i}>
                  <div className="cheat-answer-q">{item.label}</div>
                  <div className="cheat-answer-a">{item.answer}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="cheat-empty">
              <p>{t('answers.emptyDescription')}</p>
              <button className="cheat-fill-btn" onClick={goToAnswers}>{t('answers.fillIn')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheatSheetModal
