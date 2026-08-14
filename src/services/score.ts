// ============================================================
// ScoreService（ADR-0005）
// 游戏只经本接口读写分数数据；禁止游戏直写 localStorage（AGENTS.md 红线）
// 未来接后端 = 新增 HTTP 实现替换本实现，游戏代码零改动
// ============================================================

export interface ScoreRecord {
  /** 游戏 id（对应 src/games/<id>/） */
  gameId: string
  score: number
  durationSec: number
  /** ISO 日期字符串 */
  date: string
}

export interface ScoreService {
  /** 上报一局成绩（同时更新该游戏最高分与最近记录） */
  submit(record: ScoreRecord): void
  /** 查询某游戏历史最高分（无记录返回 0） */
  best(gameId: string): number
  /** 最近游玩记录（按时间倒序） */
  recent(limit?: number): ScoreRecord[]
  /** 清空全部本地数据（调试用） */
  clear(): void
}

const BEST_PREFIX = 'mgaio:best:'
const RECENT_KEY = 'mgaio:recent'
const MAX_RECENT = 50

function readNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    const value = raw === null ? 0 : Number(raw)
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

function readRecent(): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ScoreRecord[]) : []
  } catch {
    return []
  }
}

export const scoreService: ScoreService = {
  submit(record) {
    try {
      const previousBest = readNumber(BEST_PREFIX + record.gameId)
      if (record.score > previousBest) {
        localStorage.setItem(BEST_PREFIX + record.gameId, String(record.score))
      }
      const recent = [record, ...readRecent()].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
    } catch {
      /* 存储不可用时静默降级为"本次会话有效" */
    }
  },

  best(gameId) {
    return readNumber(BEST_PREFIX + gameId)
  },

  recent(limit = 10) {
    return readRecent().slice(0, limit)
  },

  clear() {
    try {
      for (const gameId of readRecent().map((r) => r.gameId)) {
        localStorage.removeItem(BEST_PREFIX + gameId)
      }
      localStorage.removeItem(RECENT_KEY)
    } catch {
      /* 存储不可用 */
    }
  },
}
