// ============================================================
// ProgressService（游戏进度与成就，ADR-0005 同类本地服务）
// 游戏只经本接口读写进度数据；禁止游戏直写 localStorage（AGENTS.md 红线）
// 未来接后端 = 新增 HTTP 实现替换本实现，游戏代码零改动
// 成就 id 由游戏自行定义（字符串，语义由游戏 strings 解释）
// ============================================================

export interface ProgressService {
  /** 成就是否已解锁 */
  isUnlocked(achievementId: string): boolean
  /** 解锁成就；已解锁返回 false（幂等） */
  unlock(achievementId: string): boolean
  /** 全部已解锁成就 id 列表 */
  unlockedAll(): string[]
  /** 累计击杀数（跨局） */
  totalKills(): number
  /** 累加击杀数（跨局，批量提交） */
  addKills(count: number): void
  /** 清空全部进度（调试用） */
  clear(): void
}

const KEY = 'mgaio:progress'

interface ProgressState {
  unlocked: string[]
  totalKills: number
}

function readState(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { unlocked: [], totalKills: 0 }
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const p = parsed as Partial<ProgressState>
      return {
        unlocked: Array.isArray(p.unlocked) ? p.unlocked.filter((x) => typeof x === 'string') : [],
        totalKills:
          typeof p.totalKills === 'number' && Number.isFinite(p.totalKills) ? p.totalKills : 0,
      }
    }
    return { unlocked: [], totalKills: 0 }
  } catch {
    return { unlocked: [], totalKills: 0 }
  }
}

function writeState(state: ProgressState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 存储不可用时静默降级为"本次会话有效" */
  }
}

export const progressService: ProgressService = {
  isUnlocked(achievementId) {
    return readState().unlocked.includes(achievementId)
  },

  unlock(achievementId) {
    const state = readState()
    if (state.unlocked.includes(achievementId)) return false
    state.unlocked.push(achievementId)
    writeState(state)
    return true
  },

  unlockedAll() {
    return readState().unlocked
  },

  totalKills() {
    return readState().totalKills
  },

  addKills(count) {
    if (count <= 0) return
    const state = readState()
    state.totalKills += count
    writeState(state)
  },

  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* 存储不可用 */
    }
  },
}
