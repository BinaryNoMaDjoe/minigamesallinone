import type { GameComponent, GameManifest } from './shared/types'

// ============================================================
// 游戏注册表（ADR-0001）
// 通过 import.meta.glob 自动汇总所有 src/games/<id>/ 目录，禁止人工维护。
// 新增游戏 = 只新增一个目录（manifest.ts + Game.tsx），不改本文件。
// ============================================================

const manifestModules = import.meta.glob<{ default: GameManifest }>('./*/manifest.ts', {
  eager: true,
})

const gameModules = import.meta.glob<{ default: GameComponent }>('./*/Game.tsx')

export interface GameEntry {
  manifest: GameManifest
  /** 懒加载游戏组件（React.lazy 用） */
  load: () => Promise<{ default: GameComponent }>
}

export const gameRegistry: GameEntry[] = Object.entries(manifestModules).map(([path, mod]) => {
  const id = path.split('/')[1]
  const loader = gameModules[`./${id}/Game.tsx`]
  if (!loader) {
    throw new Error(`游戏 ${id} 缺少 Game.tsx（games/${id}/Game.tsx）`)
  }
  return { manifest: mod.default, load: loader }
})
