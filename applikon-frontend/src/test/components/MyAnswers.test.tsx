import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MyAnswers } from '../../components/answers/MyAnswers'
import type { ScreeningAnswer } from '../../types/domain'

const mockSave = vi.fn()
let mockData: ScreeningAnswer[] = []

vi.mock('../../hooks/useScreeningAnswers', () => ({
  useScreeningAnswers: () => ({ data: mockData, isLoading: false }),
  useSaveScreeningAnswers: () => ({ saveDebounced: mockSave, isPending: false, isSuccess: false }),
}))

const withContent: ScreeningAnswer[] = [
  { id: 1, questionKey: 'about-me', label: null, answer: 'Cześć', custom: false, sortOrder: 0 },
]

describe('MyAnswers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockData = []
  })

  it('shows the empty state and reveals the fixed template on action', () => {
    mockData = []
    render(<MyAnswers />)

    expect(screen.getByText('Przygotuj swoje odpowiedzi')).toBeInTheDocument()
    expect(screen.queryByText('Opowiedz coś o sobie')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Uzupełnij odpowiedzi' }))

    // All four global fixed questions become visible ("about the company" is
    // per-application, not part of the global template)
    expect(screen.getByText('Opowiedz coś o sobie')).toBeInTheDocument()
    expect(screen.getByText('Dlaczego zmieniasz pracę?')).toBeInTheDocument()
    expect(screen.getByText('Opowiedz o swoim projekcie')).toBeInTheDocument()
    expect(screen.getByText('Jakie są Twoje oczekiwania finansowe?')).toBeInTheDocument()
    expect(screen.queryByText('Co wiesz o naszej firmie?')).not.toBeInTheDocument()
  })

  it('renders the template directly when answers already exist', () => {
    mockData = withContent
    render(<MyAnswers />)
    expect(screen.queryByText('Przygotuj swoje odpowiedzi')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Cześć')).toBeInTheDocument()
  })

  it('triggers a debounced save when typing an answer', () => {
    mockData = withContent
    render(<MyAnswers />)

    const textarea = screen.getByDisplayValue('Cześć')
    fireEvent.change(textarea, { target: { value: 'Nowa odpowiedź' } })

    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(mockSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ questionKey: 'about-me', answer: 'Nowa odpowiedź', custom: false }),
      ])
    )
  })

  it('adds and removes a custom question', () => {
    mockData = withContent
    render(<MyAnswers />)

    fireEvent.click(screen.getByRole('button', { name: '+ Dodaj własne pytanie' }))
    const labelInput = screen.getByPlaceholderText('Treść Twojego pytania')
    expect(labelInput).toBeInTheDocument()

    // The save payload includes the new custom row
    expect(mockSave).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ custom: true, label: '' })])
    )

    fireEvent.click(screen.getByRole('button', { name: 'Usuń pytanie' }))
    expect(screen.queryByPlaceholderText('Treść Twojego pytania')).not.toBeInTheDocument()
  })

  it('caps an answer at 1000 chars and shows a counter', () => {
    mockData = withContent
    render(<MyAnswers />)

    const textarea = screen.getByDisplayValue('Cześć') as HTMLTextAreaElement
    expect(textarea.maxLength).toBe(1000)
    // counter for the filled field: "Cześć" = 5 chars
    expect(screen.getByText('5/1000')).toBeInTheDocument()

    fireEvent.change(textarea, { target: { value: 'a'.repeat(1500) } })
    expect(mockSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ questionKey: 'about-me', answer: 'a'.repeat(1000) }),
      ])
    )
  })
})
