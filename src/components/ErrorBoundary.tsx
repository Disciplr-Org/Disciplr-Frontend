import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
  referenceId: string
}

const getReferenceId = () => {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID()
  }

  return `ERR-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

const defaultReporter = (error: Error, info: ErrorInfo) => {
  console.error('[ErrorBoundary]', error, info)
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, referenceId: '' }

  static getDerivedStateFromError(error: Error): State {
    return { error, referenceId: getReferenceId() }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const report = this.props.onError ?? defaultReporter
    report(error, info)
  }

  render() {
    if (this.state.error) {
      const supportHref = `mailto:support@disciplr.app?subject=Disciplr%20error%20reference%20${encodeURIComponent(this.state.referenceId)}`

      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-4xl" aria-hidden="true">⚠️</p>
          <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
            500 error
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Something went wrong
          </h1>
          <p className="max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
            We couldn’t complete that request. Please refresh the page or contact support with the reference ID below.
          </p>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-sm">
            <div style={{ color: 'var(--text-secondary)' }}>
              Reference ID
            </div>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {this.state.referenceId || 'Unavailable'}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              className="btn-primary rounded-xl px-5 py-2 text-sm font-semibold"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
            <a
              href={supportHref}
              className="rounded-xl border border-[var(--border)] px-5 py-2 text-sm font-semibold"
              style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              Contact support
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
