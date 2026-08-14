import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { GameEntry } from '../../games/registry'
import type { GameInstance } from '../../games/shared/types'
import { scoreService } from '../../services/score'
import { pickLang, useI18n } from '../../i18n'
import { Button } from './Button'
import { SpeechBubble } from './SpeechBubble'
import { CloseIcon, InfoIcon, PauseIcon, PlayIcon, RestartIcon } from './icons'

// ============================================================
// 游戏弹窗壳层：design-language.md §15、ADR-0002
// 窗外（遮罩）/ 窗框（容器、标题栏、控制条）= 网页级规范
// 窗内（游戏区）= 游戏级规范
// 行为：单窗口互斥（由 Lobby 控制）；ESC 关闭；焦点陷阱；背景滚动锁定；
//       关闭时经 ScoreService 结算（游戏不直写存储，ADR-0005）
// ============================================================

interface GameWindowProps {
  entry: GameEntry
  onClose: () => void
}

export function GameWindow({ entry, onClose }: GameWindowProps) {
  const { lang, t } = useI18n()
  const { manifest } = entry

  const Game = useMemo(() => lazy(entry.load), [entry])

  const rootRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const instanceRef = useRef<GameInstance | null>(null)
  const startTimeRef = useRef(Date.now())

  const [score, setScore] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)
  const [initialBest] = useState(() => scoreService.best(manifest.id))

  const handleScore = useCallback((value: number) => setScore(value), [])

  const handleReady = useCallback(
    (instance: GameInstance) => {
      instanceRef.current = instance
      instance.setCallbacks({ onScore: handleScore })
      if (mountRef.current) instance.mount(mountRef.current)
      instance.start()
    },
    [handleScore],
  )

  const handleClose = useCallback(() => {
    instanceRef.current?.destroy()
    instanceRef.current = null
    if (score > 0) {
      scoreService.submit({
        gameId: manifest.id,
        score,
        durationSec: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
        date: new Date().toISOString(),
      })
    }
    onClose()
  }, [score, manifest.id, onClose])

  // ESC 关闭 + 背景滚动锁定 + 卸载清理（§15）
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
  }, [handleClose])

  // 焦点陷阱（§15 无障碍）
  const trapFocus = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const root = rootRef.current
    if (!root) return
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])'),
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  const togglePause = useCallback(() => {
    if (paused) {
      instanceRef.current?.resume()
      setPaused(false)
    } else {
      instanceRef.current?.pause()
      setPaused(true)
    }
  }, [paused])

  const handleRestart = useCallback(() => {
    instanceRef.current?.restart()
    setScore(0)
    setPaused(false)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] game-overlay flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose()
      }}
    >
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-label={pickLang(manifest.name, lang)}
        onKeyDown={trapFocus}
        className="relative comic-border bg-surface comic-shadow w-full overflow-hidden"
        style={{ maxWidth: 'min(92vw, 860px)' }}
      >
        {/* 标题栏：红底白字（同排行榜表头样式，§15） */}
        <div className="bg-primary text-on-primary border-b-4 border-ink flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-headline-md text-headline-md uppercase italic truncate">
              {pickLang(manifest.name, lang)}
            </h2>
            {manifest.howTo && (
              <Button
                variant="icon"
                aria-label={t('shell.howto')}
                onClick={() => setShowHowTo((value) => !value)}
                className="bg-surface-container-lowest text-on-surface shrink-0"
              >
                <InfoIcon />
              </Button>
            )}
          </div>
          <Button
            ref={closeBtnRef}
            variant="icon"
            aria-label={t('shell.close')}
            onClick={handleClose}
            className="bg-surface-container-lowest text-on-surface shrink-0"
          >
            <CloseIcon />
          </Button>
        </div>

        {/* 游戏区（窗内 = 游戏级规范） */}
        <div
          ref={mountRef}
          className="relative w-full bg-surface-container-low overflow-hidden"
          style={{ aspectRatio: `${manifest.aspect.width} / ${manifest.aspect.height}` }}
        >
          <Suspense
            fallback={
              <div className="absolute inset-0 flex items-center justify-center font-label-sm text-label-sm uppercase text-on-surface-variant">
                {t('shell.loading')}
              </div>
            }
          >
            <Game onReady={handleReady} />
          </Suspense>
          {showHowTo && manifest.howTo && (
            <div className="absolute left-3 top-3 z-10 pointer-events-none">
              <SpeechBubble className="font-body-md text-body-md normal-case">
                {pickLang(manifest.howTo, lang)}
              </SpeechBubble>
            </div>
          )}
        </div>

        {/* 控制条：当前分 / 最高分 / 暂停 / 重开 */}
        <div className="border-t-4 border-ink bg-surface-container-low halftone-bg flex items-center justify-between gap-3 p-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="font-label-bold text-label-bold uppercase text-on-surface-variant">
              {t('shell.score')}
            </span>
            <span className="font-headline-md text-headline-md italic">{score}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-label-bold text-label-bold uppercase text-on-surface-variant">
              {t('shell.best')}
            </span>
            <span className="font-headline-md text-headline-md italic">
              {Math.max(initialBest, score)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {manifest.supportsPause && (
              <Button
                variant="icon"
                aria-label={paused ? t('shell.resume') : t('shell.pause')}
                onClick={togglePause}
              >
                {paused ? <PlayIcon /> : <PauseIcon />}
              </Button>
            )}
            <Button variant="icon" aria-label={t('shell.restart')} onClick={handleRestart}>
              <RestartIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
