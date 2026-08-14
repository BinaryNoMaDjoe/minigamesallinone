import { I18nProvider } from './i18n'
import { Lobby } from './pages/Lobby'

export default function App() {
  return (
    <I18nProvider>
      <Lobby />
    </I18nProvider>
  )
}
