import type { LocalizedText } from '../shared/types'

// ============================================================
// 游戏内文案（双语，随界面语言；skills/skill-i18n.md）
// 唯一出处：同目录 DESIGN.md §5/§7
// ============================================================

export const tetrisStrings = {
  score: { zh: '分数', en: 'SCORE' } satisfies LocalizedText,
  level: { zh: '等级', en: 'LEVEL' } satisfies LocalizedText,
  lines: { zh: '行数', en: 'LINES' } satisfies LocalizedText,
  next: { zh: '下一个', en: 'NEXT' } satisfies LocalizedText,
  paused: { zh: '已暂停', en: 'PAUSED' } satisfies LocalizedText,
  gameOver: { zh: '游戏结束', en: 'GAME OVER' } satisfies LocalizedText,
  gameOverHint: {
    zh: '按回车或点击重新开始',
    en: 'PRESS ENTER OR RESTART',
  } satisfies LocalizedText,
  moveLeft: { zh: '左移', en: 'MOVE LEFT' } satisfies LocalizedText,
  moveRight: { zh: '右移', en: 'MOVE RIGHT' } satisfies LocalizedText,
  softDrop: { zh: '软降', en: 'SOFT DROP' } satisfies LocalizedText,
  rotate: { zh: '旋转', en: 'ROTATE' } satisfies LocalizedText,
  hardDrop: { zh: '硬降', en: 'HARD DROP' } satisfies LocalizedText,
}
