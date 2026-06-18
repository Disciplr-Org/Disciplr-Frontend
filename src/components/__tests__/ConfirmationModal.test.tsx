import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmationModal } from '../ConfirmationModal'

vi.mock('focus-trap-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const noop = vi.fn()

describe('ConfirmationModal evidence links', () => {
  it('renders safe evidence URLs as external links', () => {
    render(
      <ConfirmationModal
        isOpen
        onClose={noop}
        onConfirm={noop}
        evidenceUrl="https://example.com/evidence"
      />
    )

    const link = screen.getByRole('link', { name: /View submitted proof/i })
    expect(link).toHaveAttribute('href', 'https://example.com/evidence')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders unsafe evidence URLs as rejected text', () => {
    render(
      <ConfirmationModal
        isOpen
        onClose={noop}
        onConfirm={noop}
        evidenceUrl="data:text/html,<script>alert(1)</script>"
      />
    )

    expect(screen.queryByRole('link', { name: /View submitted proof/i })).not.toBeInTheDocument()
    expect(screen.getByText('Rejected unsafe evidence URL')).toBeInTheDocument()
  })
})
