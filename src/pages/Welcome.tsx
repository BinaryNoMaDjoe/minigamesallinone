import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'
import { Button } from '../components/ui/Button'

// ============================================================
// 欢迎页：design-language.md §8.10（生长 v0.3）
// 字标两行：MINIGAMES / ALL IN ONE + by BinaryNomad
// 动效：主标上移入场 + 红色硬投影"砸纸"落定 → 出品行微缩放回正 → ENTER 淡入
// 交互：点击任意处或 ENTER 按钮进入大厅（整页淡出 ≤200ms）
// ============================================================

interface WelcomeProps {
  leaving: boolean
  onEnter: () => void
}

export function Welcome({ leaving, onEnter }: WelcomeProps) {
  const { t } = useI18n()
  const enterRef = useRef<HTMLButtonElement>(null)

  // 动画结束后让 ENTER 按钮获得焦点（无障碍；reduced-motion 下立即聚焦）
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => enterRef.current?.focus(), reduced ? 0 : 1100)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <section
      aria-label={t('welcome.page')}
      onClick={onEnter}
      className={`fixed inset-0 z-[70] bg-surface overflow-hidden flex flex-col items-center justify-center px-margin-mobile text-center cursor-pointer select-none ${
        leaving ? 'welcome-leaving' : ''
      }`}
    >
      {/* 背景：速度线 + 红蓝角光晕（§8.10） */}
      <div className="absolute inset-0 speed-lines opacity-40 z-0 pointer-events-none" />
      <div
        className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-primary blur-3xl z-0 pointer-events-none"
        style={{ opacity: 'var(--glow-opacity)' }}
      />
      <div
        className="absolute -left-20 bottom-0 w-80 h-80 rounded-full bg-secondary blur-3xl z-0 pointer-events-none"
        style={{ opacity: 'var(--glow-opacity)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile sm:font-headline-lg sm:text-headline-lg lg:font-display-lg lg:text-display-lg uppercase italic font-black leading-none">
          <span className="block text-on-surface welcome-line-1">MINIGAMES</span>
          <span className="block text-primary welcome-line-2">ALL IN ONE</span>
        </h1>
        <div className="welcome-by">
          <span className="font-label-bold text-label-bold uppercase tracking-widest text-on-surface-variant">
            by BinaryNomad
          </span>
        </div>
        <div className="welcome-enter mt-4">
          <Button
            ref={enterRef}
            className="px-10 py-4 font-headline-md text-headline-md"
            onClick={onEnter}
          >
            {t('welcome.enter')}
          </Button>
        </div>
      </div>
    </section>
  )
}
