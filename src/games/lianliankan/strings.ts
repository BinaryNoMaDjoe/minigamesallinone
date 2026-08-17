import type { LocalizedText } from '../shared/types'

// ============================================================
// 游戏内文案（双语，随界面语言；skills/skill-i18n.md）
// 唯一出处：同目录 DESIGN.md v0.6 §7；{n}/{name} 为模板占位
// ============================================================

export const lianliankanStrings = {
  title: { zh: '星露谷连连看', en: 'STARDEW CLICKCLICK' } satisfies LocalizedText,
  start: { zh: '开始游戏', en: 'START' } satisfies LocalizedText,
  resume: { zh: '继续', en: 'RESUME' } satisfies LocalizedText,
  restart: { zh: '重新开始', en: 'RESTART' } satisfies LocalizedText,
  endRun: { zh: '结束游戏', en: 'END GAME' } satisfies LocalizedText,
  toMenu: { zh: '返回主菜单', en: 'MAIN MENU' } satisfies LocalizedText,
  playAgain: { zh: '再来一次', en: 'PLAY AGAIN' } satisfies LocalizedText,
  retry: { zh: '重新挑战', en: 'TRY AGAIN' } satisfies LocalizedText,
  nextLevel: { zh: '下一关', en: 'NEXT LEVEL' } satisfies LocalizedText,
  best: { zh: '最高分', en: 'BEST' } satisfies LocalizedText,
  level: { zh: '关卡', en: 'LEVEL' } satisfies LocalizedText,
  time: { zh: '时间', en: 'TIME' } satisfies LocalizedText,
  score: { zh: '分数', en: 'SCORE' } satisfies LocalizedText,
  combo: { zh: '连击', en: 'COMBO' } satisfies LocalizedText,
  hint: { zh: '提示', en: 'HINT' } satisfies LocalizedText,
  shuffle: { zh: '洗牌', en: 'SHUFFLE' } satisfies LocalizedText,
  pauseAction: { zh: '暂停', en: 'PAUSE' } satisfies LocalizedText,
  paused: { zh: '已暂停', en: 'PAUSED' } satisfies LocalizedText,
  timeUp: { zh: '时间到！', en: "TIME'S UP!" } satisfies LocalizedText,
  winTitle: { zh: '通关！', en: 'ALL CLEAR!' } satisfies LocalizedText,
  levelClear: { zh: '第 {n} 关完成！', en: 'LEVEL {n} CLEAR!' } satisfies LocalizedText,
  timeBonus: { zh: '时间奖励', en: 'TIME BONUS' } satisfies LocalizedText,
  autoShuffle: { zh: '无解，自动洗牌', en: 'NO MOVES — SHUFFLED' } satisfies LocalizedText,
  chapterIntro: { zh: '第 {n} 大关 · {name}', en: 'CHAPTER {n} · {name}' } satisfies LocalizedText,
  menuHint: {
    zh: '回车 / 空格 开始 · 拐角 ≤ 2 · 共 18 关 6 大关',
    en: 'ENTER OR SPACE TO START · MAX 2 TURNS · 18 LEVELS',
  } satisfies LocalizedText,
}
