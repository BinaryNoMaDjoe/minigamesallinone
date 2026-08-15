import type { ComponentType } from 'react'

// ============================================================
// 游戏契约（ADR-0001/0002）
// manifest 是壳层认识游戏的唯一接口；游戏不依赖壳层（architecture §3）
// ============================================================

export interface LocalizedText {
  zh: string
  en: string
}

/** 游戏分类（初版字段；新增分类需走规范生长流程） */
export type GameCategory = 'classic' | 'arcade' | 'puzzle' | 'other'

export interface GameManifest {
  /** kebab-case 唯一 id，等于目录名 */
  id: string
  name: LocalizedText
  description: LocalizedText
  category: GameCategory
  theme: {
    /** 强调色：必须来自 design-language.md 令牌或用户确认值（AGENTS.md 红线 3） */
    accent: string
  }
  /** 游戏画布比例，弹窗按此 letterbox 适配 */
  aspect: { width: number; height: number }
  supportsPause: boolean
  /** 玩法说明（显示于 GameWindow 气泡） */
  howTo?: LocalizedText
}

/** 游戏内部阶段（决策 #24、ADR-0007） */
export type GamePhase = 'menu' | 'playing' | 'paused' | 'over'

export interface GameCallbacks {
  /** 游戏分数变化时上报（游戏不直接写存储，由壳层统一提交 ScoreService） */
  onScore(score: number): void
  /** 阶段变化通知（可选：未实现的游戏视为常驻 playing，壳层保持旧行为） */
  onPhase?(phase: GamePhase): void
}

export interface GameInstance {
  /** 把游戏根元素挂载到指定容器 */
  mount(el: HTMLElement): void
  start(): void
  pause(): void
  resume(): void
  restart(): void
  /** 卸载并释放全部资源（rAF/定时器/事件监听） */
  destroy(): void
  setCallbacks(callbacks: GameCallbacks): void
}

export type GameComponent = ComponentType<{ onReady: (instance: GameInstance) => void }>
