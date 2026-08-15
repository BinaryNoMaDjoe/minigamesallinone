// ============================================================
// 连连看：16×16 像素精灵系统（星露谷式，唯一出处 DESIGN.md v0.2 §4）
// 字符表：'.'空 'K'描边 'M'主色 'H'高光 'S'阴影 'E'面部 'B'腮红
// 几何图形由光栅化生成：圆/方/菱形用解析式，三角/五边/六边/星用射线法多边形
// ============================================================
import type { ShapeIndex } from './shapes'

export const SPRITE_SIZE = 16
export type Sprite = string[][]

export interface SpritePalette {
  outline: string
  main: string
  light: string
  dark: string
  face: string
  blush: string
}

export const SPRITE_PALETTES: Record<ShapeIndex, SpritePalette> = {
  0: {
    outline: '#5a2e24',
    main: '#e05b4d',
    light: '#f08a70',
    dark: '#b23a30',
    face: '#3a2418',
    blush: '#f2a3c4',
  },
  1: {
    outline: '#24395e',
    main: '#4f7dd9',
    light: '#7ba3ea',
    dark: '#35599e',
    face: '#1b2b45',
    blush: '#f2a3c4',
  },
  2: {
    outline: '#24471e',
    main: '#58a04e',
    light: '#7cbf6f',
    dark: '#3c7634',
    face: '#1c3517',
    blush: '#f2a3c4',
  },
  3: {
    outline: '#3b2655',
    main: '#8b5fbf',
    light: '#ab85d6',
    dark: '#64408f',
    face: '#2c1c40',
    blush: '#f2a3c4',
  },
  4: {
    outline: '#6e4a14',
    main: '#e0a33c',
    light: '#f0c76b',
    dark: '#b87b24',
    face: '#52360e',
    blush: '#f2a3c4',
  },
  5: {
    outline: '#174a46',
    main: '#3fa8a0',
    light: '#6cc4bd',
    dark: '#2a7a74',
    face: '#12342f',
    blush: '#f2a3c4',
  },
  6: {
    outline: '#6e2c4a',
    main: '#e874a8',
    light: '#f2a3c4',
    dark: '#b84d7e',
    face: '#52203a',
    blush: '#f7c4d8',
  },
}

const C = SPRITE_SIZE / 2 - 0.5 // 7.5

function pointInPoly(px: number, py: number, vertices: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i]
    const [xj, yj] = vertices[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function polygon(
  n: number,
  cx: number,
  cy: number,
  r: number,
  rot = -Math.PI / 2,
): [number, number][] {
  const vertices: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = rot + (i * Math.PI * 2) / n
    vertices.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return vertices
}

function insideOf(shape: ShapeIndex, x: number, y: number): boolean {
  switch (shape) {
    case 0:
      return (x - C) ** 2 + (y - C) ** 2 <= 6.4 ** 2
    case 1:
      return x >= 2.5 && x <= 13.5 && y >= 2.5 && y <= 13.5
    case 2:
      return pointInPoly(x, y, [
        [C, 2],
        [1.5, 13.5],
        [13.5, 13.5],
      ])
    case 3:
      return Math.abs(x - C) + Math.abs(y - C) <= 6.5
    case 4:
      return pointInPoly(x, y, polygon(5, C, 8, 6.4))
    case 5:
      return pointInPoly(x, y, polygon(6, C, C, 6.6, 0))
    case 6: {
      const vertices: [number, number][] = []
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 6.9 : 3.0
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        vertices.push([C + Math.cos(a) * r, C + Math.sin(a) * r])
      }
      return pointInPoly(x, y, vertices)
    }
  }
}

function rasterize(shape: ShapeIndex): Sprite {
  const grid: Sprite = Array.from({ length: SPRITE_SIZE }, () =>
    Array<string>(SPRITE_SIZE).fill('.'),
  )
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if (insideOf(shape, x + 0.5, y + 0.5)) grid[y][x] = 'M'
    }
  }
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if (grid[y][x] !== 'M') continue
      if (
        dirs.some(([dx, dy]) => {
          const nx = x + dx
          const ny = y + dy
          return nx < 0 || nx >= SPRITE_SIZE || ny < 0 || ny >= SPRITE_SIZE || grid[ny][nx] === '.'
        })
      ) {
        grid[y][x] = 'K'
      }
    }
  }
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if (grid[y][x] !== 'M') continue
      if (x <= 6 && y <= 6) grid[y][x] = 'H'
      else if (x >= 8 && y >= 8) grid[y][x] = 'S'
    }
  }
  return grid
}

/** 脸部像素（只落在图形内部；眼/腮红/嘴） */
const FACE_PIXELS: [number, number, string][] = [
  [5, 6, 'E'],
  [10, 6, 'E'],
  [4, 9, 'B'],
  [11, 9, 'B'],
  [7, 10, 'E'],
  [8, 10, 'E'],
]

const cache = new Map<ShapeIndex, Sprite>()

export function getSprite(shape: ShapeIndex): Sprite {
  const cached = cache.get(shape)
  if (cached) return cached
  const sprite = rasterize(shape)
  for (const [x, y, ch] of FACE_PIXELS) {
    if (sprite[y][x] !== '.') sprite[y][x] = ch
  }
  cache.set(shape, sprite)
  return sprite
}
