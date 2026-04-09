import { StrictMode, Component, ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; errorInfo: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null, errorInfo: '' }
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo: errorInfo.componentStack })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#fee', color: '#c00', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ color: '#c00', marginBottom: 12 }}>React Crash</h2>
          <p><strong>Error:</strong> {this.state.error.message}</p>
          <p><strong>Stack:</strong> {this.state.error.stack}</p>
          <p><strong>ComponentStack:</strong> {this.state.errorInfo}</p>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
