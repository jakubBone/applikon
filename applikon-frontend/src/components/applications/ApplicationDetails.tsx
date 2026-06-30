import { useState, useEffect, useRef } from 'react'
import { useTranslation, type TFunction } from 'react-i18next'
import { NotesList } from '../notes/NotesList'
import { ApplicationForm } from './ApplicationForm'
import { CheatSheetModal } from './CheatSheetModal'
import { StageModal } from '../kanban/StageModal'
import { EndModal } from '../kanban/EndModal'
import { downloadCV } from '../../services/api'
import { isSafeUrl } from '../../utils/urlValidator'
import { STATUS_CONFIG } from '../../constants/applicationStatus'
import { translateStageName, STATUSES } from '../kanban/types'
import type { Application, StageUpdateRequest } from '../../types/domain'

interface Props {
  application: Application
  onBack: () => void
  onDelete: (id: number) => void
  onStageChange: (id: number, data: StageUpdateRequest) => void
  applications: Application[]
}

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CONTRACT_TYPE_KEYS: Record<string, string> = {
  B2B: 'salary.contractB2B',
  EMPLOYMENT: 'salary.contractEmployment',
  MANDATE: 'salary.contractMandate',
  OTHER: 'salary.contractOther',
}

function formatSalary(app: Application, locale: string, t: TFunction): string | null {
  if (!app.salary && !app.salaryMin) return null

  let salaryStr: string
  if (app.salary && !app.salaryMin) {
    salaryStr = app.salary.toLocaleString(locale)
  } else {
    salaryStr = app.salaryMin!.toLocaleString(locale)
    if (app.salaryMax) {
      salaryStr += ` - ${app.salaryMax.toLocaleString(locale)}`
    }
  }
  salaryStr += ` ${app.currency ?? 'PLN'}`

  const extras: string[] = []
  if (app.salaryType) extras.push(app.salaryType.toLowerCase())
  if (app.contractType) extras.push(t((CONTRACT_TYPE_KEYS[app.contractType] ?? 'salary.contractOther') as Parameters<typeof t>[0]))
  if (extras.length > 0) {
    salaryStr += ` (${extras.join(', ')})`
  }

  return salaryStr
}

export function ApplicationDetails({ application, onBack, onDelete, onStageChange, applications }: Props) {
  const { t, i18n } = useTranslation()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [endModalOpen, setEndModalOpen] = useState(false)
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentColumn = application.status === 'OFFER' || application.status === 'REJECTED'
    ? 'FINISHED'
    : application.status

  const getStatusCount = (statusId: string) => {
    if (statusId === 'FINISHED') return applications.filter(a => a.status === 'OFFER' || a.status === 'REJECTED').length
    return applications.filter(a => a.status === statusId).length
  }

  const handleMoveConfirm = () => {
    if (!selectedStatus || selectedStatus === currentColumn) { setMoveModalOpen(false); return }
    if (selectedStatus === 'IN_PROGRESS') {
      setMoveModalOpen(false)
      setStageModalOpen(true)
      return
    }
    if (selectedStatus === 'FINISHED') {
      setMoveModalOpen(false)
      setEndModalOpen(true)
      return
    }
    if (selectedStatus === 'SENT') {
      onStageChange(application.id, { status: 'SENT', currentStage: null, rejectionReason: null, rejectionDetails: null })
    }
    setMoveModalOpen(false)
  }

  const handleStageSelect = (stageName: string) => {
    onStageChange(application.id, { status: 'IN_PROGRESS', currentStage: stageName })
    setStageModalOpen(false)
  }

  const handleEndSelect = (endData: StageUpdateRequest) => {
    onStageChange(application.id, endData)
    setEndModalOpen(false)
  }

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const salary = formatSalary(application, i18n.language, t)

  return (
    <div className="details-view">
      <div className="details-nav">
        <button className="back-btn" onClick={onBack}>
          {t('details.back')}
        </button>
        <div className="details-nav-actions">
          <button className="cheat-sheet-btn" onClick={() => setCheatSheetOpen(true)}>
            {t('cheatSheet.button')}
          </button>
          <button className="change-status-btn" onClick={() => { setSelectedStatus(currentColumn); setMoveModalOpen(true) }}>
            {t('details.changeStatus')}
          </button>
        </div>
      </div>

      {cheatSheetOpen && (
        <CheatSheetModal
          application={application}
          salary={salary}
          onClose={() => setCheatSheetOpen(false)}
        />
      )}

      <div className="details-header">
        <div className="details-title">
          <div className="details-title-row">
            <h2>{application.company}</h2>
            <div className="details-menu-wrapper" ref={menuRef}>
              <button
                className="details-menu-btn"
                onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m) }}
              >⋮</button>
              {showMenu && (
                <div className="context-menu">
                  <button
                    className="context-menu-item"
                    onClick={() => { setShowMenu(false); setShowEditForm(true) }}
                  >
                    {t('details.edit')}
                  </button>
                  <button
                    className="context-menu-item danger"
                    onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                  >
                    {t('table.delete')}
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="details-position">{application.position}</p>
          <div className="status-info">
            <span
              className="status-badge large"
              style={{ backgroundColor: STATUS_CONFIG[application.status].color }}
            >
              {t(STATUS_CONFIG[application.status].labelKey)}
            </span>
            {application.currentStage && (
              <span className="current-stage-badge">{translateStageName(application.currentStage, t)}</span>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <ApplicationForm
          mode="edit"
          application={application}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {showDeleteConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>{t('table.confirmDeleteTitle')}</h3>
            <p>{t('table.confirmDeleteMsg', { count: 1 })}</p>
            <p className="confirm-warning">{t('table.confirmDeleteWarning')}</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setShowDeleteConfirm(false)}>
                {t('table.cancel')}
              </button>
              <button className="confirm-btn delete" onClick={() => { setShowDeleteConfirm(false); onDelete(application.id) }}>
                {t('table.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status change bottom sheet */}
      {moveModalOpen && (
        <div className="move-modal" onClick={() => setMoveModalOpen(false)}>
          <div className="move-modal-content" onClick={e => e.stopPropagation()}>
            <div className="move-modal-header">
              <div className="move-modal-title">{t('moveModal.title')}</div>
            </div>
            <div className="move-options">
              {STATUSES.map(status => {
                const isCurrent = status.id === currentColumn
                const isSelected = status.id === selectedStatus
                return (
                  <div
                    key={status.id}
                    className={`move-option ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                    onClick={() => !isCurrent && setSelectedStatus(status.id)}
                  >
                    <div className="move-option-radio"></div>
                    <div className="move-option-color" style={{ background: status.color }}></div>
                    <div className="move-option-text">
                      <div className="move-option-name">{t(status.labelKey)}</div>
                      <div className="move-option-count">{t('moveModal.appCount', { count: getStatusCount(status.id) })}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="move-modal-actions">
              <button className="move-modal-btn cancel" onClick={() => setMoveModalOpen(false)}>{t('moveModal.cancel')}</button>
              <button
                className="move-modal-btn confirm"
                onClick={handleMoveConfirm}
                disabled={!selectedStatus || selectedStatus === currentColumn}
              >
                {t('moveModal.move')}
              </button>
            </div>
          </div>
        </div>
      )}

      <StageModal
        isOpen={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        onSelect={handleStageSelect}
        currentStage={application.currentStage}
      />

      <EndModal
        isOpen={endModalOpen}
        onClose={() => setEndModalOpen(false)}
        onSelect={handleEndSelect}
      />

      <div className="details-grid">
        <div className="details-info">
          <h3>{t('details.infoTitle')}</h3>
          <div className="info-list">
            {salary && (
              <div className="info-item">
                <span className="label">{t('details.salary')}</span>
                <span className="value salary">{salary}</span>
              </div>
            )}
            {application.source && (
              <div className="info-item">
                <span className="label">{t('details.source')}</span>
                <span className="value">{application.source}</span>
              </div>
            )}
            <div className="info-item">
              <span className="label">{t('details.date')}</span>
              <span className="value">{formatDate(application.appliedAt, i18n.language)}</span>
            </div>
            {application.link && isSafeUrl(application.link) && (
              <div className="info-item">
                <span className="label">{t('details.link')}</span>
                <a
                  href={application.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="value link"
                >
                  {t('details.viewOffer')}
                </a>
              </div>
            )}
            {application.cvFileName && (
              <div className="info-item">
                <span className="label">{t('details.cv')}</span>
                <span className="value cv-value">
                  {application.cvFileName}
                  {application.cvType === 'FILE' && (
                    <button
                      className="cv-download-btn"
                      onClick={() => downloadCV(application.cvId!, application.cvFileName!)}
                    >
                      {t('details.download')}
                    </button>
                  )}
                  {application.cvType === 'LINK' && application.cvExternalUrl && (
                    <button
                      className="cv-download-btn cv-link-btn"
                      onClick={() => window.open(application.cvExternalUrl!, '_blank')}
                    >
                      {t('details.open')}
                    </button>
                  )}
                  {application.cvType === 'NOTE' && (
                    <span className="cv-note-hint">{t('details.local')}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {application.jobDescription && (
            <div className="job-description">
              <h4>{t('details.jobDescription')}</h4>
              <pre className="job-description-content">{application.jobDescription}</pre>
            </div>
          )}
        </div>

        <div className="details-notes">
          <NotesList applicationId={application.id} />
        </div>
      </div>
    </div>
  )
}