import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheatSheetModal } from '../../components/applications/CheatSheetModal'
import type { Application, ScreeningAnswer } from '../../types/domain'

const mockSave = vi.fn()
const setSearchParams = vi.fn()
let mockAnswers: ScreeningAnswer[] = []

vi.mock('../../hooks/useScreeningAnswers', () => ({
  useScreeningAnswers: () => ({ data: mockAnswers, isLoading: false }),
}))

vi.mock('../../hooks/useApplications', () => ({
  useUpdateCompanyResearch: () => ({ saveDebounced: mockSave, isPending: false, isSuccess: false }),
}))

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), setSearchParams],
}))

const baseApp = {
  id: 7,
  company: 'Acme Corp',
  companyResearch: 'SaaS, B2B, ~200 people',
} as unknown as Application

const answer = (questionKey: string, ans: string): ScreeningAnswer => ({
  id: Math.random(), questionKey, label: null, answer: ans, custom: false, sortOrder: 0,
})

describe('CheatSheetModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAnswers = []
  })

  it('composes salary, company note and answers', () => {
    mockAnswers = [answer('about-me', 'Jestem juniorem')]
    render(<CheatSheetModal application={baseApp} salary="12 000 PLN" onClose={vi.fn()} />)

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('12 000 PLN')).toBeInTheDocument()
    expect(screen.getByDisplayValue('SaaS, B2B, ~200 people')).toBeInTheDocument()
    expect(screen.getByText('Opowiedz coś o sobie')).toBeInTheDocument()
    expect(screen.getByText('Jestem juniorem')).toBeInTheDocument()
  })

  it('shows "—" when no salary is recorded', () => {
    render(<CheatSheetModal application={baseApp} salary={null} onClose={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('autosaves the company note for this application on edit', () => {
    const app = { ...baseApp, companyResearch: '' } as Application
    render(<CheatSheetModal application={app} salary="x" onClose={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Cloud-first' } })
    expect(mockSave).toHaveBeenCalledWith(7, 'Cloud-first')
  })

  it('shows the empty-answers placeholder + fill link when no answers exist', () => {
    mockAnswers = []
    render(<CheatSheetModal application={baseApp} salary="x" onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Uzupełnij odpowiedzi' })).toBeInTheDocument()
    // No global answer rows rendered
    expect(screen.queryByText('Opowiedz coś o sobie')).not.toBeInTheDocument()
  })

  it('closes on the close button and on Esc', () => {
    const onClose = vi.fn()
    render(<CheatSheetModal application={baseApp} salary="x" onClose={onClose} />)

    fireEvent.click(screen.getByLabelText('Zamknij'))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
