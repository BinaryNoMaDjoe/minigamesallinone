// ============================================================
// 俄罗斯方块：方块定义、旋转、色板、等级速度表
// 唯一出处：同目录 DESIGN.md §2/§4/§6（本文件为其实施）
// ============================================================

export type PieceType = 0 | 1 | 2 | 3 | 4 | 5 | 6 // I O T S Z J L

/** 七种方块基础矩阵（1 = 实格） */
export const SHAPES: Record<PieceType, number[][]> = {
  0: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  1: [
    [1, 1],
    [1, 1],
  ],
  2: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  3: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  4: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  5: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  6: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
}

/** 顺时针旋转矩阵（转置 + 行反转） */
export function rotateCW<T>(matrix: T[][]): T[][] {
  return matrix[0].map((_, col) => matrix.map((row) => row[col]).reverse())
}

/** 方块色板（DESIGN.md §4） */
export const PIECE_COLORS: Record<PieceType, string> = {
  0: '#00d9ff', // I 霓虹青（游戏级像素画板）
  1: '#ffd700', // O Hero Yellow（design-language.md §2.1）
  2: '#a200ff', // T 像素紫（游戏级像素画板）
  3: '#00e436', // S 像素绿（游戏级像素画板）
  4: '#e62429', // Z Action Red（design-language.md §2.1）
  5: '#0074e4', // J Power Blue（design-language.md §2.1）
  6: '#f78c00', // L 像素橙（游戏级像素画板）
}

/** 界面功能色（DESIGN.md §4） */
export const PALETTE = {
  board: '#0f0e0e', // tokens.css --surface-container-lowest（暗色墨板）
  boardGrid: 'rgba(255, 255, 255, 0.05)',
  ink: '#e5e2e1', // tokens.css --on-surface（暗色值，白墨）
  text: '#f3f0ef', // tokens.css --inverse-on-surface
  ghost: 'rgba(255, 255, 255, 0.18)',
  dim: 'rgba(0, 0, 0, 0.55)',
  highlight: 'rgba(255, 255, 255, 0.25)',
  shade: 'rgba(0, 0, 0, 0.3)',
} as const

/** 等级 → 下落间隔 ms（DESIGN.md §6，等级 ≥10 取末值） */
export const GRAVITY_MS = [800, 720, 630, 550, 470, 380, 300, 220, 160, 110]

/** 一次消除 1/2/3/4 行的基础分（× 等级，DESIGN.md §2.6） */
export const LINE_SCORES = [0, 100, 300, 500, 800]
