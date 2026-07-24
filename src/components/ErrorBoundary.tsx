import { Component, ErrorInfo, ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

const defaultReporter = (error: Error, info: ErrorInfo) => {
  console.error('[ErrorBoundary]', error, info)
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const report = this.props.onError ?? defaultReporter
    report(error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center"
        >
          <p className="text-4xl" aria-hidden="true">⚠️</p>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Something went wrong
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            An unexpected error occurred on this page.
          </p>
          <div className="flex gap-3">
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-xl)',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'var(--accent)',
                color: 'white',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--accent-dim)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--accent)'
              }}
              onClick={() => this.setState({ error: null })}
            >
              Go home
            </Link>
            <button
              style={{
                borderRadius: 'var(--radius-xl)',
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--hover)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              }}
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
