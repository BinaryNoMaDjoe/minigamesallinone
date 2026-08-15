// ============================================================
// 连连看：纯逻辑引擎（无 DOM，可注入随机源，node 直跑可测）
// 唯一出处：同目录 DESIGN.md v0.1；渲染与输入在 Game.tsx（决策 #25）
// ============================================================

export type LianPhase = 'menu' | 'playing' | 'paused' | 'over'

export interface Point {
  x: number
  y: number
}

export interface LevelConfig {
  shapes: number
  timeSec: number
}

export const LEVELS: LevelConfig[] = [
  { shapes: 4, timeSec: 150 },
  { shapes: 5, timeSec: 135 },
  { shapes: 6, timeSec: 120 },
  { shapes: 7, timeSec: 105 },
  { shapes: 7, timeSec: 90 },
]

export const TOTAL_LEVELS = LEVELS.length
export const HINTS_PER_LEVEL = 3
export const SHUFFLES_PER_LEVEL = 3
export const MATCH_BASE = 100
export const COMBO_STEP = 20
export const TIME_BONUS_PER_SEC = 5

export type TapResult =
  | { kind: 'selected' | 'deselected' | 'no-match' | 'blocked' }
  | {
      kind: 'matched'
      path: Point[]
      levelClear: boolean
      victory: boolean
      bonus: number
      autoShuffled: boolean
    }

/**
 * 寻路：a → b，路径只能经过空格（或终点 b），拐角 ≤ 2。
 * 返回含起终点中间格的路径（首点为 a 之后第一格，末点为 b），不可达返回 null。
 */
export function findPath(
  grid: (number | null)[][],
  a: Point,
  b: Point,
  cols: number,
  rows: number,
): Point[] | null {
  if (a.x === b.x && a.y === b.y) return null
  if (grid[a.y][a.x] !== grid[b.y][b.x]) return null
  const DIRS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  const passable = (x: number, y: number) =>
    (x === b.x && y === b.y) || (x >= 0 && x < cols && y >= 0 && y < rows && grid[y][x] === null)
  const keyOf = (x: number, y: number, dir: number) => `${x},${y},${dir}`
  const visited = new Map<string, number>()
  const prev = new Map<string, string | null>()
  const queue: { x: number; y: number; dir: number; turns: number }[] = []

  for (let d = 0; d < 4; d++) {
    const nx = a.x + DIRS[d][0]
    const ny = a.y + DIRS[d][1]
    if (!passable(nx, ny)) continue
    const key = keyOf(nx, ny, d)
    visited.set(key, 0)
    prev.set(key, null)
    queue.push({ x: nx, y: ny, dir: d, turns: 0 })
  }

  while (queue.length > 0) {
    const n = queue.shift()!
    if (n.x === b.x && n.y === b.y) {
      // 沿 prev 链重构路径（首点为 a 之后第一格，末点为 b）
      const full: Point[] = []
      let key: string | null = keyOf(n.x, n.y, n.dir)
      while (key !== null) {
        const [px, py] = key.split(',').map(Number)
        full.unshift({ x: px, y: py })
        key = prev.get(key) ?? null
      }
      return full
    }
    for (let d = 0; d < 4; d++) {
      const turns = n.dir === d ? n.turns : n.turns + 1
      if (turns > 2) continue
      const nx = n.x + DIRS[d][0]
      const ny = n.y + DIRS[d][1]
      if (!passable(nx, ny)) continue
      const key = keyOf(nx, ny, d)
      const best = visited.get(key)
      if (best !== undefined && best <= turns) continue
      visited.set(key, turns)
      prev.set(key, keyOf(n.x, n.y, n.dir))
      queue.push({ x: nx, y: ny, dir: d, turns })
    }
  }
  return null
}

export interface LianliankanOptions {
  random?: () => number
  cols?: number
  rows?: number
}

export class LianliankanEngine {
  readonly cols: number
  readonly rows: number
  grid: (number | null)[][] = []
  level = 1
  score = 0
  combo = 0
  timeLeftSec = 0
  phase: LianPhase = 'menu'
  hintsLeft = HINTS_PER_LEVEL
  shufflesLeft = SHUFFLES_PER_LEVEL
  selected: Point | null = null
  victory = false
  /** 过关结算冻结（内部状态，不影响合约阶段） */
  frozen = false
  private readonly random: () => number

  constructor(options: LianliankanOptions = {}) {
    this.random = options.random ?? Math.random
    this.cols = options.cols ?? 8
    this.rows = options.rows ?? 6
    this.grid = this.emptyGrid()
  }

  private emptyGrid(): (number | null)[][] {
    return Array.from({ length: this.rows }, () => Array<number | null>(this.cols).fill(null))
  }

  startRun() {
    this.level = 1
    this.score = 0
    this.combo = 0
    this.victory = false
    this.loadLevel(1)
    this.phase = 'playing'
  }

  toMenu() {
    this.phase = 'menu'
    this.grid = this.emptyGrid()
    this.selected = null
    this.victory = false
  }

  pause() {
    if (this.phase === 'playing') this.phase = 'paused'
  }

  resume() {
    if (this.phase === 'paused') this.phase = 'playing'
  }

  endRun() {
    if (this.phase === 'playing' || this.phase === 'paused') this.phase = 'over'
  }

  /** 死局自动洗牌：循环至存在可消除对（上限 20 次，防极端排列） */
  private ensureSolvable() {
    for (let i = 0; i < 20; i++) {
      if (this.isCleared() || this.findHint()) return
      this.shuffleRemaining(false)
    }
  }

  loadLevel(n: number) {
    this.level = n
    const cfg = LEVELS[n - 1]
    this.timeLeftSec = cfg.timeSec
    this.hintsLeft = HINTS_PER_LEVEL
    this.shufflesLeft = SHUFFLES_PER_LEVEL
    this.selected = null
    this.frozen = false
    this.grid = this.generateBoard(cfg.shapes)
    // 开局死局自动洗牌（免费，循环至有解）
    this.ensureSolvable()
  }

  generateBoard(shapeCount: number): (number | null)[][] {
    const pairs = (this.cols * this.rows) / 2
    const cells: number[] = []
    const base = Math.floor(pairs / shapeCount)
    let rem = pairs - base * shapeCount
    for (let s = 0; s < shapeCount; s++) {
      const count = base + (rem > 0 ? 1 : 0)
      if (rem > 0) rem--
      for (let i = 0; i < count; i++) cells.push(s, s)
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1))
      ;[cells[i], cells[j]] = [cells[j], cells[i]]
    }
    const grid = this.emptyGrid()
    let k = 0
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        grid[y][x] = cells[k++]
      }
    }
    return grid
  }

  tick(dtSec: number) {
    if (this.phase !== 'playing' || this.frozen) return
    this.timeLeftSec -= dtSec
    if (this.timeLeftSec <= 0) {
      this.timeLeftSec = 0
      this.phase = 'over'
    }
  }

  tap(x: number, y: number): TapResult | null {
    if (this.phase !== 'playing' || this.frozen) return null
    const value = this.grid[y]?.[x]
    if (value === null || value === undefined) return null
    if (!this.selected) {
      this.selected = { x, y }
      return { kind: 'selected' }
    }
    if (this.selected.x === x && this.selected.y === y) {
      this.selected = null
      return { kind: 'deselected' }
    }
    const a = this.selected
    if (this.grid[a.y][a.x] !== value) {
      this.selected = { x, y }
      this.combo = 0
      return { kind: 'no-match' }
    }
    const path = findPath(this.grid, a, { x, y }, this.cols, this.rows)
    if (!path) {
      this.selected = { x, y }
      this.combo = 0
      return { kind: 'blocked' }
    }
    this.grid[a.y][a.x] = null
    this.grid[y][x] = null
    this.selected = null
    this.combo++
    this.score += MATCH_BASE + (this.combo - 1) * COMBO_STEP
    let levelClear = false
    let victory = false
    let bonus = 0
    let autoShuffled = false
    if (this.isCleared()) {
      levelClear = true
      bonus = Math.ceil(this.timeLeftSec) * TIME_BONUS_PER_SEC
      this.score += bonus
      if (this.level >= TOTAL_LEVELS) {
        victory = true
        this.victory = true
        this.phase = 'over'
      } else {
        this.frozen = true
      }
    } else if (!this.findHint()) {
      this.ensureSolvable()
      autoShuffled = true
    }
    return { kind: 'matched', path, levelClear, victory, bonus, autoShuffled }
  }

  /** 过关结算后进入下一关 */
  nextLevel() {
    if (this.phase === 'playing' && this.frozen && this.isCleared()) {
      this.loadLevel(this.level + 1)
    }
  }

  isCleared(): boolean {
    return this.grid.every((row) => row.every((cell) => cell === null))
  }

  findHint(): [Point, Point] | null {
    const cells: Point[] = []
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] !== null) cells.push({ x, y })
      }
    }
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        if (this.grid[cells[i].y][cells[i].x] !== this.grid[cells[j].y][cells[j].x]) continue
        const path = findPath(this.grid, cells[i], cells[j], this.cols, this.rows)
        if (path) return [cells[i], cells[j]]
      }
    }
    return null
  }

  useHint(): [Point, Point] | null {
    if (this.phase !== 'playing' || this.frozen || this.hintsLeft <= 0) return null
    const hint = this.findHint()
    if (!hint) return null
    this.hintsLeft--
    this.combo = 0
    return hint
  }

  /** 洗牌：重排剩余图形；cost=false 为死局自动洗牌（免费） */
  shuffleRemaining(cost = true): boolean {
    const cells: number[] = []
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const v = this.grid[y][x]
        if (v !== null) cells.push(v)
      }
    }
    if (cells.length === 0) return false
    if (cost) {
      if (this.shufflesLeft <= 0) return false
      this.shufflesLeft--
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1))
      ;[cells[i], cells[j]] = [cells[j], cells[i]]
    }
    let k = 0
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] !== null) this.grid[y][x] = cells[k++]
      }
    }
    this.combo = 0
    return true
  }
}
