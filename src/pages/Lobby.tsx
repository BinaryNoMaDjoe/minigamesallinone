import { useState } from 'react'
import { gameRegistry } from '../games/registry'
import { pickLang, useI18n } from '../i18n'
import { Button } from '../components/ui/Button'
import { GameCard } from '../components/ui/GameCard'
import { GameWindow } from '../components/ui/GameWindow'
import { Leaderboard } from '../components/ui/Leaderboard'
import { SpeechBubble } from '../components/ui/SpeechBubble'
import { MoonIcon, SunIcon } from '../components/ui/icons'
import { useReveal } from '../components/ui/useReveal'
import { isDark, toggleTheme } from '../theme/theme'

// ============================================================
// 大厅页：顶部导航 §8.3、Hero 区 §8.4、游戏卡片墙、排行榜 §8.5、页脚 §8.9
// 游戏弹窗互斥：同一时间只允许一个游戏窗口（§15）
// ============================================================

const panelConfigs = [
  {
    rot: '-rotate-12',
    shadow: 'comic-shadow',
    pos: 'top-10 left-0 w-64 h-96',
    z: 'z-10',
    strip: 'bg-surface text-on-surface',
  },
  {
    rot: 'rotate-6',
    shadow: 'comic-shadow-red',
    pos: 'top-0 left-1/4 w-80 h-[450px]',
    z: 'z-30',
    strip: 'bg-primary text-on-primary',
  },
  {
    rot: 'rotate-12',
    shadow: 'comic-shadow',
    pos: 'top-20 right-0 w-64 h-96',
    z: 'z-20',
    strip: 'bg-surface text-on-surface',
  },
]

export function Lobby() {
  const { lang, setLang, t } = useI18n()
  const [activeGameId, setActiveGameId] = useState<string | null>(null)
  const [dark, setDark] = useState(isDark())
  const [scoresRefresh, setScoresRefresh] = useState(0)
  const gamesHeaderRef = useReveal<HTMLDivElement>()
  const footerRef = useReveal<HTMLDivElement>()

  const activeEntry = gameRegistry.find((entry) => entry.manifest.id === activeGameId) ?? null

  const scrollToGames = () => {
    document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })
  }

  const heroPanels = gameRegistry.slice(0, 3)

  return (
    <div className="min-h-dvh flex flex-col">
      {/* —— 顶部导航（§8.3）—— */}
      <header className="sticky top-0 z-50 bg-surface border-b-4 border-ink comic-shadow-red">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col min-w-0">
            <a
              href="#"
              className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg italic font-black text-primary uppercase tracking-tighter leading-none truncate"
            >
              {t('common.appName')}
            </a>
            <span className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant">
              {t('common.publisher')}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Button
              variant="icon"
              aria-label="切换语言 / Switch language"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="font-label-bold text-label-bold uppercase"
            >
              {lang === 'zh' ? 'EN' : '中'}
            </Button>
            <Button
              variant="icon"
              aria-label="切换明暗主题 / Toggle theme"
              onClick={() => setDark(toggleTheme())}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button className="hidden sm:inline-flex" onClick={scrollToGames}>
              {t('lobby.cta')}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* —— Hero 区（§8.4）—— */}
        <section className="relative w-full min-h-[80svh] flex items-center justify-center overflow-hidden border-b-4 border-ink px-margin-mobile md:px-margin-desktop py-12">
          <div className="absolute inset-0 speed-lines opacity-50 z-0 pointer-events-none" />
          <div
            className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-primary blur-3xl z-0 pointer-events-none"
            style={{ opacity: 'var(--glow-opacity)' }}
          />
          <div
            className="absolute -left-20 bottom-0 w-80 h-80 rounded-full bg-secondary blur-3xl z-0 pointer-events-none"
            style={{ opacity: 'var(--glow-opacity)' }}
          />

          <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
            <div className="md:col-span-5 flex flex-col items-start gap-6">
              <SpeechBubble className="-rotate-2 font-label-bold text-label-bold text-primary">
                {t('lobby.bubble')}
              </SpeechBubble>
              <h1
                className="font-headline-lg-mobile text-headline-lg-mobile sm:font-headline-lg sm:text-headline-lg lg:font-display-lg lg:text-display-lg uppercase italic text-on-surface"
                style={{ textShadow: '4px 4px 0 var(--shadow-red)' }}
              >
                {t('lobby.heroTitleA')}
                <br />
                <span className="text-primary">{t('lobby.heroTitleB')}</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md border-l-4 border-primary pl-4 py-2 bg-surface-container-low">
                {t('lobby.heroBody')}
              </p>
              <Button
                className="px-10 py-4 font-headline-md text-headline-md"
                onClick={scrollToGames}
              >
                {t('lobby.cta')}
              </Button>

              {/* 移动端单张倾斜面板（§4.3：md 以下隐藏多面板拼贴，改单张） */}
              {heroPanels.length > 0 && (
                <div className="md:hidden self-center mt-2 relative">
                  <div className="rotate-3 comic-border bg-surface comic-shadow-red w-40 h-52 overflow-hidden">
                    {heroPanels[0].manifest.cover ? (
                      <img
                        src={heroPanels[0].manifest.cover}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full halftone-bg bg-surface-container-high flex items-center justify-center">
                        <span className="font-display-lg text-display-lg italic text-on-surface-variant opacity-30 select-none">
                          {pickLang(heroPanels[0].manifest.name, lang).slice(0, 1)}
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-0 w-full bg-primary text-on-primary border-t-4 border-ink p-2 font-headline-md text-headline-md text-center italic uppercase">
                      {pickLang(heroPanels[0].manifest.name, lang)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 面板拼贴（占位：注册表驱动的分镜面板，封面美术后续替换） */}
            <div className="md:col-span-7 relative h-[480px] w-full mt-12 md:mt-0 hidden md:block">
              {heroPanels.map((entry, index) => {
                const configIndex = heroPanels.length === 1 ? 1 : index
                const cfg = panelConfigs[configIndex]
                return (
                  <div
                    key={entry.manifest.id}
                    className={`absolute ${cfg.pos} ${cfg.rot} comic-border bg-surface ${cfg.shadow} ${cfg.z} overflow-hidden`}
                  >
                    {entry.manifest.cover ? (
                      <img
                        src={entry.manifest.cover}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full halftone-bg bg-surface-container-high flex items-center justify-center">
                        <span className="font-display-lg text-display-lg italic text-on-surface-variant opacity-30 select-none">
                          {pickLang(entry.manifest.name, lang).slice(0, 1)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`absolute bottom-0 w-full ${cfg.strip} border-t-4 border-ink p-2 font-headline-md text-headline-md text-center italic uppercase`}
                    >
                      {pickLang(entry.manifest.name, lang)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* —— 游戏选择 + 排行榜 —— */}
        <section
          id="games"
          className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20 grid grid-cols-1 lg:grid-cols-12 gap-gutter"
        >
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div ref={gamesHeaderRef} className="flex items-center gap-4">
              <SpeechBubble className="-rotate-3 font-headline-lg text-headline-lg italic text-secondary">
                {t('lobby.gamesBubble')}
              </SpeechBubble>
              <h2 className="font-headline-lg text-headline-lg uppercase italic border-b-4 border-ink flex-grow">
                {t('lobby.gamesTitle')}
              </h2>
            </div>

            {gameRegistry.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t('lobby.empty')}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
                {gameRegistry.map((entry, index) => (
                  <GameCard
                    key={entry.manifest.id}
                    entry={entry}
                    onPlay={setActiveGameId}
                    revealDelay={index * 80}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <Leaderboard refreshKey={scoresRefresh} />
          </div>
        </section>
      </main>

      {/* —— 页脚（§8.9）—— */}
      <footer className="bg-surface-container-highest border-t-4 border-ink">
        <div className="halftone-bg">
          <div
            ref={footerRef}
            className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-8 max-w-7xl mx-auto gap-6"
          >
            <div className="text-center md:text-left">
              <div className="font-headline-md text-headline-md font-black text-on-surface uppercase italic tracking-tighter">
                {t('common.appName')}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant tracking-widest mt-1">
                minigamesallinone.binarynomad.io
              </div>
            </div>
            <div className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant text-center max-w-sm flex flex-col gap-1">
              <span>{t('footer.copyright')}</span>
              <span>{t('footer.license')}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* —— 游戏弹窗（§15，单窗口互斥）—— */}
      {activeEntry && (
        <GameWindow
          key={activeEntry.manifest.id}
          entry={activeEntry}
          onClose={() => {
            setActiveGameId(null)
            setScoresRefresh((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}
