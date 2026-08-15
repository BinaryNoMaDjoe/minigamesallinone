// ============================================================
// 连连看：二次元画板 → 星露谷式像素画板（DESIGN.md v0.2 §4）
// ============================================================

/** 七种几何图形索引 */
export type ShapeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** 星露谷式像素画板（唯一出处：同目录 DESIGN.md v0.2 §4） */
export const LLK_PALETTE = {
  sky: '#8ecbeb',
  cloud: '#fdfefe',
  grass: '#7fb069',
  grassDark: '#5f8a4e',
  frame: '#7a4a2a',
  panel: '#d8b078',
  panelDark: '#c8a05f',
  panelLine: 'rgba(122, 74, 42, 0.25)',
  line: '#ffd83d',
  select: '#ffd83d',
  hint: '#fdfefe',
  timeWarn: '#e63946',
  sparkle: '#fdfefe',
  uiBg: '#f4e4c1',
  uiBorder: '#5a4632',
  uiShadow: '#3a2c1a',
  text: '#3a2c1a',
  overlay: 'rgba(58, 44, 26, 0.5)',
  toastBg: '#fff6e0',
} as const
