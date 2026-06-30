import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaleBanner } from '../../components/kanban/StaleBanner'

describe('StaleBanner', () => {
  it('shows the stale count when there is at least one', () => {
    render(<StaleBanner count={3} />)
    const banner = screen.getByRole('status')
    expect(banner).toBeInTheDocument()
    expect(banner.textContent).toContain('3')
  })

  it('renders nothing when the count is zero', () => {
    const { container } = render(<StaleBanner count={0} />)
    expect(container).toBeEmptyDOMElement()
  })
})
