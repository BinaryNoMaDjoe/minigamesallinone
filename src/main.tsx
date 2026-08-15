import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 字体自托管（决策记录 #8）：design-language.md §3.1 三字体，按 §3.2 字阶所需字重引入
import '@fontsource/anybody/800.css'
import '@fontsource/anybody/900.css'
import '@fontsource/anybody/800-italic.css'
import '@fontsource/anybody/900-italic.css'
import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/500.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
// 游戏级像素字体（决策 #26 配套；游戏窗内 HUD/菜单使用）
import '@fontsource/press-start-2p/400.css'

import './theme/index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

// 全局致命错误提示：非渲染错误（事件处理器/异步）也显示可读信息而非白屏
function showFatalOverlay(message: string) {
  let el = document.getElementById('fatal-overlay')
  if (!el) {
    el = document.createElement('div')
    el.id = 'fatal-overlay'
    el.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:9999;' +
      'background:#ba1a1a;color:#fff;padding:10px 16px;' +
      'font:700 13px/1.5 "Space Grotesk",monospace;white-space:pre-wrap;'
    document.body.appendChild(el)
  }
  el.textContent = `⚠ 出错了 / ERROR: ${message}`
}

window.addEventListener('error', (event) => showFatalOverlay(event.message))
window.addEventListener('unhandledrejection', (event) => showFatalOverlay(String(event.reason)))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
