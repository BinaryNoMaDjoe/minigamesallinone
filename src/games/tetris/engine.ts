// ============================================================
// 俄罗斯方块：纯逻辑引擎（无 DOM，可注入随机源，node 直跑可测）
// 唯一出处：同目录 DESIGN.md v0.3；渲染与输入在 Game.tsx
// 决策 #25：引擎抽纯逻辑 + engine.test.ts 冒烟测试
// ============================================================
import { GRAVITY_MS, LINE_SCORES, SHAPES, rotateCW } from './pieces.ts'
import type { PieceType } from './pieces.ts'

export type TetrisPhase = 'menu' | 'playing' | 'paused' | 'over'

export interface ActivePiece {
  type: PieceType
  matrix: number[][]
  x: number
  y: number
}

export type Board = (PieceType | null)[][]

export interface TickResult {
  /** 本帧是否有方块锁定 */
  locked: boolean
  /** 本帧消除行数 */
  cleared: number
  /** 本帧是否进入 game over */
  over: boolean
}

export const COLS = 10
export const ROWS = 20

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null))
}

function cellsOf(matrix: number[][], px: number, py: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = []
  matrix.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value) cells.push({ x: px + c, y: py + r })
    })
  })
  return cells
}

function collides(board: Board, matrix: number[][], px: number, py: number): boolean {
  return cellsOf(matrix, px, py).some(
    ({ x, y }) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x] !== null),
  )
}

function shuffle(types: PieceType[], random: () => number): PieceType[] {
  const bag = [...types]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

export interface TetrisEngineOptions {
  random?: () => number
}

export class TetrisEngine {
  board: Board = emptyBoard()
  score = 0
  lines = 0
  level = 1
  phase: TetrisPhase = 'menu'
  current: ActivePiece | null = null

  private bag: PieceType[] = []
  private next: PieceType = 0
  private accumulator = 0
  private readonly random: () => number

  constructor(options: TetrisEngineOptions = {}) {
    this.random = options.random ?? Math.random
    this.bag = shuffle([0, 1, 2, 3, 4, 5, 6], this.random)
    this.next = this.takeFromBag()
  }

  /** 当前等级下落间隔（ms，DESIGN.md §6） */
  get gravityMs(): number {
    return GRAVITY_MS[Math.min(this.level - 1, GRAVITY_MS.length - 1)]
  }

  get nextType(): PieceType {
    return this.next
  }

  /** 幽灵块落点行（无当前块或已结束时为 null） */
  get ghostY(): number | null {
    if (!this.current || this.phase === 'over') return null
    let gy = this.current.y
    while (!collides(this.board, this.current.matrix, this.current.x, gy + 1)) gy++
    return gy
  }

  private takeFromBag(): PieceType {
    if (this.bag.length === 0) this.bag = shuffle([0, 1, 2, 3, 4, 5, 6], this.random)
    return this.bag.pop()!
  }

  private spawn() {
    const type = this.next
    this.next = this.takeFromBag()
    const matrix = SHAPES[type]
    this.current = { type, matrix, x: Math.floor((COLS - matrix[0].length) / 2), y: -1 }
    if (collides(this.board, matrix, this.current.x, this.current.y)) {
      this.phase = 'over'
    }
  }

  /** 开始/重新开始一局（主菜单"开始游戏"、再来一局） */
  startRun() {
    this.board = emptyBoard()
    this.bag = shuffle([0, 1, 2, 3, 4, 5, 6], this.random)
    this.next = this.takeFromBag()
    this.score = 0
    this.lines = 0
    this.level = 1
    this.accumulator = 0
    this.current = null
    this.phase = 'playing'
    this.spawn()
  }

  /** 返回主菜单（清空棋盘与成绩） */
  toMenu() {
    this.board = emptyBoard()
    this.current = null
    this.score = 0
    this.lines = 0
    this.level = 1
    this.phase = 'menu'
  }

  /** 结束本局（结算画面，保留成绩） */
  endRun() {
    if (this.phase === 'playing' || this.phase === 'paused') this.phase = 'over'
  }

  pause() {
    if (this.phase === 'playing') this.phase = 'paused'
  }

  resume() {
    if (this.phase === 'paused') this.phase = 'playing'
  }

  /** 重力推进（渲染循环每帧调用，dtMs 上限由调用方控制） */
  tick(dtMs: number): TickResult {
    const result: TickResult = { locked: false, cleared: 0, over: false }
    if (this.phase !== 'playing' || !this.current) return result
    this.accumulator += dtMs
    while (this.accumulator >= this.gravityMs) {
      this.accumulator -= this.gravityMs
      if (collides(this.board, this.current.matrix, this.current.x, this.current.y + 1)) {
        const r = this.lockPiece()
        result.locked = true
        result.cleared = r.cleared
        result.over = r.over
        if (r.over) break
      } else {
        this.current.y += 1
      }
      if (!this.current) break
    }
    return result
  }

  move(dx: number): boolean {
    if (this.phase !== 'playing' || !this.current) return false
    if (!collides(this.board, this.current.matrix, this.current.x + dx, this.current.y)) {
      this.current.x += dx
      return true
    }
    return false
  }

  rotate(): boolean {
    if (this.phase !== 'playing' || !this.current) return false
    const rotated = rotateCW(this.current.matrix)
    // 简化踢墙偏移（DESIGN.md §2.4）
    const kicks = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [-2, 0],
      [2, 0],
    ]
    for (const [kx, ky] of kicks) {
      if (!collides(this.board, rotated, this.current.x + kx, this.current.y + ky)) {
        this.current.matrix = rotated
        this.current.x += kx
        this.current.y += ky
        return true
      }
    }
    return false
  }

  softDrop(): boolean {
    if (this.phase !== 'playing' || !this.current) return false
    if (collides(this.board, this.current.matrix, this.current.x, this.current.y + 1)) {
      this.lockPiece()
      return true
    }
    this.current.y += 1
    this.score += 1
    return true
  }

  hardDrop() {
    if (this.phase !== 'playing' || !this.current) return
    let distance = 0
    while (!collides(this.board, this.current.matrix, this.current.x, this.current.y + 1)) {
      this.current.y += 1
      distance++
    }
    this.score += distance * 2
    this.lockPiece()
  }

  private lockPiece(): { cleared: number; over: boolean } {
    if (!this.current) return { cleared: 0, over: false }
    const { type, matrix, x, y } = this.current
    let lockedOut = false
    cellsOf(matrix, x, y).forEach(({ x: cx, y: cy }) => {
      if (cy < 0) {
        lockedOut = true
        return
      }
      this.board[cy][cx] = type
    })
    if (lockedOut) {
      this.phase = 'over'
      return { cleared: 0, over: true }
    }
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((cell) => cell !== null)) {
        this.board.splice(r, 1)
        this.board.unshift(Array<PieceType | null>(COLS).fill(null))
        cleared++
        r++
      }
    }
    if (cleared > 0) {
      this.lines += cleared
      // 计分按单次最多 4 行封顶（LINE_SCORES 长度防御，避免越界产生 NaN）
      this.score += (LINE_SCORES[Math.min(cleared, 4)] ?? 0) * this.level
      this.level = 1 + Math.floor(this.lines / 10)
    }
    this.current = null
    this.spawn()
    return { cleared, over: this.phase === 'over' }
  }

  /** 测试/调试：直接装载棋盘（20 行 × 10 列） */
  loadBoard(rows: (PieceType | null)[][]) {
    this.board = rows.map((row) => [...row])
  }
}
