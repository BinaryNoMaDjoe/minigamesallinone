import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

// ============================================================
// 错误边界：渲染错误显示可读信息而非白屏
// 样式遵循 design-language.md 错误令牌（§2.2 error/error-container）
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary 捕获渲染错误:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'var(--error-container)',
          }}
        >
          <div className="comic-border bg-surface comic-shadow-red p-6 max-w-lg w-full">
            <h1 className="font-headline-md text-headline-md uppercase italic mb-3 text-error">
              出错了 / SOMETHING BROKE
            </h1>
            <p
              className="font-label-sm text-label-sm mb-4 break-all"
              style={{ color: 'var(--error)' }}
            >
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="comic-border-2 comic-shadow bg-primary text-on-primary px-6 py-2 font-label-bold text-label-bold uppercase"
            >
              刷新页面 / RELOAD
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
