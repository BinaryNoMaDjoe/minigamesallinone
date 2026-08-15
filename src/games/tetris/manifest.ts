import type { GameManifest } from '../shared/types'
import cover from './cover.svg'
import coverPortrait from './cover-portrait.svg'

// ============================================================
// 俄罗斯方块（像素风）—— 首个正式游戏
// 游戏级规范见同目录 DESIGN.md；双语字段 zh/en 缺一不可（skills/skill-i18n.md）
// ============================================================

const manifest: GameManifest = {
  id: 'tetris',
  name: {
    zh: '俄罗斯方块',
    en: 'TETRIS',
  },
  description: {
    zh: '像素风格的经典俄罗斯方块：消除整行得分，等级越高下落越快。',
    en: 'Pixel-styled classic Tetris: clear lines to score; pieces fall faster as you level up.',
  },
  category: 'classic',
  theme: {
    // 出处：design-language.md §2.2 令牌 secondary-container（Power Blue #0072E1）
    accent: 'var(--secondary-container)',
  },
  aspect: { width: 5, height: 7 },
  supportsPause: true,
  howTo: {
    zh: '键盘：←→ 移动，↓ 软降，↑/X 旋转，空格硬降，回车（结束态）重开。触屏：使用画面下方按钮。',
    en: 'Keyboard: ←→ move, ↓ soft drop, ↑/X rotate, Space hard drop, Enter restart (when game over). Touch: use the on-screen buttons.',
  },
  cover,
  coverPortrait,
}

export default manifest
