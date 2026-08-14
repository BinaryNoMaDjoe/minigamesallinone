import type { GameEntry } from '../../games/registry'
import type { GameCategory } from '../../games/shared/types'
import { pickLang, useI18n } from '../../i18n'
import type { MessageKey } from '../../i18n'
import { Button } from './Button'
import { useReveal } from './useReveal'

// ============================================================
// 卡片规范：design-language.md §8.2（Pop-out Card）
// 4px 墨线 + 6px 硬阴影 + hover 上浮 2px；图区底部 4px 分隔线；文字区半调网点
// 装饰标签（分类）：Hero Yellow 底 + 墨线 + -12° 旋转
// ============================================================

const categoryKey: Record<GameCategory, MessageKey> = {
  classic: 'category.classic',
  arcade: 'category.arcade',
  puzzle: 'category.puzzle',
  other: 'category.other',
}

interface GameCardProps {
  entry: GameEntry
  onPlay: (gameId: string) => void
  /** 滚动入场级联延迟（§9 生长 v0.3） */
  revealDelay?: number
}

export function GameCard({ entry, onPlay, revealDelay = 0 }: GameCardProps) {
  const { lang, t } = useI18n()
  const { manifest } = entry
  const revealRef = useReveal<HTMLElement>(revealDelay)

  return (
    <article
      ref={revealRef}
      className="relative comic-border bg-surface comic-shadow group hover:-translate-y-2 transition-transform duration-300"
    >
      {/* 图区（占位：半调网点 + 游戏名首字；封面美术由游戏级规范产出后替换） */}
      <div className="h-40 overflow-hidden relative bg-surface-container-high halftone-bg border-4 border-ink border-t-0 border-l-0 border-r-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display-lg text-display-lg italic text-on-surface-variant opacity-40 select-none">
            {pickLang(manifest.name, lang).slice(0, 1)}
          </span>
        </div>
      </div>

      {/* 文字区 */}
      <div className="p-6 halftone-bg">
        <h3 className="font-headline-md text-headline-md uppercase italic mb-2">
          {pickLang(manifest.name, lang)}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4 bg-surface p-2 comic-border-2">
          {pickLang(manifest.description, lang)}
        </p>
        <Button variant="secondary" onClick={() => onPlay(manifest.id)}>
          {t('lobby.play')}
        </Button>
      </div>

      {/* 装饰标签（分类） */}
      <div className="absolute -top-3 -left-3 bg-tertiary text-on-tertiary comic-border px-2 py-1 font-label-bold text-label-bold uppercase -rotate-12">
        {t(categoryKey[manifest.category])}
      </div>
    </article>
  )
}
