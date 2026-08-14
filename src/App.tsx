import { useEffect, useState } from 'react'
import { I18nProvider } from './i18n'
import { Lobby } from './pages/Lobby'
import { Welcome } from './pages/Welcome'
import { RevealProvider } from './components/ui/useReveal'

// 欢迎页状态机：show（播放动效）→ leaving（淡出 200ms）→ gone（卸载）
// Lobby 始终挂载于底层（状态不丢）；RevealProvider.ready 在欢迎页开始退出时放行滚动入场动效
export default function App() {
  const [welcomePhase, setWelcomePhase] = useState<'show' | 'leaving' | 'gone'>('show')

  const enter = () => {
    setWelcomePhase((phase) => (phase === 'show' ? 'leaving' : phase))
  }

  useEffect(() => {
    if (welcomePhase !== 'leaving') return
    const timer = window.setTimeout(() => setWelcomePhase('gone'), 200)
    return () => window.clearTimeout(timer)
  }, [welcomePhase])

  return (
    <I18nProvider>
      <RevealProvider ready={welcomePhase !== 'show'}>
        <Lobby />
        {welcomePhase !== 'gone' && (
          <Welcome leaving={welcomePhase === 'leaving'} onEnter={enter} />
        )}
      </RevealProvider>
    </I18nProvider>
  )
}
