import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#050508',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.9)', fontFamily: 'Nunito, sans-serif',
        }}>
          <img src="/IDLE.gif" alt="Mike" style={{ width: 120, height: 120, marginBottom: 24 }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24, maxWidth: 400, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: '#c28fe7', color: 'white', border: 'none',
              padding: '12px 32px', borderRadius: 14, fontSize: 15,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Go Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
