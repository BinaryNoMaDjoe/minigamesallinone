// ============================================================
// 连连看：图形配置与二次元色板（唯一出处：同目录 DESIGN.md §4）
// ============================================================

/** 七种几何图形索引 */
export type ShapeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const SHAPE_COLORS: Record<ShapeIndex, string> = {
  0: '#ff9db5', // 圆 柔粉
  1: '#7ec8ff', // 方 天蓝
  2: '#8fe3a8', // 三角 薄荷
  3: '#c5a3ff', // 菱形 薰衣草
  4: '#ffe27a', // 五边形 柠檬
  5: '#ffb98a', // 六边形 蜜桃
  6: '#ff8ab5', // 星形 玫瑰
}

/** 二次元画板（DESIGN.md §4） */
export const LLK_PALETTE = {
  bgTop: '#fff3f6',
  bgBottom: '#e8f6ff',
  card: '#fffdfd',
  cardShadow: 'rgba(255, 150, 180, 0.35)',
  face: '#5b5566',
  blush: 'rgba(255, 140, 170, 0.45)',
  select: '#ff6b9d',
  hint: '#ffc93c',
  timeWarn: '#e63946',
  overlay: 'rgba(91, 85, 102, 0.45)',
  text: '#5b5566',
} as const
