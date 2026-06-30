import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useScreeningAnswers, useSaveScreeningAnswers } from '../../hooks/useScreeningAnswers'
import { createTestQueryClient } from '../test-utils'

vi.mock('../../services/api', () => ({
  fetchScreeningAnswers: vi.fn(),
  saveScreeningAnswers: vi.fn(),
}))

import * as api from '../../services/api'

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const request = [{ questionKey: 'about-me', label: null, answer: 'Hi', custom: false }]

describe('useScreeningAnswers', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('fetches the current user answers', async () => {
    const answers = [{ id: 1, questionKey: 'about-me', label: null, answer: 'Hi', custom: false, sortOrder: 0 }]
    vi.mocked(api.fetchScreeningAnswers).mockResolvedValue(answers as never)

    const { result } = renderHook(() => useScreeningAnswers(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(answers)
  })
})

describe('useSaveScreeningAnswers (debounced autosave)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => { vi.useRealTimers() })

  it('collapses rapid calls into a single save', async () => {
    vi.mocked(api.saveScreeningAnswers).mockResolvedValue([] as never)

    const { result } = renderHook(() => useSaveScreeningAnswers(), { wrapper: createWrapper() })

    act(() => {
      result.current.saveDebounced(request)
      result.current.saveDebounced(request)
      result.current.saveDebounced(request)
    })
    expect(api.saveScreeningAnswers).not.toHaveBeenCalled()

    await act(async () => { await vi.advanceTimersByTimeAsync(800) })
    expect(api.saveScreeningAnswers).toHaveBeenCalledTimes(1)
    expect(api.saveScreeningAnswers).toHaveBeenCalledWith(request)
  })
})
