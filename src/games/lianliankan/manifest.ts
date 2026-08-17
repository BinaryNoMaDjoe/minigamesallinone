import type { GameManifest } from '../shared/types'
import cover from './cover.svg'
import coverPortrait from './cover-portrait.svg'

// ============================================================
// 星露谷连连看（stardew clickclick）—— 翻新版
// 游戏级规范见同目录 DESIGN.md v0.6；双语字段 zh/en 缺一不可
// ============================================================

const manifest: GameManifest = {
  id: 'lianliankan',
  name: {
    zh: '星露谷连连看',
    en: 'stardew clickclick',
  },
  description: {
    zh: '星露谷风物像素连连看：六个大关轮换春季农场、盛夏海滩、秋日森林、小镇村民、幽深矿洞与冬夜庆典，连接两个相同物品，路径不超过两个拐角，限时清空棋盘。',
    en: 'A Stardew-inspired pixel link game: six chapters rotate spring farm, summer beach, autumn forest, town folk, deep mines and winter festival themes. Connect two identical items with a path of at most two turns and clear the board in time.',
  },
  category: 'puzzle',
  theme: {
    // 出处：design-language.md §2.2 令牌 primary-fixed-dim（#FFB4AC 柔粉）
    accent: 'var(--primary-fixed-dim)',
  },
  aspect: { width: 4, height: 3 },
  supportsPause: true,
  howTo: {
    zh: '点击两个相同物品：连线拐角不超过两个即可消除。每 3 关为一大关，共 6 大关 18 关，每大关更换物品与场景。提示与洗牌每关各 3 次。',
    en: 'Tap two matching items: they vanish if the connecting path has at most two turns. Every 3 levels form a chapter — 6 chapters, 18 levels, each with its own items and scenery. 3 hints and 3 shuffles per level.',
  },
  cover,
  coverPortrait,
}

export default manifest
