import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import './ApplicationTable.css'
import { STATUS_CONFIG } from '../../constants/applicationStatus'
import type { Application } from '../../types/domain'

interface Props {
  applications: Application[]
  onRowClick: (app: Application) => void
  onStatusChange?: (id: number, status: string) => void
  onDelete: (ids: Set<number>) => void
}

const getCompanyColor = (company: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#00CED1', '#FF7F50', '#9370DB', '#20B2AA'
  ]
  let hash = 0
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const statusConfig: Record<string, { labelKey: ParseKeys<'common'>; color: string; bg: string }> = {
  ...STATUS_CONFIG,
}

function ApplicationTable({ applications, onRowClick, onDelete }: Props) {
  const { t } = useTranslation()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [sortField, setSortField] = useState('appliedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getDaysSince = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('table.today')
    if (diffDays === 1) return t('table.oneDay')
    return t('table.days', { count: diffDays })
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(applications.map(app => app.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (id: number, e: React.SyntheticEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleDeleteSelected = async () => {
    if (onDelete) {
      await onDelete(selectedIds)
      setSelectedIds(new Set())
      setShowDeleteConfirm(false)
    }
  }

  const filteredApplications = useMemo(() => applications.filter(app => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        app.company.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query) ||
        (app.source && app.source.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }
    if (statusFilter !== 'ALL' && app.status !== statusFilter) {
      return false
    }
    return true
  }), [applications, searchQuery, statusFilter])

  const sortedApplications = useMemo(() => [...filteredApplications].sort((a, b) => {
    let aVal = (a as unknown as Record<string, unknown>)[sortField]
    let bVal = (b as unknown as Record<string, unknown>)[sortField]

    if (sortField === 'salaryMin') {
      aVal = (aVal as number) || 0
      bVal = (bVal as number) || 0
    }

    if (sortField === 'appliedAt') {
      aVal = new Date(aVal as string)
      bVal = new Date(bVal as string)
    }

    if (aVal! < bVal!) return sortDirection === 'asc' ? -1 : 1
    if (aVal! > bVal!) return sortDirection === 'asc' ? 1 : -1
    return 0
  }), [filteredApplications, sortField, sortDirection])

  const statusCounts = useMemo(() => applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {}), [applications])

  const formatSalary = (app: Application): string => {
    if (!app.salary && !app.salaryMin) return '-'

    let salaryStr: string
    if (app.salary && !app.salaryMin) {
      salaryStr = app.salary.toLocaleString('pl-PL')
    } else {
      salaryStr = app.salaryMin!.toLocaleString('pl-PL')
      if (app.salaryMax) {
        salaryStr += ` - ${app.salaryMax.toLocaleString('pl-PL')}`
      }
    }
    salaryStr += ` ${app.currency || 'PLN'}`

    const extras: string[] = []
    if (app.salaryType) extras.push(app.salaryType.toLowerCase())
    if (app.contractType) {
      const contractKeys: Record<string, string> = {
        B2B: 'salary.contractB2B',
        EMPLOYMENT: 'salary.contractEmployment',
        MANDATE: 'salary.contractMandate',
        OTHER: 'salary.contractOther',
      }
      extras.push(t((contractKeys[app.contractType] ?? 'salary.contractOther') as Parameters<typeof t>[0]))
    }

    if (extras.length > 0) {
      salaryStr += ` (${extras.join(', ')})`
    }

    return salaryStr
  }

  const renderMobileCards = () => {
    if (sortedApplications.length === 0) {
      return (
        <div className="empty-table">
          {applications.length === 0
            ? t('table.empty')
            : t('table.noResults')}
        </div>
      )
    }

    return (
      <div className="mobile-card-list">
        {sortedApplications.map(app => {
          const status = statusConfig[app.status] || statusConfig['SENT']
          const companyColor = getCompanyColor(app.company)
          const isSelected = selectedIds.has(app.id)

          return (
            <div
              key={app.id}
              className={`mobile-app-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onRowClick(app)}
            >
              <div className="mobile-card-header">
                <input
                  type="checkbox"
                  className="mobile-card-checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectRow(app.id, e)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="mobile-card-main">
                  <div className="mobile-card-company-row">
                    <span className="mobile-card-initial" style={{ backgroundColor: companyColor }}>
                      {app.company.charAt(0).toUpperCase()}
                    </span>
                    <span className="mobile-card-company">{app.company}</span>
                  </div>
                  <div className="mobile-card-position">{app.position}</div>
                </div>
              </div>

              <div className="mobile-card-details">
                {(app.salary || app.salaryMin) && (
                  <div className="mobile-card-detail-row">
                    <span className="mobile-card-detail-icon">💰</span>
                    <span className="mobile-card-detail-value salary">{formatSalary(app)}</span>
                  </div>
                )}
                {app.source && (
                  <div className="mobile-card-detail-row">
                    <span className="mobile-card-detail-icon">🔗</span>
                    <span className="mobile-card-detail-value">{app.source}</span>
                  </div>
                )}
              </div>

              <div className="mobile-card-footer">
                <span className="mobile-card-date">
                  {formatDate(app.appliedAt)} • {getDaysSince(app.appliedAt)}
                </span>
                <span
                  className="mobile-card-status"
                  style={{ backgroundColor: status.bg, color: status.color, borderColor: status.color }}
                >
                  {t(status.labelKey)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('table.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        <div className="status-filters">
          <button
            className={`status-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            {t('table.filterAll', { count: applications.length })}
          </button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = statusCounts[key] || 0
            if (count === 0) return null
            return (
              <button
                key={key}
                className={`status-filter-btn ${statusFilter === key ? 'active' : ''}`}
                onClick={() => setStatusFilter(key)}
                style={{ '--status-color': config.color } as React.CSSProperties}
              >
                {t(config.labelKey)} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {filteredApplications.length !== applications.length && (
        <div className="filter-info">
          {t('table.showing', { shown: filteredApplications.length, total: applications.length })}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="selection-bar">
          <span className="selection-info">
            {t('table.selectedCount', { count: selectedIds.size })}
          </span>
          <div className="selection-actions">
            <button className="action-btn delete-btn" onClick={() => setShowDeleteConfirm(true)}>
              {t('table.deleteSelected')}
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>{t('table.confirmDeleteTitle')}</h3>
            <p>{t('table.confirmDeleteMsg', { count: selectedIds.size })}</p>
            <p className="confirm-warning">{t('table.confirmDeleteWarning')}</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setShowDeleteConfirm(false)}>
                {t('table.cancel')}
              </button>
              <button className="confirm-btn delete" onClick={handleDeleteSelected}>
                {t('table.delete')}
              </button>
            </div>
          </div>
        </div>
      )}


      {!isMobile && (
        <>
          <table className="app-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.size === applications.length && applications.length > 0}
                  />
                </th>
                <th className="sortable" onClick={() => handleSort('company')}>
                  <span className="th-content">
                    <span className="th-icon">🏢</span>
                    {t('table.colCompany')}
                    {sortField === 'company' && <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('position')}>
                  <span className="th-content">
                    <span className="th-icon">💼</span>
                    {t('table.colPosition')}
                    {sortField === 'position' && <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
                <th className="sortable" onClick={() => handleSort('salaryMin')}>
                  <span className="th-content">
                    <span className="th-icon">💰</span>
                    {t('table.colSalary')}
                    {sortField === 'salaryMin' && <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
                <th>
                  <span className="th-content"><span className="th-icon">🔗</span>{t('table.colSource')}</span>
                </th>
                <th className="sortable" onClick={() => handleSort('appliedAt')}>
                  <span className="th-content">
                    <span className="th-icon">📅</span>
                    {t('table.colDate')}
                    {sortField === 'appliedAt' && <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
                <th>
                  <span className="th-content"><span className="th-icon">⏱️</span>{t('table.colDays')}</span>
                </th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  <span className="th-content">
                    <span className="th-icon">📊</span>
                    {t('table.colStatus')}
                    {sortField === 'status' && <span className="sort-arrow">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedApplications.map(app => {
                const status = statusConfig[app.status] || statusConfig['SENT']
                const companyColor = getCompanyColor(app.company)

                return (
                  <tr
                    key={app.id}
                    className={selectedIds.has(app.id) ? 'selected' : ''}
                    onClick={() => onRowClick(app)}
                  >
                    <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={(e) => handleSelectRow(app.id, e)}
                      />
                    </td>
                    <td className="company-col">
                      <div className="company-cell">
                        <span className="company-initial" style={{ backgroundColor: companyColor }}>
                          {app.company.charAt(0).toUpperCase()}
                        </span>
                        <span className="company-name">{app.company}</span>
                      </div>
                    </td>
                    <td className="position-col">{app.position}</td>
                    <td className="salary-col">
                      <span className="salary-value">{formatSalary(app)}</span>
                    </td>
                    <td className="source-col">
                      {app.source
                        ? <span className="source-link">{app.source}</span>
                        : <span className="no-source">-</span>}
                    </td>
                    <td className="date-col">
                      <span className="date-value">{formatDate(app.appliedAt)}</span>
                    </td>
                    <td className="days-col">
                      <span className="days-value">{getDaysSince(app.appliedAt)}</span>
                    </td>
                    <td className="status-col">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: status.bg, color: status.color, borderColor: status.color }}
                      >
                        {t(status.labelKey)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {sortedApplications.length === 0 && (
            <div className="empty-table">
              {applications.length === 0
                ? t('table.empty')
                : t('table.noResults')}
            </div>
          )}
        </>
      )}

      {isMobile && renderMobileCards()}

    </div>
  )
}

export default ApplicationTable
