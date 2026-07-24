import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

function BrokenChild() {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders a distinct 500 error state with reference id and support link', () => {
    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>,
    )

    expect(screen.getByText('500 error')).toBeInTheDocument()
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

    const referenceIdNode = screen.getByText(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    expect(referenceIdNode).toBeInTheDocument()

    const supportLink = screen.getByRole('link', { name: /contact support/i })
    expect(supportLink).toHaveAttribute('href', expect.stringContaining('mailto:support@disciplr.app'))
  })
})
