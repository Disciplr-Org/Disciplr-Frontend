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
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Something went wrong
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            An unexpected error occurred on this page.
          </p>
          <div className="flex gap-3">
            <Link
              to="/"
              className="btn-primary rounded-xl px-5 py-2 text-sm font-semibold"
              onClick={() => this.setState({ error: null })}
            >
              Go home
            </Link>
            <button
              className="btn-secondary rounded-xl px-5 py-2 text-sm font-semibold"
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
