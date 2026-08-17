// ============================================================
// 星露谷连连看：16×16 像素精灵图鉴（唯一出处 DESIGN.md v0.6 §4.2）
// 字符表：'.'空 'K'描边 'M'主色 'H'高光 'S'阴影 'E'面部 'B'腮红 'A'辅色 'L'辅亮
// 构图方式：矩形/圆盘图元 + 描边光栅化 + 左上明暗 + 脸部贴片。
// 全部为按星露谷风格原创绘制的像素画（非官方游戏素材），版权声明见 DESIGN.md §1。
// ============================================================

export const SPRITE_SIZE = 16
export type Sprite = string[][]

export interface SpritePalette {
  outline: string
  main: string
  light: string
  dark: string
  face: string
  blush: string
  accent: string
  accentLight: string
}

export const SPRITE_COUNT = 36

/* —— 图元 —— */

type P = [number, number]
type Grid = string[][]

function blank(): Grid {
  return Array.from({ length: SPRITE_SIZE }, () => Array<string>(SPRITE_SIZE).fill('.'))
}

function put(g: Grid, ch: string, cells: P[]) {
  for (const [x, y] of cells) {
    if (x >= 0 && x < SPRITE_SIZE && y >= 0 && y < SPRITE_SIZE) g[y][x] = ch
  }
}

function rect(g: Grid, x: number, y: number, w: number, h: number, ch: string) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && xx < SPRITE_SIZE && yy >= 0 && yy < SPRITE_SIZE) g[yy][xx] = ch
    }
  }
}

function disc(g: Grid, cx: number, cy: number, r: number, ch: string) {
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) g[y][x] = ch
    }
  }
}

function ellipse(g: Grid, cx: number, cy: number, rx: number, ry: number, ch: string) {
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) g[y][x] = ch
    }
  }
}

/* —— 后处理：描边 → 明暗 → 脸部 —— */

interface FaceOpts {
  eyes?: P[]
  blush?: P[]
  mouth?: P[]
}

const DEFAULT_EYES: P[] = [
  [5, 7],
  [6, 7],
  [9, 7],
  [10, 7],
]
const DEFAULT_BLUSH: P[] = [
  [4, 9],
  [11, 9],
]
const DEFAULT_MOUTH: P[] = [
  [7, 10],
  [8, 10],
]

function build(paint: (g: Grid) => void, opts: FaceOpts = {}): Sprite {
  const g = blank()
  paint(g)

  // 1) 描边：任何紧邻空白/边缘的填充格转为 K
  const dirs: P[] = [
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
      if (g[y][x] === '.') continue
      const border = dirs.some(([dx, dy]) => {
        const nx = x + dx
        const ny = y + dy
        return nx < 0 || nx >= SPRITE_SIZE || ny < 0 || ny >= SPRITE_SIZE || g[ny][nx] === '.'
      })
      if (border) g[y][x] = 'K'
    }
  }

  // 2) 明暗：以填充区包围盒中心为界，左上亮 / 右下暗（M→H/S，A→L/A）
  let minX = SPRITE_SIZE
  let maxX = -1
  let minY = SPRITE_SIZE
  let maxY = -1
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if (g[y][x] === '.') continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      const ch = g[y][x]
      const light = x <= cx && y <= cy
      if (ch === 'M') g[y][x] = light ? 'H' : 'S'
      else if (ch === 'A') g[y][x] = light ? 'L' : 'A'
    }
  }

  // 3) 脸部（只落于已填充格，保证不画到图形外）
  for (const [x, y] of opts.eyes ?? DEFAULT_EYES) {
    if (g[y][x] !== '.') g[y][x] = 'E'
  }
  for (const [x, y] of opts.blush ?? DEFAULT_BLUSH) {
    if (g[y][x] !== '.') g[y][x] = 'B'
  }
  for (const [x, y] of opts.mouth ?? DEFAULT_MOUTH) {
    if (g[y][x] !== '.') g[y][x] = 'E'
  }
  return g
}

/* —— 36 精灵构图（§4.2 图鉴顺序） —— */

const PAINTERS: ((g: Grid) => void)[] = [
  // 0 防风草 parsnip（大关 1）
  (g) => {
    disc(g, 7.5, 10, 4.2, 'M')
    rect(g, 3, 2, 3, 6, 'A')
    rect(g, 6, 1, 4, 7, 'A')
    rect(g, 10, 2, 3, 6, 'A')
  },
  // 1 草莓 strawberry
  (g) => {
    disc(g, 7.5, 8.5, 5.2, 'M')
    rect(g, 4, 2, 8, 2, 'A')
    rect(g, 5, 1, 6, 1, 'A')
    put(g, 'H', [
      [4, 9],
      [11, 8],
      [6, 12],
      [9, 6],
      [7, 5],
    ])
  },
  // 2 鸡蛋 egg
  (g) => {
    ellipse(g, 7.5, 8.5, 4.8, 5.8, 'M')
    put(g, 'A', [
      [6, 6],
      [9, 10],
      [10, 11],
    ])
  },
  // 3 喷壶 watering can
  (g) => {
    rect(g, 3, 8, 8, 6, 'M')
    rect(g, 4, 3, 6, 2, 'A')
    rect(g, 4, 5, 2, 3, 'A')
    rect(g, 9, 5, 2, 3, 'A')
    rect(g, 11, 5, 2, 1, 'A')
    rect(g, 11, 6, 2, 3, 'A')
  },
  // 4 小鸡 chick
  (g) => {
    disc(g, 7.5, 10, 4.5, 'M')
    disc(g, 7.5, 6, 3.5, 'M')
    rect(g, 8, 6, 4, 2, 'A')
    rect(g, 4, 14, 2, 1, 'A')
    rect(g, 9, 14, 2, 1, 'A')
    rect(g, 2, 9, 3, 3, 'S')
  },
  // 5 橡树 oak tree
  (g) => {
    disc(g, 7.5, 5, 4.8, 'M')
    disc(g, 4, 7.5, 3.5, 'M')
    disc(g, 11, 7.5, 3.5, 'M')
    rect(g, 6, 10, 4, 6, 'A')
  },
  // 6 鱼 fish（大关 2）
  (g) => {
    ellipse(g, 7.5, 7.5, 5.2, 4, 'M')
    rect(g, 0, 6, 4, 3, 'A')
    rect(g, 6, 2, 3, 2, 'A')
    rect(g, 7, 9, 3, 1, 'A')
    put(g, 'H', [
      [6, 5],
      [7, 5],
    ])
  },
  // 7 螃蟹 crab
  (g) => {
    disc(g, 7.5, 8.5, 3.9, 'M')
    rect(g, 3, 1, 3, 3, 'M')
    rect(g, 10, 1, 3, 3, 'M')
    rect(g, 4, 4, 1, 1, 'A')
    rect(g, 11, 4, 1, 1, 'A')
    disc(g, 1.5, 7.5, 1.8, 'A')
    disc(g, 13.5, 7.5, 1.8, 'A')
    put(g, 'A', [
      [2, 11],
      [3, 11],
      [5, 12],
      [6, 12],
      [9, 12],
      [10, 12],
      [12, 11],
      [13, 11],
    ])
  },
  // 8 扇贝 scallop
  (g) => {
    disc(g, 7.5, 10, 5.5, 'M')
    rect(g, 6, 2, 4, 3, 'A')
    rect(g, 4, 6, 1, 6, 'S')
    rect(g, 11, 6, 1, 6, 'S')
  },
  // 9 鱿鱼 squid
  (g) => {
    disc(g, 7.5, 5, 3.8, 'M')
    rect(g, 3, 5, 9, 4, 'M')
    rect(g, 1, 5, 2, 2, 'A')
    rect(g, 12, 5, 2, 2, 'A')
    rect(g, 3, 9, 2, 4, 'A')
    rect(g, 5, 10, 2, 4, 'A')
    rect(g, 7, 10, 2, 4, 'A')
    rect(g, 9, 10, 2, 4, 'A')
    rect(g, 11, 9, 2, 4, 'A')
  },
  // 10 海草 seaweed
  (g) => {
    rect(g, 2, 4, 2, 11, 'M')
    rect(g, 5, 2, 4, 12, 'M')
    rect(g, 10, 4, 2, 11, 'M')
  },
  // 11 海星 starfish
  (g) => {
    disc(g, 7.5, 8.5, 3.2, 'M')
    disc(g, 7.5, 4, 2.2, 'M')
    disc(g, 2.5, 7.5, 2.2, 'M')
    disc(g, 12.5, 7.5, 2.2, 'M')
    disc(g, 5, 13, 2.2, 'M')
    disc(g, 10, 13, 2.2, 'M')
    put(g, 'H', [
      [7, 4],
      [2, 7],
      [12, 7],
      [5, 13],
      [10, 13],
    ])
  },
  // 12 南瓜 pumpkin（大关 3）
  (g) => {
    disc(g, 7.5, 9.5, 5.3, 'M')
    rect(g, 7, 3, 2, 3, 'A')
    rect(g, 5, 6, 1, 7, 'S')
    rect(g, 9, 6, 1, 7, 'S')
  },
  // 13 蘑菇 mushroom
  (g) => {
    disc(g, 7.5, 5.5, 5.5, 'M')
    rect(g, 6, 9, 4, 6, 'A')
    put(g, 'A', [
      [4, 4],
      [11, 4],
      [7, 2],
    ])
  },
  // 14 玉米 corn
  (g) => {
    rect(g, 4, 4, 8, 10, 'M')
    rect(g, 2, 4, 3, 10, 'A')
    rect(g, 11, 4, 3, 10, 'A')
    rect(g, 4, 2, 8, 2, 'A')
    put(g, 'H', [
      [5, 7],
      [10, 8],
      [7, 10],
      [9, 12],
      [6, 5],
    ])
  },
  // 15 苹果 apple
  (g) => {
    disc(g, 7.5, 9, 5, 'M')
    rect(g, 7, 3, 3, 2, 'A')
    rect(g, 8, 5, 1, 1, 'A')
    put(g, 'H', [
      [5, 6],
      [6, 6],
    ])
  },
  // 16 榛子 hazelnut
  (g) => {
    disc(g, 7.5, 9.5, 4.6, 'M')
    rect(g, 4, 4, 7, 3, 'A')
  },
  // 17 枫叶 maple leaf
  (g) => {
    rect(g, 6, 5, 4, 6, 'M')
    rect(g, 7, 1, 2, 4, 'M')
    rect(g, 2, 6, 5, 4, 'M')
    rect(g, 9, 6, 5, 4, 'M')
    rect(g, 8, 11, 1, 3, 'A')
  },
  // 18 农夫 farmer（大关 4）
  (g) => {
    disc(g, 7.5, 9, 5.2, 'M')
    rect(g, 4, 1, 7, 4, 'A')
    rect(g, 2, 5, 11, 2, 'A')
  },
  // 19 渔夫 fisher
  (g) => {
    disc(g, 7.5, 9, 5.2, 'M')
    rect(g, 3, 2, 9, 4, 'A')
    rect(g, 3, 6, 9, 1, 'S')
    rect(g, 4, 10, 7, 4, 'H')
  },
  // 20 矿工 miner
  (g) => {
    disc(g, 7.5, 9, 5.2, 'M')
    disc(g, 7.5, 4.5, 4.2, 'A')
    rect(g, 2, 5, 11, 2, 'A')
    disc(g, 11.5, 4, 2, 'L')
  },
  // 21 老板娘 shopkeeper
  (g) => {
    disc(g, 7.5, 9, 5.2, 'M')
    rect(g, 3, 2, 9, 5, 'A')
    disc(g, 10.5, 3, 2.4, 'A')
  },
  // 22 老爷爷 grandpa
  (g) => {
    disc(g, 7.5, 9, 5.2, 'M')
    rect(g, 2, 5, 3, 6, 'H')
    rect(g, 11, 5, 3, 6, 'H')
    rect(g, 3, 10, 9, 4, 'H')
  },
  // 23 小女孩 girl
  (g) => {
    disc(g, 7.5, 9, 5.2, 'M')
    rect(g, 3, 2, 9, 3, 'A')
    disc(g, 1.8, 5, 2.3, 'A')
    disc(g, 13.2, 5, 2.3, 'A')
    put(g, 'L', [
      [2, 6],
      [13, 6],
    ])
  },
  // 24 紫水晶 amethyst（大关 5）
  (g) => {
    rect(g, 6, 2, 4, 3, 'M')
    rect(g, 5, 5, 6, 5, 'M')
    rect(g, 6, 10, 4, 4, 'M')
    rect(g, 6, 3, 4, 1, 'H')
    rect(g, 6, 11, 4, 1, 'H')
  },
  // 25 红宝石 ruby
  (g) => {
    rect(g, 6, 2, 4, 3, 'M')
    rect(g, 5, 5, 6, 5, 'M')
    rect(g, 6, 10, 4, 4, 'M')
    rect(g, 6, 3, 4, 1, 'H')
    rect(g, 6, 11, 4, 1, 'H')
  },
  // 26 黄玉 topaz
  (g) => {
    rect(g, 6, 2, 4, 3, 'M')
    rect(g, 5, 5, 6, 5, 'M')
    rect(g, 6, 10, 4, 4, 'M')
    rect(g, 6, 3, 4, 1, 'H')
    rect(g, 6, 11, 4, 1, 'H')
  },
  // 27 镐 pickaxe
  (g) => {
    rect(g, 0, 3, 9, 2, 'M')
    rect(g, 1, 5, 7, 2, 'M')
    rect(g, 7, 7, 2, 2, 'A')
    rect(g, 8, 9, 2, 2, 'A')
    rect(g, 9, 11, 2, 2, 'A')
    rect(g, 10, 13, 2, 2, 'A')
  },
  // 28 剑 sword
  (g) => {
    rect(g, 6, 1, 4, 9, 'M')
    put(g, 'M', [
      [7, 10],
      [8, 10],
    ])
    rect(g, 4, 9, 8, 2, 'A')
    rect(g, 7, 11, 2, 3, 'S')
    disc(g, 8, 14, 1.5, 'A')
  },
  // 29 史莱姆 slime
  (g) => {
    disc(g, 7.5, 8, 4.9, 'M')
    rect(g, 2, 8, 11, 5, 'M')
    disc(g, 5, 6, 1.6, 'H')
  },
  // 30 雪人 snowman（大关 6）
  (g) => {
    disc(g, 7.5, 7, 3, 'M')
    disc(g, 7.5, 12.5, 3.9, 'M')
    rect(g, 4, 1, 7, 3, 'S')
    rect(g, 3, 4, 9, 1, 'S')
    rect(g, 4, 9, 7, 2, 'A')
    rect(g, 10, 10, 2, 2, 'A')
    rect(g, 9, 7, 2, 1, 'A')
    put(g, 'S', [
      [7, 12],
      [7, 14],
    ])
  },
  // 31 雪花 snowflake
  (g) => {
    rect(g, 7, 0, 2, 16, 'M')
    rect(g, 0, 7, 16, 2, 'M')
    put(g, 'M', [
      [1, 1],
      [14, 1],
      [1, 14],
      [14, 14],
      [2, 2],
      [3, 3],
      [4, 4],
      [5, 5],
      [10, 10],
      [11, 11],
      [12, 12],
      [13, 13],
      [12, 2],
      [11, 3],
      [10, 4],
      [9, 5],
      [5, 10],
      [4, 11],
      [3, 12],
      [2, 13],
    ])
  },
  // 32 松树 pine tree
  (g) => {
    rect(g, 2, 4, 12, 3, 'M')
    rect(g, 3, 8, 10, 3, 'M')
    rect(g, 4, 12, 8, 3, 'M')
    rect(g, 6, 14, 4, 2, 'A')
    rect(g, 2, 4, 12, 1, 'H')
    rect(g, 3, 8, 10, 1, 'H')
    rect(g, 4, 12, 8, 1, 'H')
  },
  // 33 礼物 gift
  (g) => {
    rect(g, 3, 8, 10, 6, 'M')
    rect(g, 2, 4, 12, 4, 'M')
    rect(g, 7, 4, 2, 4, 'A')
    rect(g, 7, 8, 2, 6, 'A')
    disc(g, 4.5, 3, 1.7, 'A')
    disc(g, 9.5, 3, 1.7, 'A')
  },
  // 34 星之果实 stardrop
  (g) => {
    disc(g, 7.5, 8, 2.4, 'M')
    disc(g, 7.5, 3.2, 2.1, 'M')
    disc(g, 3, 5.8, 2.6, 'M')
    disc(g, 12, 5.8, 2.6, 'M')
    disc(g, 5, 12.6, 2.6, 'M')
    disc(g, 10, 12.6, 2.6, 'M')
    put(g, 'H', [
      [7, 3],
      [11, 5],
      [3, 12],
    ])
  },
  // 35 冰晶 ice crystal
  (g) => {
    rect(g, 6, 1, 4, 3, 'M')
    rect(g, 5, 4, 6, 4, 'M')
    rect(g, 6, 8, 4, 6, 'M')
    rect(g, 2, 7, 3, 2, 'A')
    rect(g, 11, 7, 3, 2, 'A')
    rect(g, 6, 2, 4, 1, 'H')
    rect(g, 6, 6, 4, 1, 'H')
    rect(g, 6, 11, 4, 1, 'H')
  },
]

/* —— 每精灵 8 色画板（顺序同 PAINTERS；出处：DESIGN.md §4.2，本文件定义） —— */

export const SPRITE_PALETTES: SpritePalette[] = [
  {
    outline: '#4a3320',
    main: '#f3e7c9',
    light: '#fffaf0',
    dark: '#d9c49a',
    face: '#3a2c1a',
    blush: '#f2a3c4',
    accent: '#4f8f3a',
    accentLight: '#7cbf6f',
  },
  {
    outline: '#5a1f24',
    main: '#e24a56',
    light: '#f2808a',
    dark: '#b22f3c',
    face: '#4a1f24',
    blush: '#f7a8c4',
    accent: '#3f8f3a',
    accentLight: '#7cbf6f',
  },
  {
    outline: '#6e5a3c',
    main: '#fdf3dc',
    light: '#ffffff',
    dark: '#ddcba4',
    face: '#4a3820',
    blush: '#f2a3c4',
    accent: '#e0b870',
    accentLight: '#f2d6a0',
  },
  {
    outline: '#2c3e50',
    main: '#7fa6c9',
    light: '#aac6e0',
    dark: '#54708f',
    face: '#22303e',
    blush: '#f2a3c4',
    accent: '#3e5a70',
    accentLight: '#6f8fa8',
  },
  {
    outline: '#8a5a1a',
    main: '#f5d34a',
    light: '#fbea8e',
    dark: '#d9a92e',
    face: '#4a3210',
    blush: '#f2a3c4',
    accent: '#e88a2a',
    accentLight: '#f7b35c',
  },
  {
    outline: '#2c4a1e',
    main: '#4f8f3a',
    light: '#79b860',
    dark: '#356a26',
    face: '#3a2418',
    blush: '#f2a3c4',
    accent: '#7a4a2a',
    accentLight: '#a06a3c',
  },
  {
    outline: '#1e4a66',
    main: '#3f8fd9',
    light: '#7fb8ea',
    dark: '#2a6aa8',
    face: '#12303f',
    blush: '#f2a3c4',
    accent: '#e8893a',
    accentLight: '#f7b35c',
  },
  {
    outline: '#6e1f1f',
    main: '#d94a3c',
    light: '#ef7a66',
    dark: '#a82e24',
    face: '#4a1a14',
    blush: '#f2a3c4',
    accent: '#b23a30',
    accentLight: '#e06a52',
  },
  {
    outline: '#7a3a4a',
    main: '#f2a8b8',
    light: '#fbd0da',
    dark: '#d97e94',
    face: '#4a2430',
    blush: '#f280a0',
    accent: '#d9b06a',
    accentLight: '#f2d6a0',
  },
  {
    outline: '#6e2444',
    main: '#e8749a',
    light: '#f2a0bc',
    dark: '#c05078',
    face: '#4a1a30',
    blush: '#f7c4d8',
    accent: '#a03a5e',
    accentLight: '#c96a92',
  },
  {
    outline: '#24501e',
    main: '#3f8f3a',
    light: '#6ab860',
    dark: '#2a6a24',
    face: '#1c3a14',
    blush: '#f2a3c4',
    accent: '#2f6e2a',
    accentLight: '#5aa44f',
  },
  {
    outline: '#8a3a14',
    main: '#ef8a3a',
    light: '#f7b06a',
    dark: '#c96a24',
    face: '#4a2a10',
    blush: '#f2a3c4',
    accent: '#d9702a',
    accentLight: '#f29a4a',
  },
  {
    outline: '#6e3a14',
    main: '#e8832a',
    light: '#f7a95c',
    dark: '#c05f1c',
    face: '#4a2a10',
    blush: '#f2a3c4',
    accent: '#3f8f3a',
    accentLight: '#6ab860',
  },
  {
    outline: '#6e1f24',
    main: '#d9444f',
    light: '#ef6a70',
    dark: '#b02a36',
    face: '#4a1a1e',
    blush: '#f2a3c4',
    accent: '#f4e4c1',
    accentLight: '#fdf6e4',
  },
  {
    outline: '#6e4a14',
    main: '#f5c84a',
    light: '#fbe88e',
    dark: '#d9a02e',
    face: '#4a320e',
    blush: '#f2a3c4',
    accent: '#4f8f3a',
    accentLight: '#7cbf6f',
  },
  {
    outline: '#5a1f24',
    main: '#e0444f',
    light: '#ef747c',
    dark: '#b22a36',
    face: '#4a1a1e',
    blush: '#f2a3c4',
    accent: '#3f8f3a',
    accentLight: '#6ab860',
  },
  {
    outline: '#4a2c14',
    main: '#b07a44',
    light: '#d9a06a',
    dark: '#8a5c30',
    face: '#3a2410',
    blush: '#f2a3c4',
    accent: '#8a5c30',
    accentLight: '#a06c3c',
  },
  {
    outline: '#6e2414',
    main: '#e05a2c',
    light: '#ef825a',
    dark: '#b83c1c',
    face: '#4a1a0e',
    blush: '#f2a3c4',
    accent: '#8a4a1e',
    accentLight: '#a85f2c',
  },
  {
    outline: '#4a3a2c',
    main: '#f2c89a',
    light: '#fbe0bc',
    dark: '#d9a678',
    face: '#3a2c1a',
    blush: '#f2a3c4',
    accent: '#e8b84a',
    accentLight: '#f7d97e',
  },
  {
    outline: '#2c3a4a',
    main: '#f2c89a',
    light: '#fbe0bc',
    dark: '#d9a678',
    face: '#3a2c1a',
    blush: '#f2a3c4',
    accent: '#3f7ad9',
    accentLight: '#7ba3ea',
  },
  {
    outline: '#4a3a2c',
    main: '#f2c89a',
    light: '#fbe0bc',
    dark: '#d9a678',
    face: '#3a2c1a',
    blush: '#f2a3c4',
    accent: '#e8b84a',
    accentLight: '#fdf3bc',
  },
  {
    outline: '#4a2c3a',
    main: '#f2c89a',
    light: '#fbe0bc',
    dark: '#d9a678',
    face: '#3a2c1a',
    blush: '#f2a3c4',
    accent: '#6e4a2c',
    accentLight: '#9a6c44',
  },
  {
    outline: '#4a3a3a',
    main: '#f2c89a',
    light: '#fbe0bc',
    dark: '#d9a678',
    face: '#3a2c1a',
    blush: '#f2a3c4',
    accent: '#e5e2df',
    accentLight: '#fdfcfa',
  },
  {
    outline: '#4a2c3a',
    main: '#f2c89a',
    light: '#fbe0bc',
    dark: '#d9a678',
    face: '#3a2c1a',
    blush: '#f2a3c4',
    accent: '#d9a02e',
    accentLight: '#f2b8c4',
  },
  {
    outline: '#3b1e50',
    main: '#8a4fbf',
    light: '#ab7fd6',
    dark: '#643a94',
    face: '#2c1640',
    blush: '#f2a3c4',
    accent: '#5a2f8a',
    accentLight: '#7a4fae',
  },
  {
    outline: '#5a1424',
    main: '#d93050',
    light: '#ef6880',
    dark: '#a81834',
    face: '#4a1020',
    blush: '#f2a3c4',
    accent: '#a81834',
    accentLight: '#d9526c',
  },
  {
    outline: '#6e4410',
    main: '#e8a52c',
    light: '#f7c868',
    dark: '#c07e18',
    face: '#4a2e0a',
    blush: '#f2a3c4',
    accent: '#c07e18',
    accentLight: '#e8b04a',
  },
  {
    outline: '#2c343c',
    main: '#9aa8b8',
    light: '#c2ccd8',
    dark: '#6f7c8c',
    face: '#242c34',
    blush: '#f2a3c4',
    accent: '#7a4a2a',
    accentLight: '#a06a3c',
  },
  {
    outline: '#2c343c',
    main: '#b8c6d4',
    light: '#dde6ee',
    dark: '#8a98a8',
    face: '#242c34',
    blush: '#f2a3c4',
    accent: '#e8b84a',
    accentLight: '#f7d97e',
  },
  {
    outline: '#244a24',
    main: '#5cb84a',
    light: '#8ad872',
    dark: '#3f8f34',
    face: '#1c3414',
    blush: '#f2a3c4',
    accent: '#2f7a2c',
    accentLight: '#6fbf5c',
  },
  {
    outline: '#3a4a5e',
    main: '#f5f8fc',
    light: '#ffffff',
    dark: '#c2ccd8',
    face: '#2c3a4a',
    blush: '#f2a3c4',
    accent: '#e8893a',
    accentLight: '#f7b35c',
  },
  {
    outline: '#2c4a66',
    main: '#cfe8f5',
    light: '#eef8fd',
    dark: '#9cc4dc',
    face: '#2c3a4a',
    blush: '#f2a3c4',
    accent: '#7fb8dc',
    accentLight: '#b2d8ec',
  },
  {
    outline: '#1e3a24',
    main: '#2f7a3c',
    light: '#4f9a58',
    dark: '#20542c',
    face: '#3a2418',
    blush: '#f2a3c4',
    accent: '#6e4a2c',
    accentLight: '#9a6c44',
  },
  {
    outline: '#5a1430',
    main: '#d93050',
    light: '#ef6880',
    dark: '#a81834',
    face: '#4a1020',
    blush: '#f2a3c4',
    accent: '#e8b84a',
    accentLight: '#f7d97e',
  },
  {
    outline: '#3b1e50',
    main: '#8a4fbf',
    light: '#ab7fd6',
    dark: '#643a94',
    face: '#2c1640',
    blush: '#f2a3c4',
    accent: '#e8c24a',
    accentLight: '#f7e08e',
  },
  {
    outline: '#244a66',
    main: '#7fc4e8',
    light: '#b2e0f4',
    dark: '#4f9cc4',
    face: '#1e3a4e',
    blush: '#f2a3c4',
    accent: '#4f9cc4',
    accentLight: '#8fd0e8',
  },
]

/* —— 脸部定制（除默认外）；位置均在各自图形内部 —— */

const FACES: FaceOpts[] = [
  {}, // 0 防风草
  {}, // 1 草莓
  {}, // 2 鸡蛋
  {
    eyes: [
      [4, 10],
      [5, 10],
      [8, 10],
      [9, 10],
    ],
    blush: [
      [4, 12],
      [9, 12],
    ],
    mouth: [
      [6, 12],
      [7, 12],
    ],
  }, // 3 喷壶
  {
    eyes: [
      [5, 5],
      [6, 5],
      [7, 5],
      [8, 5],
    ],
    blush: [
      [4, 9],
      [11, 9],
    ],
    mouth: [
      [7, 8],
      [8, 8],
    ],
  }, // 4 小鸡
  {
    eyes: [
      [6, 11],
      [7, 11],
      [8, 11],
      [9, 11],
    ],
    blush: [
      [3, 10],
      [12, 10],
    ],
    mouth: [
      [7, 13],
      [8, 13],
    ],
  }, // 5 橡树
  {
    eyes: [
      [9, 6],
      [10, 6],
      [9, 7],
      [10, 7],
    ],
    blush: [[12, 9]],
    mouth: [
      [6, 10],
      [7, 10],
    ],
  }, // 6 鱼
  {
    eyes: [
      [4, 2],
      [11, 2],
    ],
    blush: [
      [4, 10],
      [11, 10],
    ],
    mouth: [
      [7, 11],
      [8, 11],
    ],
  }, // 7 螃蟹
  {}, // 8 扇贝
  {
    eyes: [
      [5, 4],
      [6, 4],
      [9, 4],
      [10, 4],
    ],
    blush: [
      [4, 7],
      [11, 7],
    ],
    mouth: [
      [7, 6],
      [8, 6],
    ],
  }, // 9 鱿鱼
  {
    eyes: [
      [6, 5],
      [7, 5],
      [8, 5],
      [9, 5],
    ],
    blush: [
      [6, 8],
      [8, 8],
    ],
    mouth: [
      [7, 9],
      [8, 9],
    ],
  }, // 10 海草
  {
    eyes: [
      [6, 7],
      [7, 7],
      [8, 7],
      [9, 7],
    ],
    blush: [
      [5, 9],
      [10, 9],
    ],
    mouth: [
      [7, 10],
      [8, 10],
    ],
  }, // 11 海星
  {}, // 12 南瓜
  {
    eyes: [
      [6, 10],
      [7, 10],
      [8, 10],
      [9, 10],
    ],
    blush: [
      [4, 8],
      [11, 8],
    ],
    mouth: [
      [7, 12],
      [8, 12],
    ],
  }, // 13 蘑菇
  {
    eyes: [
      [5, 8],
      [6, 8],
      [9, 8],
      [10, 8],
    ],
    blush: [
      [5, 10],
      [10, 10],
    ],
    mouth: [
      [7, 12],
      [8, 12],
    ],
  }, // 14 玉米
  {}, // 15 苹果
  {}, // 16 榛子
  {
    eyes: [
      [6, 7],
      [7, 7],
      [8, 7],
      [9, 7],
    ],
    blush: [
      [4, 8],
      [11, 8],
    ],
    mouth: [
      [7, 9],
      [8, 9],
    ],
  }, // 17 枫叶
  {
    eyes: [
      [5, 8],
      [6, 8],
      [9, 8],
      [10, 8],
    ],
  }, // 18 农夫
  {
    eyes: [
      [5, 8],
      [6, 8],
      [9, 8],
      [10, 8],
    ],
    blush: [
      [4, 9],
      [11, 9],
    ],
    mouth: [],
  }, // 19 渔夫
  {
    eyes: [
      [5, 8],
      [6, 8],
      [9, 8],
      [10, 8],
    ],
    blush: [
      [4, 9],
      [11, 9],
    ],
  }, // 20 矿工
  {}, // 21 老板娘
  {
    blush: [
      [5, 9],
      [10, 9],
    ],
    mouth: [],
  }, // 22 老爷爷
  {}, // 23 小女孩
  {
    eyes: [
      [6, 6],
      [7, 6],
      [8, 6],
      [9, 6],
    ],
    blush: [
      [6, 9],
      [9, 9],
    ],
    mouth: [
      [7, 10],
      [8, 10],
    ],
  }, // 24 紫水晶
  {
    eyes: [
      [6, 6],
      [7, 6],
      [8, 6],
      [9, 6],
    ],
    blush: [
      [6, 9],
      [9, 9],
    ],
    mouth: [
      [7, 10],
      [8, 10],
    ],
  }, // 25 红宝石
  {
    eyes: [
      [6, 6],
      [7, 6],
      [8, 6],
      [9, 6],
    ],
    blush: [
      [6, 9],
      [9, 9],
    ],
    mouth: [
      [7, 10],
      [8, 10],
    ],
  }, // 26 黄玉
  {
    eyes: [
      [2, 3],
      [3, 3],
      [6, 3],
      [7, 3],
    ],
    blush: [
      [2, 5],
      [7, 5],
    ],
    mouth: [
      [4, 5],
      [5, 5],
    ],
  }, // 27 镐
  {
    eyes: [
      [6, 4],
      [7, 4],
      [8, 4],
      [9, 4],
    ],
    blush: [
      [6, 7],
      [9, 7],
    ],
    mouth: [
      [7, 7],
      [8, 7],
    ],
  }, // 28 剑
  {
    eyes: [
      [5, 6],
      [6, 6],
      [9, 6],
      [10, 6],
    ],
    blush: [
      [4, 9],
      [11, 9],
    ],
    mouth: [
      [7, 10],
      [8, 10],
    ],
  }, // 29 史莱姆
  {
    eyes: [
      [5, 6],
      [6, 6],
      [9, 6],
      [10, 6],
    ],
    blush: [
      [5, 9],
      [10, 9],
    ],
    mouth: [
      [7, 9],
      [8, 9],
    ],
  }, // 30 雪人
  {
    eyes: [
      [6, 7],
      [7, 7],
      [8, 7],
      [9, 7],
    ],
    blush: [
      [4, 8],
      [11, 8],
    ],
    mouth: [
      [7, 9],
      [8, 9],
    ],
  }, // 31 雪花
  {
    eyes: [
      [6, 9],
      [7, 9],
      [8, 9],
      [9, 9],
    ],
    blush: [
      [5, 9],
      [10, 9],
    ],
    mouth: [
      [7, 10],
      [8, 10],
    ],
  }, // 32 松树
  {
    eyes: [
      [4, 10],
      [5, 10],
      [10, 10],
      [11, 10],
    ],
    blush: [
      [4, 12],
      [11, 12],
    ],
    mouth: [
      [7, 11],
      [8, 11],
    ],
  }, // 33 礼物
  {
    eyes: [
      [6, 7],
      [7, 7],
      [8, 7],
      [9, 7],
    ],
    blush: [
      [4, 7],
      [11, 7],
    ],
    mouth: [
      [7, 9],
      [8, 9],
    ],
  }, // 34 星之果实
  {
    eyes: [
      [6, 6],
      [7, 6],
      [8, 6],
      [9, 6],
    ],
    blush: [
      [6, 8],
      [9, 8],
    ],
    mouth: [
      [7, 9],
      [8, 9],
    ],
  }, // 35 冰晶
]

const cache = new Map<number, Sprite>()

export function getSprite(id: number): Sprite {
  const cached = cache.get(id)
  if (cached) return cached
  const painter = PAINTERS[id]
  if (!painter) throw new Error(`精灵 ${id} 不存在（0..${SPRITE_COUNT - 1}）`)
  const sprite = build(painter, FACES[id] ?? {})
  cache.set(id, sprite)
  return sprite
}
