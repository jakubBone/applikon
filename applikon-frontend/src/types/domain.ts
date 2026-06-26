// ============================================================
// Applikon domain types — mirror backend response shapes
// ============================================================

export type ApplicationStatus = 'SENT' | 'IN_PROGRESS' | 'OFFER' | 'REJECTED'

export type ContractType = 'B2B' | 'EMPLOYMENT' | 'MANDATE' | 'OTHER'

export type SalaryType = 'GROSS' | 'NET'

export type Currency = 'PLN' | 'EUR' | 'USD' | 'GBP'

export type RejectionReason = 'NO_RESPONSE' | 'EMAIL_REJECTION' | 'REJECTED_AFTER_INTERVIEW' | 'OTHER'

export type CVType = 'FILE' | 'LINK' | 'NOTE'

export type NoteCategory = 'QUESTIONS' | 'FEEDBACK' | 'OTHER'

// ============================================================
// Encje
// ============================================================

export interface Application {
  id: number
  company: string
  position: string
  status: ApplicationStatus
  currentStage: string | null
  salary: number | null
  salaryMin: number | null
  salaryMax: number | null
  currency: Currency | null
  salaryType: SalaryType | null
  contractType: ContractType | null
  source: string | null
  link: string | null
  jobDescription: string | null
  rejectionReason: RejectionReason | null
  appliedAt: string
  cvId: number | null
  cvFileName: string | null
  cvType: CVType | null
  cvExternalUrl: string | null
}

export interface Note {
  id: number
  content: string
  category: NoteCategory
  applicationId: number
  createdAt: string
}

export interface CV {
  id: number
  fileName: string | null
  originalFileName: string | null
  fileSize: number | null
  uploadedAt: string | null
  type: CVType
  externalUrl: string | null
}

export interface User {
  id: string
  email: string
  name: string
  privacyPolicyAcceptedAt: string | null
}

// ============================================================
// Request types (request bodies)
// ============================================================

export interface ApplicationRequest {
  company: string
  position: string
  salary?: number | null
  salaryMin?: number | null
  salaryMax?: number | null
  currency?: Currency | null
  salaryType?: SalaryType | null
  contractType?: ContractType | null
  source?: string | null
  link?: string | null
  jobDescription?: string | null
}

export interface StageUpdateRequest {
  status?: ApplicationStatus | null
  currentStage?: string | null
  rejectionReason?: string | null
  rejectionDetails?: string | null
}

// ============================================================
// Service notices
// ============================================================

export interface ServiceNotice {
  id: number
  type: 'BANNER' | 'MODAL'
  messagePl: string
  messageEn: string
  expiresAt: string | null
}

// ============================================================
// Badge / statystyki
// ============================================================

// Mirrors BadgeResponse.java from the backend
export interface BadgeInfo {
  name: string
  icon: string
  description: string
  threshold: number
  currentCount: number
  nextThreshold: number | null
  nextBadgeName: string | null
}

// Mirrors BadgeStatsResponse.java from the backend
export interface BadgeStats {
  rejectionBadge: BadgeInfo | null
  ghostingBadge: BadgeInfo | null
  totalRejections: number
  totalGhosting: number
  totalOffers: number
  sweetRevengeUnlocked: boolean
}
