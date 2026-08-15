import { useEffect, useRef } from 'react'
import { pickLang, useI18n } from '../../i18n'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'
import { GRAVITY_MS, LINE_SCORES, PALETTE, PIECE_COLORS, SHAPES, rotateCW } from './pieces'
import type { PieceType } from './pieces'
import { tetrisStrings as S } from './strings'
import './styles.css'

// ============================================================
// 俄罗斯方块（像素风）—— 命令式 Canvas 引擎
// 规则/色板/布局/控件的唯一出处：同目录 DESIGN.md
// 分数实时经 callbacks.onScore 上报壳层，由壳层统一提交 ScoreService（ADR-0005）
// ============================================================

const COLS = 10
const ROWS = 20
const CELL = 16
const BOARD_X = 8
const BOARD_Y = 64
const W = 320
const H = 448
const NEXT_X = 200
const NEXT_Y = 32
const NEXT_CELL = 12

type Board = (PieceType | null)[][]

interface ActivePiece {
  type: PieceType
  matrix: number[][]
  x: number
  y: number
}

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

function shuffle(types: PieceType[]): PieceType[] {
  const bag = [...types]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

export const TetrisGame: GameComponent = ({ onReady }) => {
  const { lang } = useI18n()
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    let root: HTMLDivElement | null = null
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    let rafId = 0
    let playing = false
    let paused = false
    let over = false
    let last = performance.now()
    let accumulator = 0
    let board: Board = emptyBoard()
    let bag: PieceType[] = shuffle([0, 1, 2, 3, 4, 5, 6])
    let next: PieceType = bag.pop()!
    let current: ActivePiece | null = null
    let score = 0
    let lines = 0
    let level = 1
    let gravityMs = GRAVITY_MS[0]
    let callbacks: GameCallbacks = { onScore: () => {} }

    const t = (key: keyof typeof S) => pickLang(S[key], langRef.current)

    /* —— 渲染 —— */

    const drawCell = (px: number, py: number, size: number, color: string, alpha = 1) => {
      if (!ctx) return
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.fillRect(px, py, size, size)
      // 像素内嵌 1px 高光/阴影（DESIGN.md §1/§4）
      ctx.fillStyle = PALETTE.highlight
      ctx.fillRect(px, py, size, 1)
      ctx.fillStyle = PALETTE.shade
      ctx.fillRect(px, py + size - 1, size, 1)
      ctx.globalAlpha = 1
    }

    const drawNextPreview = (type: PieceType) => {
      if (!ctx) return
      const matrix = SHAPES[type]
      const cells = cellsOf(matrix, 0, 0)
      const minX = Math.min(...cells.map((c) => c.x))
      const maxX = Math.max(...cells.map((c) => c.x))
      const minY = Math.min(...cells.map((c) => c.y))
      const maxY = Math.max(...cells.map((c) => c.y))
      const pieceW = (maxX - minX + 1) * NEXT_CELL
      const pieceH = (maxY - minY + 1) * NEXT_CELL
      const ox = NEXT_X + Math.round((W - NEXT_X - pieceW) / 2)
      const oy = NEXT_Y + Math.round((56 - pieceH) / 2)
      cells.forEach(({ x, y }) =>
        drawCell(
          ox + (x - minX) * NEXT_CELL,
          oy + (y - minY) * NEXT_CELL,
          NEXT_CELL,
          PIECE_COLORS[type],
        ),
      )
    }

    const drawGhost = () => {
      if (!current || !ctx) return
      const g = ctx
      let gy = current.y
      while (!collides(board, current.matrix, current.x, gy + 1)) gy++
      cellsOf(current.matrix, current.x, gy).forEach(({ x, y }) => {
        if (y < 0) return
        g.fillStyle = PALETTE.ghost
        g.fillRect(BOARD_X + x * CELL, BOARD_Y + y * CELL, CELL, CELL)
      })
    }

    const draw = () => {
      if (!ctx) return
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, W, H)

      // 棋盘底 + 白墨描边
      ctx.fillStyle = PALETTE.board
      ctx.fillRect(BOARD_X, BOARD_Y, COLS * CELL, ROWS * CELL)
      ctx.strokeStyle = PALETTE.ink
      ctx.lineWidth = 2
      ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, COLS * CELL + 2, ROWS * CELL + 2)

      // 网格线
      ctx.strokeStyle = PALETTE.boardGrid
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let c = 1; c < COLS; c++) {
        ctx.moveTo(BOARD_X + c * CELL, BOARD_Y)
        ctx.lineTo(BOARD_X + c * CELL, BOARD_Y + ROWS * CELL)
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.moveTo(BOARD_X, BOARD_Y + r * CELL)
        ctx.lineTo(BOARD_X + COLS * CELL, BOARD_Y + r * CELL)
      }
      ctx.stroke()

      // 已锁定方块
      board.forEach((row, r) => {
        row.forEach((value, c) => {
          if (value !== null) {
            drawCell(BOARD_X + c * CELL, BOARD_Y + r * CELL, CELL, PIECE_COLORS[value])
          }
        })
      })

      // 幽灵块 + 当前方块
      if (current && !over) {
        const piece = current
        drawGhost()
        cellsOf(piece.matrix, piece.x, piece.y).forEach(({ x, y }) => {
          if (y < 0) return
          drawCell(BOARD_X + x * CELL, BOARD_Y + y * CELL, CELL, PIECE_COLORS[piece.type])
        })
      }

      // 状态文字与 NEXT 预览
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.text
      ctx.font = 'bold 12px "Space Grotesk", monospace'
      ctx.fillText(t('level'), 16, 16)
      ctx.fillText(t('lines'), 16, 36)
      ctx.fillText(t('next'), NEXT_X, 16)
      ctx.font = 'bold 16px "Space Grotesk", monospace'
      ctx.fillText(String(level), 78, 15)
      ctx.fillText(String(lines), 78, 35)
      drawNextPreview(next)

      // 暂停 / 结束遮罩
      if (paused || over) {
        ctx.fillStyle = PALETTE.dim
        ctx.fillRect(BOARD_X, BOARD_Y, COLS * CELL, ROWS * CELL)
        ctx.fillStyle = PALETTE.text
        ctx.textAlign = 'center'
        ctx.font = 'bold 20px "Space Grotesk", monospace'
        ctx.fillText(
          t(over ? 'gameOver' : 'paused'),
          BOARD_X + (COLS * CELL) / 2,
          BOARD_Y + (ROWS * CELL) / 2 - 24,
        )
        if (over) {
          ctx.font = '10px "Space Grotesk", monospace'
          ctx.fillText(
            t('gameOverHint'),
            BOARD_X + (COLS * CELL) / 2,
            BOARD_Y + (ROWS * CELL) / 2 + 8,
          )
        }
        ctx.textAlign = 'left'
      }
    }

    /* —— 引擎 —— */

    const takeFromBag = (): PieceType => {
      if (bag.length === 0) bag = shuffle([0, 1, 2, 3, 4, 5, 6])
      return bag.pop()!
    }

    const spawn = () => {
      const type = next
      next = takeFromBag()
      const matrix = SHAPES[type]
      current = { type, matrix, x: Math.floor((COLS - matrix[0].length) / 2), y: -1 }
      if (collides(board, matrix, current.x, current.y)) over = true
    }

    const lockPiece = () => {
      if (!current) return
      const { type, matrix, x, y } = current
      let lockedOut = false
      cellsOf(matrix, x, y).forEach(({ x: cx, y: cy }) => {
        if (cy < 0) {
          lockedOut = true
          return
        }
        board[cy][cx] = type
      })
      if (lockedOut) {
        over = true
        callbacks.onScore(score)
        draw()
        return
      }
      // 消行
      let cleared = 0
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((cell) => cell !== null)) {
          board.splice(r, 1)
          board.unshift(Array<PieceType | null>(COLS).fill(null))
          cleared++
          r++
        }
      }
      if (cleared > 0) {
        lines += cleared
        score += LINE_SCORES[cleared] * level
        level = 1 + Math.floor(lines / 10)
        gravityMs = GRAVITY_MS[Math.min(level - 1, GRAVITY_MS.length - 1)]
        callbacks.onScore(score)
      }
      current = null
      spawn()
      draw()
    }

    const stepDown = () => {
      if (!current || paused || over) return
      if (collides(board, current.matrix, current.x, current.y + 1)) lockPiece()
      else {
        current.y += 1
        draw()
      }
    }

    const move = (dx: number) => {
      if (!current || paused || over) return
      if (!collides(board, current.matrix, current.x + dx, current.y)) {
        current.x += dx
        draw()
      }
    }

    const rotatePiece = () => {
      if (!current || paused || over) return
      const rotated = rotateCW(current.matrix)
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
        if (!collides(board, rotated, current.x + kx, current.y + ky)) {
          current.matrix = rotated
          current.x += kx
          current.y += ky
          draw()
          return
        }
      }
    }

    const softDrop = () => {
      if (!current || paused || over) return
      if (collides(board, current.matrix, current.x, current.y + 1)) {
        lockPiece()
        return
      }
      current.y += 1
      score += 1
      callbacks.onScore(score)
      draw()
    }

    const hardDrop = () => {
      if (!current || paused || over) return
      let distance = 0
      while (!collides(board, current.matrix, current.x, current.y + 1)) {
        current.y += 1
        distance++
      }
      score += distance * 2
      callbacks.onScore(score)
      lockPiece()
    }

    const restart = () => {
      board = emptyBoard()
      bag = shuffle([0, 1, 2, 3, 4, 5, 6])
      next = takeFromBag()
      score = 0
      lines = 0
      level = 1
      gravityMs = GRAVITY_MS[0]
      paused = false
      over = false
      accumulator = 0
      callbacks.onScore(0)
      spawn()
      draw()
    }

    const loop = (now: number) => {
      const dt = Math.min(now - last, 250)
      last = now
      if (playing && !paused && !over && current) {
        accumulator += dt
        while (accumulator >= gravityMs) {
          accumulator -= gravityMs
          stepDown()
          if (!current || paused || over) break
        }
      }
      rafId = requestAnimationFrame(loop)
    }

    /* —— 输入 —— */

    const onKeyDown = (event: KeyboardEvent) => {
      if (over) {
        if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
          event.preventDefault()
          restart()
        }
        return
      }
      if (paused) return
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          move(-1)
          break
        case 'ArrowRight':
          event.preventDefault()
          move(1)
          break
        case 'ArrowDown':
          event.preventDefault()
          softDrop()
          break
        case 'ArrowUp':
        case 'x':
        case 'X':
          event.preventDefault()
          rotatePiece()
          break
        case ' ':
          event.preventDefault()
          hardDrop()
          break
      }
    }

    const buildControls = (): HTMLDivElement => {
      const controls = document.createElement('div')
      controls.className = 'tetris-controls'
      const left = document.createElement('div')
      left.className = 'group'
      const right = document.createElement('div')
      right.className = 'group'
      const mk = (label: string, aria: string, action: () => void) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.textContent = label
        btn.setAttribute('aria-label', aria)
        btn.addEventListener('click', action)
        return btn
      }
      left.append(
        mk('◀', t('moveLeft'), () => move(-1)),
        mk('▼', t('softDrop'), softDrop),
        mk('▶', t('moveRight'), () => move(1)),
      )
      right.append(mk('⟳', t('rotate'), rotatePiece), mk('⇓', t('hardDrop'), hardDrop))
      controls.append(left, right)
      return controls
    }

    /* —— GameInstance 契约 —— */

    const instance: GameInstance = {
      mount(el) {
        root = document.createElement('div')
        root.style.position = 'relative'
        root.style.width = '100%'
        root.style.height = '100%'
        canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        canvas.style.imageRendering = 'pixelated'
        canvas.style.touchAction = 'none'
        ctx = canvas.getContext('2d')
        root.appendChild(canvas)
        root.appendChild(buildControls())
        el.appendChild(root)
        window.addEventListener('keydown', onKeyDown)
        draw()
      },
      start() {
        if (playing) return
        playing = true
        last = performance.now()
        accumulator = 0
        rafId = requestAnimationFrame(loop)
      },
      pause() {
        paused = true
        draw()
      },
      resume() {
        paused = false
        last = performance.now()
        accumulator = 0
        draw()
      },
      restart() {
        restart()
      },
      destroy() {
        playing = false
        paused = false
        cancelAnimationFrame(rafId)
        window.removeEventListener('keydown', onKeyDown)
        root?.remove()
        root = null
        canvas = null
        ctx = null
      },
      setCallbacks(next) {
        callbacks = next
      },
    }

    onReady(instance)
    return () => instance.destroy()
  }, [onReady])

  return null
}

export default TetrisGame
