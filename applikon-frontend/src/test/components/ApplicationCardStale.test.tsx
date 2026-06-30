import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { ApplicationCard } from '../../components/kanban/ApplicationCard'
import type { Application } from '../../types/domain'

const DAY = 86_400_000

const makeApp = (overrides: Partial<Application>): Application =>
  ({
    id: 42,
    company: 'Acme',
    position: 'Dev',
    status: 'SENT',
    appliedAt: new Date(Date.now() - 100 * DAY).toISOString(),
    currentStage: null,
    rejectionReason: null,
    ...overrides,
  }) as Application

const renderCard = (app: Application, onStageChange = vi.fn()) => {
  render(
    <DndContext>
      <ApplicationCard
        application={app}
        isDragging={false}
        onClick={vi.fn()}
        onStageChange={onStageChange}
        onLongPress={vi.fn()}
      />
    </DndContext>
  )
  return onStageChange
}

describe('ApplicationCard — stale archive', () => {
  it('archives a stale card as REJECTED / NO_RESPONSE in one click', () => {
    const onStageChange = renderCard(makeApp({}))

    fireEvent.click(screen.getByRole('button', { name: 'Archiwizuj' }))

    expect(onStageChange).toHaveBeenCalledWith(42, {
      status: 'REJECTED',
      rejectionReason: 'NO_RESPONSE',
    })
  })

  it('shows no archive action on a fresh SENT card', () => {
    renderCard(makeApp({ appliedAt: new Date(Date.now() - 5 * DAY).toISOString() }))
    expect(screen.queryByRole('button', { name: 'Archiwizuj' })).not.toBeInTheDocument()
  })
})
