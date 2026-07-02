import { useState, type ReactNode } from 'react'
import './prep.css'

interface Props {
  title: string
  /** Emoji / node shown before the title, tinted with `accent`. */
  icon?: ReactNode
  /** Accent colour for the icon + left border, so sections are distinguishable. */
  accent?: string
  /** Optional control rendered on the right of the header (e.g. an "Edit" link).
   *  Lives outside the toggle button, so clicking it never toggles the section. */
  action?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

/** Accordion section (chevron + icon + title) used to declutter prep surfaces. */
export function CollapsibleSection({ title, icon, accent, action, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="collapsible" style={accent ? { borderLeftColor: accent } : undefined}>
      <div className="collapsible-head">
        <button
          type="button"
          className="collapsible-toggle"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          <span className="collapsible-chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
          {icon && <span className="collapsible-icon" style={accent ? { color: accent } : undefined} aria-hidden="true">{icon}</span>}
          <span className="collapsible-title">{title}</span>
        </button>
        {action && <div className="collapsible-action">{action}</div>}
      </div>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  )
}

export default CollapsibleSection
