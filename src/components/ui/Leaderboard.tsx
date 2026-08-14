import { useMemo } from 'react'
import { gameRegistry } from '../../games/registry'
import { scoreService } from '../../services/score'
import { pickLang, useI18n } from '../../i18n'
import { TrophyIcon } from './icons'

// ============================================================
// 排行榜规范：design-language.md §8.5
// 红底表头 + 半调列表；第 1 名 Hero Yellow 底 + 红色硬阴影 + 上移 1px
// 数据：本地最高分（ScoreService），无账号体系（决策记录 #2：先纯本地）
// ============================================================

interface LeaderboardProps {
  /** 变化时重新读取本地数据（如游戏窗口关闭后） */
  refreshKey?: number
}

export function Leaderboard({ refreshKey = 0 }: LeaderboardProps) {
  const { lang, t } = useI18n()

  const rows = useMemo(() => {
    // refreshKey 本身不参与计算，仅作为"游戏窗口关闭后重读本地数据"的触发器
    void refreshKey
    return gameRegistry
      .map((entry) => ({
        name: pickLang(entry.manifest.name, lang),
        best: scoreService.best(entry.manifest.id),
      }))
      .filter((row) => row.best > 0)
      .sort((a, b) => b.best - a.best)
      .slice(0, 5)
  }, [refreshKey, lang])

  return (
    <div className="comic-border bg-surface comic-shadow p-1">
      {/* 表头 */}
      <div className="bg-primary text-on-primary p-4 border-b-4 border-ink flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md uppercase italic">
          {t('lobby.leaderboardTitle')}
        </h2>
        <TrophyIcon className="w-8 h-8" />
      </div>

      {/* 列表 */}
      <div className="p-4 bg-surface-container-low halftone-bg flex flex-col gap-3 relative overflow-hidden">
        <span className="absolute -right-6 top-10 font-display-lg text-display-lg text-surface-dim opacity-20 italic pointer-events-none select-none">
          #1
        </span>

        {rows.length === 0 ? (
          <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
            {t('lobby.noScores')}
          </p>
        ) : (
          rows.map((row, index) => {
            const isFirst = index === 0
            const isMinor = index > 2
            return (
              <div
                key={row.name}
                className={`relative z-10 flex items-center justify-between ${
                  isFirst
                    ? 'bg-tertiary text-on-tertiary comic-border p-3 comic-shadow-red -translate-y-1'
                    : `bg-surface comic-border p-2 hover:bg-surface-variant transition-colors ${
                        isMinor ? 'opacity-80' : ''
                      }`
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`italic w-8 text-center ${
                      isFirst
                        ? 'font-headline-md text-headline-md'
                        : 'font-headline-md text-headline-md text-surface-variant'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={
                      isFirst || !isMinor
                        ? 'font-label-bold text-label-bold uppercase'
                        : 'font-body-md text-body-md uppercase'
                    }
                  >
                    {row.name}
                  </span>
                </div>
                <span
                  className={
                    isFirst || !isMinor
                      ? 'font-headline-md text-headline-md'
                      : 'font-body-md text-body-md'
                  }
                >
                  {row.best}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
