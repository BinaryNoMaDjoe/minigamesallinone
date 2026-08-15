import type { LocalizedText } from '../shared/types'

// ============================================================
// 游戏内文案（双语，随界面语言；skills/skill-i18n.md）
// 唯一出处：同目录 DESIGN.md v0.3 §7
// ============================================================

export const tetrisStrings = {
  title: { zh: '俄罗斯方块', en: 'TETRIS' } satisfies LocalizedText,
  score: { zh: '分数', en: 'SCORE' } satisfies LocalizedText,
  level: { zh: '等级', en: 'LEVEL' } satisfies LocalizedText,
  lines: { zh: '行数', en: 'LINES' } satisfies LocalizedText,
  next: { zh: '下一个', en: 'NEXT' } satisfies LocalizedText,
  best: { zh: '最高分', en: 'BEST' } satisfies LocalizedText,
  paused: { zh: '已暂停', en: 'PAUSED' } satisfies LocalizedText,
  gameOver: { zh: '游戏结束', en: 'GAME OVER' } satisfies LocalizedText,
  start: { zh: '开始游戏', en: 'START' } satisfies LocalizedText,
  resume: { zh: '继续', en: 'RESUME' } satisfies LocalizedText,
  restart: { zh: '重新开始', en: 'RESTART' } satisfies LocalizedText,
  endRun: { zh: '结束游戏', en: 'END GAME' } satisfies LocalizedText,
  toMenu: { zh: '返回主菜单', en: 'MAIN MENU' } satisfies LocalizedText,
  playAgain: { zh: '再来一局', en: 'PLAY AGAIN' } satisfies LocalizedText,
  menuHint: { zh: '回车 / 空格 开始', en: 'PRESS ENTER OR SPACE' } satisfies LocalizedText,
  moveLeft: { zh: '左移', en: 'MOVE LEFT' } satisfies LocalizedText,
  moveRight: { zh: '右移', en: 'MOVE RIGHT' } satisfies LocalizedText,
  softDrop: { zh: '软降', en: 'SOFT DROP' } satisfies LocalizedText,
  rotate: { zh: '旋转', en: 'ROTATE' } satisfies LocalizedText,
  hardDrop: { zh: '硬降', en: 'HARD DROP' } satisfies LocalizedText,
  pauseAction: { zh: '暂停', en: 'PAUSE' } satisfies LocalizedText,
  hintMove: { zh: '←→ 移动', en: '←→ MOVE' } satisfies LocalizedText,
  hintRotate: { zh: '↑ 旋转', en: '↑ ROTATE' } satisfies LocalizedText,
  hintDrop: { zh: '空格 硬降', en: 'SPACE DROP' } satisfies LocalizedText,
  hintPause: { zh: 'P 暂停', en: 'P PAUSE' } satisfies LocalizedText,
}
