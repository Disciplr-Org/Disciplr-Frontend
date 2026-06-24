import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Text } from './Text';

export type ErrorBoundaryReporter = (error: Error, errorInfo: ErrorInfo) => void;

interface ErrorBoundaryProps {
  children: ReactNode;
  reporter?: ErrorBoundaryReporter;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const defaultReporter: ErrorBoundaryReporter = (error, errorInfo) => {
  console.error('Uncaught render error', error, errorInfo);
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const reporter = this.props.reporter ?? defaultReporter;
    reporter(error, errorInfo);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <section
        role="alert"
        aria-live="assertive"
        className="m-6 p-6 border rounded-lg shadow-sm"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      >
        <Text role="display" as="h1" style={{ marginBottom: '0.75rem' }}>
          Something went wrong
        </Text>
        <Text role="body" as="p" style={{ color: 'var(--muted)', maxWidth: 560 }}>
          The page hit an unexpected rendering error. You can retry the current
          view or return home.
        </Text>
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={this.reset}
            className="px-4 py-2 rounded font-medium"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: '1px solid var(--accent)',
            }}
          >
            Try again
          </button>
          <Link
            to="/"
            className="px-4 py-2 rounded font-medium"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
            }}
          >
            Go Home
          </Link>
        </div>
      </section>
    );
  }
}
