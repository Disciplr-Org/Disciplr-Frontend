import type { ReactNode } from 'react'

// Locked (enterprise-gated) previews are decorative only: hidden from assistive
// technology and made inert so nothing inside can be focused or activated.
// React 18 has no typed `inert` prop, so it is applied via the ref.
function markInert(el: HTMLDivElement | null) {
  el?.setAttribute('inert', '')
}

export function Card({
  children,
  className = '',
  locked = false,
}: {
  children: ReactNode
  className?: string
  locked?: boolean
}) {
  return (
    <div
      aria-hidden={locked || undefined}
      ref={locked ? markInert : undefined}
      data-locked={locked || undefined}
      className={`analytics-card${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="analytics-section-title">{children}</h2>
}

export function ChartTitle({ children }: { children: ReactNode }) {
  return <h3 className="analytics-chart-title">{children}</h3>
}

export function ChartSummary({ children }: { children: ReactNode }) {
  return <p className="sr-only">{children}</p>
}
