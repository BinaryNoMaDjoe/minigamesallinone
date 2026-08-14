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

import './theme/index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
