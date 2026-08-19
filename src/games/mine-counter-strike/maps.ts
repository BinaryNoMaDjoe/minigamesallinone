import type { MapId, McsStringKey } from './strings'

// ============================================================
// 地图定义 —— 唯一出处：同目录 DESIGN.md v0.1 §4
// 网格由「边框墙 + 障碍矩形」构建（确定性、可复现），材质码全局共享。
// 材质码：1 石砖 2 木箱 3 沙 4 砂岩 5 雪砖 6 冰 7 金属集装箱 8 木板 9 红砖 10 球场木 11 混凝土
// ============================================================

export interface Spawn {
  x: number
  y: number
  angle: number
}

export interface Obstacle {
  x: number
  y: number
  w: number
  h: number
  mat: number
}

export interface MapDef {
  id: MapId
  nameKey: McsStringKey
  descKey: McsStringKey
  width: number
  height: number
  /** grid[y][x]：0 空，>0 墙材质码 */
  grid: number[][]
  floor: string
  ceiling: string
  fog: string
  teamA: Spawn[]
  teamB: Spawn[]
}

export const MAT = {
  STONE: 1,
  CRATE: 2,
  SAND: 3,
  SANDSTONE: 4,
  SNOW: 5,
  ICE: 6,
  METAL: 7,
  PLANK: 8,
  BRICK: 9,
  COURT: 10,
  CONCRETE: 11,
} as const

function buildGrid(w: number, h: number, border: number, obstacles: Obstacle[]): number[][] {
  const grid: number[][] = Array.from({ length: h }, () => new Array<number>(w).fill(0))
  for (let x = 0; x < w; x++) {
    grid[0]![x] = border
    grid[h - 1]![x] = border
  }
  for (let y = 0; y < h; y++) {
    grid[y]![0] = border
    grid[y]![w - 1] = border
  }
  for (const ob of obstacles) {
    for (let y = ob.y; y < ob.y + ob.h; y++) {
      for (let x = ob.x; x < ob.x + ob.w; x++) {
        if (y > 0 && y < h - 1 && x > 0 && x < w - 1) grid[y]![x] = ob.mat
      }
    }
  }
  return grid
}

// —— 运输船（货柜码头，密集近战）——
const shipment: MapDef = {
  id: 'shipment',
  nameKey: 'map_shipment',
  descKey: 'map_shipment_desc',
  width: 24,
  height: 24,
  grid: buildGrid(24, 24, MAT.METAL, [
    { x: 3, y: 3, w: 4, h: 3, mat: MAT.CRATE },
    { x: 17, y: 3, w: 4, h: 3, mat: MAT.CRATE },
    { x: 3, y: 16, w: 4, h: 3, mat: MAT.CRATE },
    { x: 17, y: 16, w: 4, h: 3, mat: MAT.CRATE },
    { x: 9, y: 11, w: 6, h: 2, mat: MAT.METAL },
    { x: 3, y: 9, w: 2, h: 4, mat: MAT.METAL },
    { x: 19, y: 9, w: 2, h: 4, mat: MAT.METAL },
  ]),
  floor: '#5f6a68',
  ceiling: '#a9d8e8',
  fog: '#9fcbd9',
  teamA: [
    { x: 2.5, y: 2.5, angle: 0.785 },
    { x: 2.5, y: 12.5, angle: 0 },
    { x: 2.5, y: 21.5, angle: -0.785 },
    { x: 12.5, y: 2.5, angle: Math.PI / 2 },
    { x: 12.5, y: 21.5, angle: -Math.PI / 2 },
  ],
  teamB: [
    { x: 21.5, y: 2.5, angle: Math.PI - 0.785 },
    { x: 21.5, y: 12.5, angle: Math.PI },
    { x: 21.5, y: 21.5, angle: -Math.PI + 0.785 },
    { x: 12.5, y: 8.5, angle: Math.PI / 2 },
    { x: 12.5, y: 15.5, angle: -Math.PI / 2 },
  ],
}

// —— 沙城（沙漠小镇）——
const dust: MapDef = {
  id: 'dust',
  nameKey: 'map_dust',
  descKey: 'map_dust_desc',
  width: 24,
  height: 24,
  grid: buildGrid(24, 24, MAT.SANDSTONE, [
    { x: 7, y: 2, w: 2, h: 6, mat: MAT.SANDSTONE },
    { x: 15, y: 2, w: 2, h: 6, mat: MAT.SANDSTONE },
    { x: 7, y: 16, w: 2, h: 6, mat: MAT.SANDSTONE },
    { x: 15, y: 16, w: 2, h: 6, mat: MAT.SANDSTONE },
    { x: 10, y: 9, w: 4, h: 2, mat: MAT.STONE },
    { x: 4, y: 10, w: 2, h: 4, mat: MAT.PLANK },
    { x: 18, y: 10, w: 2, h: 4, mat: MAT.PLANK },
    { x: 11, y: 3, w: 2, h: 2, mat: MAT.SAND },
    { x: 11, y: 18, w: 2, h: 2, mat: MAT.SAND },
  ]),
  floor: '#c9a96a',
  ceiling: '#e8c98a',
  fog: '#d9b878',
  teamA: [
    { x: 2.5, y: 2.5, angle: 0.785 },
    { x: 2.5, y: 12.5, angle: 0 },
    { x: 2.5, y: 21.5, angle: -0.785 },
    { x: 9.5, y: 2.5, angle: Math.PI / 2 },
    { x: 9.5, y: 21.5, angle: -Math.PI / 2 },
  ],
  teamB: [
    { x: 21.5, y: 2.5, angle: Math.PI - 0.785 },
    { x: 21.5, y: 12.5, angle: Math.PI },
    { x: 21.5, y: 21.5, angle: -Math.PI + 0.785 },
    { x: 14.5, y: 2.5, angle: Math.PI / 2 },
    { x: 14.5, y: 21.5, angle: -Math.PI / 2 },
  ],
}

// —— 雪地（雪原仓库）——
const snow: MapDef = {
  id: 'snow',
  nameKey: 'map_snow',
  descKey: 'map_snow_desc',
  width: 24,
  height: 24,
  grid: buildGrid(24, 24, MAT.SNOW, [
    { x: 9, y: 9, w: 2, h: 2, mat: MAT.ICE },
    { x: 13, y: 9, w: 2, h: 2, mat: MAT.ICE },
    { x: 9, y: 13, w: 2, h: 2, mat: MAT.ICE },
    { x: 13, y: 13, w: 2, h: 2, mat: MAT.ICE },
    { x: 3, y: 3, w: 3, h: 2, mat: MAT.PLANK },
    { x: 18, y: 3, w: 3, h: 2, mat: MAT.PLANK },
    { x: 3, y: 19, w: 3, h: 2, mat: MAT.PLANK },
    { x: 18, y: 19, w: 3, h: 2, mat: MAT.PLANK },
    { x: 7, y: 2, w: 2, h: 5, mat: MAT.SNOW },
    { x: 15, y: 2, w: 2, h: 5, mat: MAT.SNOW },
    { x: 7, y: 17, w: 2, h: 5, mat: MAT.SNOW },
    { x: 15, y: 17, w: 2, h: 5, mat: MAT.SNOW },
  ]),
  floor: '#e8eef2',
  ceiling: '#c2d2de',
  fog: '#c9d6e0',
  teamA: [
    { x: 2.5, y: 2.5, angle: 0.785 },
    { x: 2.5, y: 12.5, angle: 0 },
    { x: 2.5, y: 21.5, angle: -0.785 },
    { x: 12.5, y: 2.5, angle: Math.PI / 2 },
    { x: 12.5, y: 21.5, angle: -Math.PI / 2 },
  ],
  teamB: [
    { x: 21.5, y: 2.5, angle: Math.PI - 0.785 },
    { x: 21.5, y: 12.5, angle: Math.PI },
    { x: 21.5, y: 21.5, angle: -Math.PI + 0.785 },
    { x: 12.5, y: 8.5, angle: Math.PI / 2 },
    { x: 12.5, y: 15.5, angle: -Math.PI / 2 },
  ],
}

// —— 杂物篮球场（室内，大量杂物）——
const court: MapDef = {
  id: 'court',
  nameKey: 'map_court',
  descKey: 'map_court_desc',
  width: 24,
  height: 24,
  grid: buildGrid(24, 24, MAT.CONCRETE, [
    { x: 7, y: 2, w: 2, h: 4, mat: MAT.CONCRETE },
    { x: 15, y: 2, w: 2, h: 4, mat: MAT.CONCRETE },
    { x: 7, y: 18, w: 2, h: 4, mat: MAT.CONCRETE },
    { x: 15, y: 18, w: 2, h: 4, mat: MAT.CONCRETE },
    { x: 11, y: 11, w: 2, h: 2, mat: MAT.COURT },
    { x: 3, y: 5, w: 2, h: 2, mat: MAT.COURT },
    { x: 19, y: 5, w: 2, h: 2, mat: MAT.COURT },
    { x: 3, y: 17, w: 2, h: 2, mat: MAT.COURT },
    { x: 19, y: 17, w: 2, h: 2, mat: MAT.COURT },
    { x: 11, y: 5, w: 2, h: 2, mat: MAT.COURT },
    { x: 11, y: 17, w: 2, h: 2, mat: MAT.COURT },
    { x: 5, y: 11, w: 2, h: 2, mat: MAT.CRATE },
    { x: 17, y: 11, w: 2, h: 2, mat: MAT.CRATE },
    { x: 3, y: 7, w: 2, h: 2, mat: MAT.BRICK },
    { x: 19, y: 7, w: 2, h: 2, mat: MAT.BRICK },
  ]),
  floor: '#c98a4b',
  ceiling: '#5b4a3a',
  fog: '#4a3d31',
  teamA: [
    { x: 2.5, y: 2.5, angle: 0.785 },
    { x: 2.5, y: 12.5, angle: 0 },
    { x: 2.5, y: 21.5, angle: -0.785 },
    { x: 12.5, y: 2.5, angle: Math.PI / 2 },
    { x: 12.5, y: 21.5, angle: -Math.PI / 2 },
  ],
  teamB: [
    { x: 21.5, y: 2.5, angle: Math.PI - 0.785 },
    { x: 21.5, y: 12.5, angle: Math.PI },
    { x: 21.5, y: 21.5, angle: -Math.PI + 0.785 },
    { x: 12.5, y: 8.5, angle: Math.PI / 2 },
    { x: 12.5, y: 15.5, angle: -Math.PI / 2 },
  ],
}

export const MAPS: MapDef[] = [shipment, dust, snow, court]

export const MAP_INDEX: Record<MapId, MapDef> = Object.fromEntries(
  MAPS.map((m) => [m.id, m]),
) as Record<MapId, MapDef>

/** 地图自检：矩形、出生点界内且非墙（供测试调用，运行时无效地图也会在引擎中走同一条断言） */
export function mapIssues(m: MapDef): string[] {
  const issues: string[] = []
  if (m.grid.length !== m.height) issues.push(`${m.id}: 行数 != height`)
  for (let y = 0; y < m.grid.length; y++) {
    if (m.grid[y]!.length !== m.width) issues.push(`${m.id}: 第 ${y} 行宽 != width`)
  }
  const checkSpawn = (s: Spawn, label: string) => {
    const cx = Math.floor(s.x)
    const cy = Math.floor(s.y)
    if (cx < 0 || cy < 0 || cx >= m.width || cy >= m.height) {
      issues.push(`${m.id}: ${label} 出生点出界 (${s.x},${s.y})`)
      return
    }
    if (m.grid[cy]![cx] !== 0) issues.push(`${m.id}: ${label} 出生点落在墙上 (${s.x},${s.y})`)
  }
  m.teamA.forEach((s, i) => checkSpawn(s, `A${i}`))
  m.teamB.forEach((s, i) => checkSpawn(s, `B${i}`))
  return issues
}
