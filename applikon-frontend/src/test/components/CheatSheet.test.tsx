import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheatSheet } from '../../components/cheatsheet/CheatSheet'
import { useScreeningAnswers, useSaveScreeningAnswers } from '../../hooks/useScreeningAnswers'
import { useUpdateCompanyResearch } from '../../hooks/useApplications'
import type { Application } from '../../types/domain'

vi.mock('../../hooks/useScreeningAnswers')
vi.mock('../../hooks/useApplications')
// The app form is heavy and only used for salary editing — stub it out here.
vi.mock('../../components/applications/ApplicationForm', () => ({
  ApplicationForm: () => <div data-testid="app-form" />,
}))

const makeApp = (o: Partial<Application> = {}): Application =>
  ({
    id: 1,
    company: 'Acme',
    position: 'Java Dev',
    status: 'SENT',
    appliedAt: new Date().toISOString(),
    currentStage: null,
    rejectionReason: null,
    salary: 12000,
    currency: 'PLN',
    companyResearch: 'Fintech, 200 osób',
    ...o,
  }) as Application

describe('CheatSheet (Ściąga hub)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(useScreeningAnswers).mockReturnValue({ data: [] } as never)
    vi.mocked(useSaveScreeningAnswers).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
    vi.mocked(useUpdateCompanyResearch).mockReturnValue({ mutate: vi.fn(), isPending: false } as never)
  })

  it('shows a hint when there are no applications', () => {
    render(<CheatSheet applications={[]} />)
    expect(screen.getByText(/Najpierw dodaj aplikację/)).toBeInTheDocument()
  })

  it('reveals the "About the company" block when expanded', () => {
    render(<CheatSheet applications={[makeApp()]} />)
    // Bars are collapsed by default — content is hidden until the user opens them.
    expect(screen.queryByText('Twoja stawka')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /O firmie/ }))
    expect(screen.getByText('Twoja stawka')).toBeInTheDocument()
    expect(screen.getByText(/Fintech, 200 osób/)).toBeInTheDocument()
  })

  it('reveals the "General" block with the fixed questions when expanded', () => {
    render(<CheatSheet applications={[makeApp()]} />)
    fireEvent.click(screen.getByRole('button', { name: /Ogólne/ }))
    expect(screen.getByText('Opowiedz coś o sobie')).toBeInTheDocument()
  })

  it('opens the general-answers editor (modal, not inline)', () => {
    render(<CheatSheet applications={[makeApp()]} />)
    const editButtons = screen.getAllByRole('button', { name: 'Dodaj/Edytuj' })
    fireEvent.click(editButtons[editButtons.length - 1]) // the "General" section edit
    expect(screen.getByText('Ogólne pytania')).toBeInTheDocument()
  })

  it('opens the "O firmie" editor with add-question (like Ogólne)', () => {
    render(<CheatSheet applications={[makeApp()]} />)
    const editButtons = screen.getAllByRole('button', { name: 'Dodaj/Edytuj' })
    fireEvent.click(editButtons[0]) // the "O firmie" section edit
    expect(screen.getByText('Pytania o firmie')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dodaj pytanie/ })).toBeInTheDocument()
  })
})
