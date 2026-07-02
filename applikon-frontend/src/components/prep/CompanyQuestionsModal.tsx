import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateCompanyResearch } from '../../hooks/useApplications'
import { parseCompanyItems, serializeCompanyItems, MAX_COMPANY_LENGTH, type CompanyItem } from './companyQuestions'
import type { Application } from '../../types/domain'
import './prep.css'

const MAX_ANSWER = 1000

/**
 * Modal editor for the per-application "O firmie" prep — same layout/behaviour as
 * the global answers modal (fixed question + add/remove custom questions), but the
 * whole set is saved into the existing `companyResearch` field (no backend change).
 */
export function CompanyQuestionsModal({ application, onClose }: { application: Application; onClose: () => void }) {
  const { t } = useTranslation()
  const { mutate, isPending } = useUpdateCompanyResearch()
  const [items, setItems] = useState<CompanyItem[]>(() => parseCompanyItems(application.companyResearch))

  const setAnswer = (index: number, value: string) =>
    setItems(items.map((it, i) => (i === index ? { ...it, answer: value } : it)))
  const setLabel = (index: number, value: string) =>
    setItems(items.map((it, i) => (i === index ? { ...it, label: value } : it)))
  const addCustom = () => setItems([...items, { label: '', answer: '', custom: true }])
  const removeCustom = (index: number) => setItems(items.filter((_, i) => i !== index))

  const serialized = serializeCompanyItems(items)
  const tooLong = serialized.length > MAX_COMPANY_LENGTH

  const save = () => {
    if (!tooLong) mutate({ id: application.id, value: serialized }, { onSuccess: onClose })
  }

  return (
    <div className="prep-modal-overlay" onClick={onClose}>
      <div className="prep-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
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
            </div>
          ))}
          <button className="prep-add-btn" onClick={addCustom}>+ {t('answers.addCustom')}</button>
          <div className="prep-counter" style={tooLong ? { color: '#c0392b' } : undefined}>
            {serialized.length}/{MAX_COMPANY_LENGTH}
          </div>
        </div>
        <div className="prep-modal-actions">
          <button className="prep-modal-btn cancel" onClick={onClose}>{t('notes.cancel')}</button>
          <button className="prep-modal-btn save" onClick={save} disabled={isPending || tooLong}>{t('notes.save')}</button>
        </div>
      </div>
    </div>
  )
}

export default CompanyQuestionsModal
