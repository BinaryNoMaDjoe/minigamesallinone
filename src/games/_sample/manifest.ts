import type { GameManifest } from '../shared/types'

// ============================================================
// 示例占位游戏（决策记录 #11）
// 用途：验证 注册表 → 弹窗 → 游戏循环 → 计分上报 → 暂停/重启/销毁 全链路
// 内容保持"空"：无真实玩法设计，后续替换或删除
// 双语字段纪律：zh/en 缺一不可（skills/skill-i18n.md）
// ============================================================

const manifest: GameManifest = {
  id: 'sample',
  name: {
    zh: '示例 · 点击方块',
    en: 'SAMPLE · CLICK THE SQUARE',
  },
  description: {
    zh: '占位示例游戏：点击移动的方块得分，用于验证注册表、弹窗与计分链路。',
    en: 'Placeholder sample game: click the moving square to score. Validates the registry, game window and scoring pipeline.',
  },
  category: 'arcade',
  theme: {
    // 出处：design-language.md §2.2 令牌 primary-container（#E62429）
    accent: 'var(--primary-container)',
  },
  aspect: { width: 4, height: 3 },
  supportsPause: true,
  howTo: {
    zh: '点击方块得分，每击中一次它会加速。',
    en: 'Click the square to score. It speeds up with every hit.',
  },
}

export default manifest
