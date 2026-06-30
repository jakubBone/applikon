import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isStale } from '../../utils/stale'
import type { Application } from '../../types/domain'

const NOW = new Date('2026-06-30T12:00:00Z').getTime()
const DAY = 86_400_000

const app = (partial: Partial<Application>): Application =>
  ({ id: 1, status: 'SENT', appliedAt: new Date(NOW).toISOString(), ...partial }) as Application

describe('isStale', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
  afterEach(() => { vi.useRealTimers() })

  it('is NOT stale at exactly 60 days', () => {
    expect(isStale(app({ appliedAt: new Date(NOW - 60 * DAY).toISOString() }))).toBe(false)
  })

  it('is stale just over 60 days', () => {
    expect(isStale(app({ appliedAt: new Date(NOW - 60 * DAY - 1000).toISOString() }))).toBe(true)
  })

  it('is not stale at 59 days', () => {
    expect(isStale(app({ appliedAt: new Date(NOW - 59 * DAY).toISOString() }))).toBe(false)
  })

  it('non-SENT is never stale, regardless of age', () => {
    const old = new Date(NOW - 200 * DAY).toISOString()
    expect(isStale(app({ status: 'IN_PROGRESS', appliedAt: old }))).toBe(false)
    expect(isStale(app({ status: 'REJECTED', appliedAt: old }))).toBe(false)
    expect(isStale(app({ status: 'OFFER', appliedAt: old }))).toBe(false)
  })
})
