import type { GameManifest } from '../shared/types'
import cover from './cover.svg'

// ============================================================
// 连连看（星露谷式像素风）—— 第二个正式游戏
// 游戏级规范见同目录 DESIGN.md；双语字段 zh/en 缺一不可
// ============================================================

const manifest: GameManifest = {
  id: 'lianliankan',
  name: {
    zh: '连连看',
    en: 'LIANLIANKAN',
  },
  description: {
    zh: '星露谷式像素风的几何连连看：连接两个相同图形，路径不超过两个拐角，限时清空棋盘过关。',
    en: 'Stardew-style pixel-art link game: connect two matching shapes with a path of at most two turns, and clear the board before time runs out.',
  },
  category: 'puzzle',
  theme: {
    // 出处：design-language.md §2.2 令牌 primary-fixed-dim（#FFB4AC 柔粉，贴合二次元画板）
    accent: 'var(--primary-fixed-dim)',
  },
  aspect: { width: 4, height: 3 },
  supportsPause: true,
  howTo: {
    zh: '点击两个相同图形：连线拐角不超过两个即可消除。限时内清空棋盘过关，提示与洗牌每关各 3 次。',
    en: 'Tap two matching shapes: they vanish if the connecting path has at most two turns. Clear the board before time runs out. 3 hints and 3 shuffles per level.',
  },
  cover,
}

export default manifest
