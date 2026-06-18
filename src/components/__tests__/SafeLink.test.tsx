import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SafeLink } from '../SafeLink'

describe('SafeLink', () => {
  it('renders safe evidence URLs as external anchors', () => {
    render(<SafeLink href="https://example.com/evidence">View proof</SafeLink>)

    const link = screen.getByRole('link', { name: 'View proof' })
    expect(link).toHaveAttribute('href', 'https://example.com/evidence')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders unsafe evidence URLs as inert rejected text', () => {
    render(<SafeLink href="javascript:alert(1)">View proof</SafeLink>)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('View proof')).toBeInTheDocument()
    expect(screen.getByText('Rejected unsafe evidence URL')).toBeInTheDocument()
  })
})
