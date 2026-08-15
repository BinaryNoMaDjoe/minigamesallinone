import { useEffect, useRef } from 'react'
import { pickLang, useI18n } from '../../i18n'
import { scoreService } from '../../services/score'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'
import { PIECE_COLORS, PALETTE, SHAPES } from './pieces'
import { TetrisEngine } from './engine'
import type { TetrisPhase } from './engine'
import { tetrisStrings as S } from './strings'
import './styles.css'

// ============================================================
// 俄罗斯方块（像素风）—— 渲染与输入层
// 规则/阶段状态机/色板/布局唯一出处：同目录 DESIGN.md v0.3
// 纯逻辑在 engine.ts（node 直跑可测）；本文件只做 DOM/Canvas
// 阶段：menu（主菜单）→ playing → paused/over（ADR-0007、决策 #24）
// ============================================================

const COLS = 10
const ROWS = 20
const CELL = 16
const BOARD_X = 8
const BOARD_Y = 64
const W = 320
const H = 448
/** 右侧信息面板（DESIGN.md v0.4 §3：填满画布空白区） */
const PANEL_X = 176
const PANEL_W = 136
const PIXEL_FONT = '"Press Start 2P", monospace'

export const TetrisGame: GameComponent = ({ onReady }) => {
  const { lang } = useI18n()
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    const engine = new TetrisEngine()
    let root: HTMLDivElement | null = null
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    let controlsEl: HTMLDivElement | null = null
    let overlayEl: HTMLDivElement | null = null
    let panelEl: HTMLDivElement | null = null
    let rafId = 0
    let running = false
    let last = performance.now()
    let lastScore = engine.score
    let lastPhase: TetrisPhase = engine.phase
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

    /** 像素信息框（DESIGN.md v0.4 §3） */
    const drawBox = (x: number, y: number, w: number, h: number) => {
      if (!ctx) return
      ctx.fillStyle = PALETTE.board
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = PALETTE.ink
      ctx.lineWidth = 2
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
    }

    const drawNextPreview = () => {
      if (!ctx) return
      const type = engine.nextType
      const matrix = SHAPES[type]
      const cells: { x: number; y: number }[] = []
      matrix.forEach((row, r) => row.forEach((value, c) => value && cells.push({ x: c, y: r })))
      const minX = Math.min(...cells.map((c) => c.x))
      const maxX = Math.max(...cells.map((c) => c.x))
      const minY = Math.min(...cells.map((c) => c.y))
      const maxY = Math.max(...cells.map((c) => c.y))
      const cell = 12
      const pieceW = (maxX - minX + 1) * cell
      const pieceH = (maxY - minY + 1) * cell
      // NEXT 框：y 64..160，标签下方区域 y 86..156 内居中
      const ox = PANEL_X + Math.round((PANEL_W - pieceW) / 2)
      const oy = 86 + Math.round((70 - pieceH) / 2)
      cells.forEach(({ x, y }) =>
        drawCell(ox + (x - minX) * cell, oy + (y - minY) * cell, cell, PIECE_COLORS[type]),
      )
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
      engine.board.forEach((row, r) => {
        row.forEach((value, c) => {
          if (value !== null) {
            drawCell(BOARD_X + c * CELL, BOARD_Y + r * CELL, CELL, PIECE_COLORS[value])
          }
        })
      })

      // 幽灵块 + 当前方块
      const piece = engine.current
      if (piece && engine.phase !== 'menu') {
        const gy = engine.ghostY
        if (gy !== null) {
          ctx.fillStyle = PALETTE.ghost
          piece.matrix.forEach((row, r) =>
            row.forEach((value, c) => {
              if (!value) return
              const y = gy + r
              if (y < 0) return
              ctx!.fillRect(BOARD_X + (piece.x + c) * CELL, BOARD_Y + y * CELL, CELL, CELL)
            }),
          )
        }
        piece.matrix.forEach((row, r) =>
          row.forEach((value, c) => {
            if (!value) return
            const y = piece.y + r
            if (y < 0) return
            drawCell(
              BOARD_X + (piece.x + c) * CELL,
              BOARD_Y + y * CELL,
              CELL,
              PIECE_COLORS[piece.type],
            )
          }),
        )
      }

      // 顶部条：标题 + 分数
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.text
      ctx.font = `12px ${PIXEL_FONT}`
      ctx.fillText(t('title'), 16, 18)
      ctx.font = `8px ${PIXEL_FONT}`
      ctx.fillText(t('score'), PANEL_X, 14)
      ctx.font = `10px ${PIXEL_FONT}`
      ctx.fillText(String(engine.score), PANEL_X, 32)

      // 右侧信息面板：NEXT / LEVEL / LINES / 键位提示（填满空白区）
      drawBox(PANEL_X, 64, PANEL_W, 96)
      drawBox(PANEL_X, 168, PANEL_W, 56)
      drawBox(PANEL_X, 232, PANEL_W, 56)
      drawBox(PANEL_X, 296, PANEL_W, 88)
      ctx.fillStyle = PALETTE.text
      ctx.font = `8px ${PIXEL_FONT}`
      ctx.fillText(t('next'), PANEL_X + 10, 74)
      ctx.fillText(t('level'), PANEL_X + 10, 178)
      ctx.fillText(t('lines'), PANEL_X + 10, 242)
      ctx.font = `10px ${PIXEL_FONT}`
      ctx.fillText(String(engine.level), PANEL_X + 10, 198)
      ctx.fillText(String(engine.lines), PANEL_X + 10, 262)
      ctx.font = `8px ${PIXEL_FONT}`
      ctx.fillStyle = PALETTE.text
      ctx.fillText(t('hintMove'), PANEL_X + 10, 308)
      ctx.fillText(t('hintRotate'), PANEL_X + 10, 326)
      ctx.fillText(t('hintDrop'), PANEL_X + 10, 344)
      ctx.fillText(t('hintPause'), PANEL_X + 10, 362)
      if (engine.phase !== 'menu') drawNextPreview()
    }

    /* —— 阶段菜单浮层（DOM，无障碍可达）—— */

    const mkBtn = (label: string, onClick: () => void, primary = false) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = label
      btn.className = primary ? 'tetris-btn primary' : 'tetris-btn'
      btn.addEventListener('click', onClick)
      return btn
    }

    const row = (label: string, value: string) => {
      const el = document.createElement('div')
      el.className = 'row'
      const l = document.createElement('span')
      l.textContent = label
      const v = document.createElement('b')
      v.textContent = value
      el.append(l, v)
      return el
    }

    const renderOverlay = () => {
      if (!overlayEl || !panelEl || !controlsEl) return
      panelEl.replaceChildren()
      const p = engine.phase
      if (p === 'menu') {
        const h = document.createElement('h2')
        h.textContent = t('title')
        panelEl.append(h, row(t('best'), String(scoreService.best('tetris'))))
        panelEl.append(mkBtn(t('start'), () => engine.startRun(), true))
        const hint = document.createElement('div')
        hint.className = 'hint'
        hint.textContent = t('menuHint')
        panelEl.append(hint)
      } else if (p === 'paused') {
        const h = document.createElement('h2')
        h.textContent = t('paused')
        panelEl.append(h)
        panelEl.append(mkBtn(t('resume'), () => engine.resume(), true))
        panelEl.append(mkBtn(t('restart'), () => engine.startRun()))
        panelEl.append(mkBtn(t('endRun'), () => engine.endRun()))
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      } else if (p === 'over') {
        const h = document.createElement('h2')
        h.textContent = t('gameOver')
        panelEl.append(h)
        panelEl.append(row(t('score'), String(engine.score)))
        panelEl.append(row(t('level'), String(engine.level)))
        panelEl.append(row(t('lines'), String(engine.lines)))
        panelEl.append(mkBtn(t('playAgain'), () => engine.startRun(), true))
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      }
      overlayEl.style.display = p === 'playing' ? 'none' : 'flex'
      controlsEl.style.display = p === 'playing' || p === 'paused' ? 'flex' : 'none'
    }

    const sync = () => {
      if (engine.score !== lastScore) {
        lastScore = engine.score
        callbacks.onScore(engine.score)
      }
      if (engine.phase !== lastPhase) {
        lastPhase = engine.phase
        callbacks.onPhase?.(engine.phase)
        renderOverlay()
      }
    }

    /* —— 主循环 —— */

    const loop = (now: number) => {
      const dt = Math.min(now - last, 250)
      last = now
      if (running) engine.tick(dt)
      sync()
      draw()
      rafId = requestAnimationFrame(loop)
    }

    /* —— 输入 —— */

    const onKeyDown = (event: KeyboardEvent) => {
      // 焦点在按钮上时交给按钮（回车/空格触发点击）
      if (event.target instanceof HTMLButtonElement) return
      const p = engine.phase
      if (p === 'menu') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          engine.startRun()
        }
        return
      }
      if (p === 'over') {
        if (event.key === 'Enter') {
          event.preventDefault()
          engine.startRun()
        }
        return
      }
      if (p === 'paused') {
        if (event.key === 'Enter' || event.key.toLowerCase() === 'p') {
          event.preventDefault()
          engine.resume()
        }
        return
      }
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          engine.move(-1)
          break
        case 'ArrowRight':
          event.preventDefault()
          engine.move(1)
          break
        case 'ArrowDown':
          event.preventDefault()
          engine.softDrop()
          break
        case 'ArrowUp':
        case 'x':
        case 'X':
          event.preventDefault()
          engine.rotate()
          break
        case ' ':
          event.preventDefault()
          engine.hardDrop()
          break
        case 'p':
        case 'P':
          event.preventDefault()
          engine.pause()
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
        mk('◀', t('moveLeft'), () => engine.move(-1)),
        mk('▼', t('softDrop'), () => engine.softDrop()),
        mk('▶', t('moveRight'), () => engine.move(1)),
      )
      right.append(
        mk('⏸', t('pauseAction'), () => {
          if (engine.phase === 'playing') engine.pause()
          else if (engine.phase === 'paused') engine.resume()
        }),
        mk('⟳', t('rotate'), () => engine.rotate()),
        mk('⇓', t('hardDrop'), () => engine.hardDrop()),
      )
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
        // 容器查询基准（§4.3 窄窗紧凑布局，styles.css @container）
        root.style.containerType = 'inline-size'
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
        controlsEl = buildControls()
        root.appendChild(controlsEl)
        overlayEl = document.createElement('div')
        overlayEl.className = 'tetris-overlay'
        panelEl = document.createElement('div')
        panelEl.className = 'tetris-panel'
        overlayEl.appendChild(panelEl)
        root.appendChild(overlayEl)
        el.appendChild(root)
        window.addEventListener('keydown', onKeyDown)
        // 初始阶段上报（ADR-0007：mount 后主动同步一次）
        callbacks.onPhase?.(engine.phase)
        renderOverlay()
        draw()
      },
      start() {
        if (running) return
        running = true
        last = performance.now()
        rafId = requestAnimationFrame(loop)
      },
      pause() {
        engine.pause()
      },
      resume() {
        engine.resume()
      },
      restart() {
        engine.startRun()
      },
      destroy() {
        running = false
        cancelAnimationFrame(rafId)
        window.removeEventListener('keydown', onKeyDown)
        root?.remove()
        root = null
        canvas = null
        ctx = null
        controlsEl = null
        overlayEl = null
        panelEl = null
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
