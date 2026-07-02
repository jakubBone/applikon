import type { Application } from '../../types/domain'

// The per-application company prep is stored in the existing `companyResearch` TEXT
// field (≤1000). We keep it as a JSON array so "O firmie" can hold the fixed
// "Co wiesz o nas?" question plus the user's own custom questions — the same shape
// as the global answers, but scoped to one application, with no backend change.
export const FIXED_COMPANY_KEY = 'company-knowledge'
export const MAX_COMPANY_LENGTH = 1000

export interface CompanyItem {
  label: string | null
  answer: string
  custom: boolean
}

const fixedItem = (answer = ''): CompanyItem => ({ label: null, answer, custom: false })

/** Parse `companyResearch` into items. Legacy plain-text notes (pre-JSON) become the
 *  answer to the fixed "Co wiesz o nas?" question, so nothing is lost. */
export function parseCompanyItems(raw: string | null | undefined): CompanyItem[] {
  if (!raw || !raw.trim()) return [fixedItem()]
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const items: CompanyItem[] = parsed
        .filter(x => x && typeof x === 'object' && typeof x.answer === 'string')
        .map(x => ({
          label: typeof x.label === 'string' ? x.label : null,
          answer: String(x.answer ?? ''),
          custom: !!x.custom,
        }))
      if (!items.some(i => !i.custom)) items.unshift(fixedItem())
      return items
    }
  } catch {
    // not JSON — a legacy free-text note
  }
  return [fixedItem(raw)]
}

/** Serialize back to `companyResearch`. Empty custom rows are dropped; when nothing
 *  meaningful remains it collapses to "" so the read view shows "-". */
export function serializeCompanyItems(items: CompanyItem[]): string {
  const clean = items.filter(i => (i.custom ? ((i.label ?? '').trim() !== '' || i.answer.trim() !== '') : true))
  const meaningful = clean.some(i => i.answer.trim() !== '' || (i.custom && (i.label ?? '').trim() !== ''))
  if (!meaningful) return ''
  return JSON.stringify(clean.map(i => ({ label: i.custom ? i.label : null, answer: i.answer, custom: i.custom })))
}

export const companyItemsOf = (app: Application): CompanyItem[] => parseCompanyItems(app.companyResearch)
