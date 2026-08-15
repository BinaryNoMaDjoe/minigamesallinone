import { useEffect, useRef } from 'react'
import { pickLang, useI18n } from '../../i18n'
import { scoreService } from '../../services/score'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'
import { LianliankanEngine } from './engine'
import type { LianPhase, Point, TapResult } from './engine'
import { getSprite, SPRITE_PALETTES, SPRITE_SIZE } from './pixel'
import { LLK_PALETTE } from './shapes'
import type { ShapeIndex } from './shapes'
import { lianliankanStrings as S } from './strings'
import './styles.css'

// ============================================================
// 连连看（星露谷式像素风）—— 渲染与输入层
// 规则/关卡/阶段唯一出处：同目录 DESIGN.md v0.2；像素精灵在 pixel.ts
// 纯逻辑在 engine.ts（node 直跑可测）
// ============================================================

const W = 480
const H = 360
const BOARD_X = 16
const BOARD_Y = 68
const TILE = 32
const GAP = 2
const SCALE = 2
const PIXEL_FONT = '"Press Start 2P", monospace'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

interface MatchFx {
  path: Point[]
  t: number
}

export const LianliankanGame: GameComponent = ({ onReady }) => {
  const { lang } = useI18n()
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    const engine = new LianliankanEngine()
    let root: HTMLDivElement | null = null
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    let toolsEl: HTMLDivElement | null = null
    let overlayEl: HTMLDivElement | null = null
    let panelEl: HTMLDivElement | null = null
    let rafId = 0
    let running = false
    let last = performance.now()
    let time = 0
    let lastScore = engine.score
    let lastPhase: LianPhase = engine.phase
    let lastUiKey = ''
    let matchFx: MatchFx | null = null
    let particles: Particle[] = []
    let hintPair: [Point, Point] | null = null
    let toastText = ''
    let toastT = 0
    let callbacks: GameCallbacks = { onScore: () => {} }

    const t = (key: keyof typeof S) => pickLang(S[key], langRef.current)
    const fmt = (key: 'levelClear', n: number) =>
      pickLang(S[key], langRef.current).replace('{n}', String(n))

    /* —— 像素绘制 —— */

    const tileX = (col: number) => BOARD_X + col * (TILE + GAP)
    const tileY = (row: number) => BOARD_Y + row * (TILE + GAP)

    const drawSprite = (g: CanvasRenderingContext2D, shape: ShapeIndex, x: number, y: number) => {
      const sprite = getSprite(shape)
      const palette = SPRITE_PALETTES[shape]
      for (let py = 0; py < SPRITE_SIZE; py++) {
        for (let px = 0; px < SPRITE_SIZE; px++) {
          const ch = sprite[py][px]
          if (ch === '.') continue
          const color =
            ch === 'K'
              ? palette.outline
              : ch === 'M'
                ? palette.main
                : ch === 'H'
                  ? palette.light
                  : ch === 'S'
                    ? palette.dark
                    : ch === 'E'
                      ? palette.face
                      : palette.blush
          g.fillStyle = color
          g.fillRect(x + px * SCALE, y + py * SCALE, SCALE, SCALE)
        }
      }
    }

    const drawCloud = (g: CanvasRenderingContext2D, x: number, y: number) => {
      g.fillStyle = LLK_PALETTE.cloud
      g.fillRect(x, y, 28, 8)
      g.fillRect(x + 8, y - 8, 12, 8)
    }

    const draw = () => {
      if (!ctx) return
      const g = ctx
      g.imageSmoothingEnabled = false
      g.clearRect(0, 0, W, H)

      // 天空 + 云朵（避开左上状态框）
      g.fillStyle = LLK_PALETTE.sky
      g.fillRect(0, 0, W, H)
      drawCloud(g, 168, 14)
      drawCloud(g, 330, 30)

      // 草地
      g.fillStyle = LLK_PALETTE.grass
      g.fillRect(0, 244, W, H - 244)
      g.fillStyle = LLK_PALETTE.grassDark
      for (let y = 254; y < H; y += 14) {
        const offset = ((y / 14) % 2) * 10
        for (let x = 6 + offset; x < W; x += 26) g.fillRect(x, y, 6, 3)
      }

      // 棋盘：木框 + 面板
      g.fillStyle = LLK_PALETTE.frame
      g.fillRect(
        BOARD_X - 4,
        BOARD_Y - 4,
        engine.cols * (TILE + GAP) + 6,
        engine.rows * (TILE + GAP) + 6,
      )
      g.fillStyle = LLK_PALETTE.panel
      g.fillRect(
        BOARD_X - 2,
        BOARD_Y - 2,
        engine.cols * (TILE + GAP) + 2,
        engine.rows * (TILE + GAP) + 2,
      )

      // 棋盘网格线（淡棕 1px，替代占位点，更整洁）
      g.strokeStyle = LLK_PALETTE.panelLine
      g.lineWidth = 1
      g.beginPath()
      for (let c = 0; c <= engine.cols; c++) {
        const x = BOARD_X + c * (TILE + GAP) - 1
        g.moveTo(x, BOARD_Y)
        g.lineTo(x, BOARD_Y + engine.rows * (TILE + GAP))
      }
      for (let r = 0; r <= engine.rows; r++) {
        const y = BOARD_Y + r * (TILE + GAP) - 1
        g.moveTo(BOARD_X, y)
        g.lineTo(BOARD_X + engine.cols * (TILE + GAP), y)
      }
      g.stroke()

      // 方块精灵
      for (let row = 0; row < engine.rows; row++) {
        for (let col = 0; col < engine.cols; col++) {
          const value = engine.grid[row][col]
          if (value === null) continue
          drawSprite(g, value as ShapeIndex, tileX(col), tileY(row))
          // 选中高亮（黄框脉冲）
          if (engine.selected && engine.selected.x === col && engine.selected.y === row) {
            const a = 0.5 + 0.5 * Math.sin(time * 6)
            g.strokeStyle = LLK_PALETTE.select
            g.globalAlpha = Math.max(0.35, a)
            g.lineWidth = 2
            g.strokeRect(tileX(col) - 2, tileY(row) - 2, TILE + 4, TILE + 4)
            g.globalAlpha = 1
          }
          // 提示高亮（白框脉冲）
          if (
            hintPair &&
            ((hintPair[0].x === col && hintPair[0].y === row) ||
              (hintPair[1].x === col && hintPair[1].y === row))
          ) {
            const a = 0.5 + 0.5 * Math.sin(time * 5)
            g.strokeStyle = LLK_PALETTE.hint
            g.globalAlpha = Math.max(0.35, a)
            g.lineWidth = 2
            g.strokeRect(tileX(col) - 2, tileY(row) - 2, TILE + 4, TILE + 4)
            g.globalAlpha = 1
          }
        }
      }

      // 匹配连接线（像素折线 + 端点方块）
      if (matchFx && matchFx.t < 0.35) {
        const alpha = 1 - matchFx.t / 0.35
        g.strokeStyle = LLK_PALETTE.line
        g.lineWidth = 3
        g.globalAlpha = alpha
        g.beginPath()
        matchFx.path.forEach((p, i) => {
          const cx = tileX(p.x) + TILE / 2
          const cy = tileY(p.y) + TILE / 2
          if (i === 0) g.moveTo(cx, cy)
          else g.lineTo(cx, cy)
        })
        g.stroke()
        g.fillStyle = LLK_PALETTE.sparkle
        const first = matchFx.path[0]
        const lastP = matchFx.path[matchFx.path.length - 1]
        g.fillRect(tileX(first.x) + TILE / 2 - 2, tileY(first.y) + TILE / 2 - 2, 4, 4)
        g.fillRect(tileX(lastP.x) + TILE / 2 - 2, tileY(lastP.y) + TILE / 2 - 2, 4, 4)
        g.globalAlpha = 1
      }

      // 星屑粒子（方块）
      particles.forEach((p) => {
        g.globalAlpha = Math.max(0, p.life / 0.6)
        g.fillStyle = LLK_PALETTE.sparkle
        g.fillRect(p.x - 2, p.y - 2, 4, 4)
      })
      g.globalAlpha = 1

      // HUD：左上木框状态箱（三行，像素字体）
      const boxX = 12
      const boxY = 8
      const boxW = 170
      const boxH = 58
      g.fillStyle = LLK_PALETTE.uiBg
      g.fillRect(boxX, boxY, boxW, boxH)
      g.strokeStyle = LLK_PALETTE.uiBorder
      g.lineWidth = 2
      g.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2)
      g.textBaseline = 'top'
      g.textAlign = 'left'
      g.font = `8px ${PIXEL_FONT}`
      g.fillStyle = LLK_PALETTE.text
      g.fillText(`${t('level')} ${engine.level}`, boxX + 8, boxY + 8)
      const secs = Math.max(0, Math.ceil(engine.timeLeftSec))
      const timeStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
      g.fillStyle = secs <= 10 ? LLK_PALETTE.timeWarn : LLK_PALETTE.text
      g.fillText(`${t('time')} ${timeStr}`, boxX + 8, boxY + 26)
      g.fillStyle = LLK_PALETTE.text
      g.fillText(`${t('score')} ${engine.score}`, boxX + 8, boxY + 44)

      // 连击提示（带 1px 阴影提高可读性）
      if (engine.combo >= 2 && engine.phase === 'playing') {
        g.fillStyle = LLK_PALETTE.uiShadow
        g.fillText(`${t('combo')} x${engine.combo}`, 21, 301)
        g.fillStyle = LLK_PALETTE.select
        g.fillText(`${t('combo')} x${engine.combo}`, 20, 300)
      }

      // 自动洗牌提示
      if (toastT > 0) {
        const alpha = Math.min(1, toastT / 0.4)
        g.globalAlpha = alpha
        g.fillStyle = LLK_PALETTE.toastBg
        g.fillRect(W / 2 - 80, 20, 160, 26)
        g.strokeStyle = LLK_PALETTE.uiBorder
        g.lineWidth = 2
        g.strokeRect(W / 2 - 80, 20, 160, 26)
        g.fillStyle = LLK_PALETTE.text
        g.font = `8px ${PIXEL_FONT}`
        g.textAlign = 'center'
        g.fillText(toastText, W / 2, 29)
        g.textAlign = 'left'
        g.globalAlpha = 1
      }
    }

    /* —— 浮层与道具 —— */

    const mkBtn = (label: string, onClick: () => void, primary = false) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = label
      btn.className = primary ? 'llk-btn primary' : 'llk-btn'
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

    const uiKey = () =>
      `${engine.phase}|${engine.victory}|${engine.frozen}|${engine.level}|${engine.hintsLeft}|${engine.shufflesLeft}`

    const renderOverlay = () => {
      if (!overlayEl || !panelEl) return
      panelEl.replaceChildren()
      const h = document.createElement('h2')
      if (engine.victory) {
        h.textContent = t('winTitle')
        panelEl.append(h, row(t('score'), String(engine.score)))
        panelEl.append(mkBtn(t('playAgain'), () => engine.startRun(), true))
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      } else if (engine.phase === 'menu') {
        h.textContent = t('title')
        panelEl.append(h, row(t('best'), String(scoreService.best('lianliankan'))))
        panelEl.append(mkBtn(t('start'), () => engine.startRun(), true))
        const hint = document.createElement('div')
        hint.className = 'hint'
        hint.textContent = t('menuHint')
        panelEl.append(hint)
      } else if (engine.phase === 'paused') {
        h.textContent = t('paused')
        panelEl.append(h)
        panelEl.append(mkBtn(t('resume'), () => engine.resume(), true))
        panelEl.append(mkBtn(t('restart'), () => engine.startRun()))
        panelEl.append(mkBtn(t('endRun'), () => engine.endRun()))
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      } else if (engine.phase === 'over') {
        h.textContent = t('timeUp')
        panelEl.append(h, row(t('score'), String(engine.score)))
        panelEl.append(mkBtn(t('retry'), () => engine.startRun(), true))
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      } else if (engine.frozen) {
        h.textContent = fmt('levelClear', engine.level)
        panelEl.append(h, row(t('timeBonus'), `+${Math.ceil(engine.timeLeftSec) * 5}`))
        panelEl.append(mkBtn(t('nextLevel'), () => engine.nextLevel(), true))
      }
      overlayEl.style.display = panelEl.children.length > 0 ? 'flex' : 'none'
    }

    const updateTools = () => {
      if (!toolsEl) return
      toolsEl.replaceChildren()
      const mk = (label: string, aria: string, onClick: () => void, disabled: boolean) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.textContent = label
        btn.setAttribute('aria-label', aria)
        btn.disabled = disabled
        if (!disabled) btn.addEventListener('click', onClick)
        return btn
      }
      const inPlay = engine.phase === 'playing' && !engine.frozen
      toolsEl.append(
        mk(
          `${t('hint')} x${engine.hintsLeft}`,
          t('hint'),
          () => {
            const hint = engine.useHint()
            if (hint) hintPair = hint
          },
          !inPlay || engine.hintsLeft <= 0,
        ),
        mk(
          `${t('shuffle')} x${engine.shufflesLeft}`,
          t('shuffle'),
          () => {
            if (engine.shuffleRemaining()) hintPair = null
          },
          !inPlay || engine.shufflesLeft <= 0,
        ),
        mk(
          t('pauseAction'),
          t('pauseAction'),
          () => {
            if (engine.phase === 'playing') engine.pause()
            else if (engine.phase === 'paused') engine.resume()
          },
          engine.phase !== 'playing' && engine.phase !== 'paused',
        ),
      )
    }

    const sync = () => {
      if (engine.score !== lastScore) {
        lastScore = engine.score
        callbacks.onScore(engine.score)
      }
      if (engine.phase !== lastPhase) {
        lastPhase = engine.phase
        callbacks.onPhase?.(engine.phase)
      }
      const key = uiKey()
      if (key !== lastUiKey) {
        lastUiKey = key
        renderOverlay()
        updateTools()
      }
    }

    /* —— 主循环 —— */

    const loop = (now: number) => {
      const dt = Math.min(now - last, 250)
      last = now
      time += dt / 1000
      if (running) engine.tick(dt / 1000)
      if (matchFx) {
        matchFx.t += dt / 1000
        if (matchFx.t >= 0.35) matchFx = null
      }
      particles = particles.filter((p) => {
        p.x += p.vx * (dt / 1000)
        p.y += p.vy * (dt / 1000)
        p.life -= dt / 1000
        return p.life > 0
      })
      if (toastT > 0) toastT -= dt / 1000
      sync()
      draw()
      rafId = requestAnimationFrame(loop)
    }

    /* —— 输入 —— */

    const cellOf = (px: number, py: number): Point | null => {
      const col = Math.floor((px - BOARD_X) / (TILE + GAP))
      const row = Math.floor((py - BOARD_Y) / (TILE + GAP))
      if (col < 0 || col >= engine.cols || row < 0 || row >= engine.rows) return null
      return { x: col, y: row }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const px = ((event.clientX - rect.left) / rect.width) * W
      const py = ((event.clientY - rect.top) / rect.height) * H
      const cell = cellOf(px, py)
      if (!cell) return
      const result: TapResult | null = engine.tap(cell.x, cell.y)
      if (!result) return
      if (result.kind === 'matched') {
        hintPair = null
        matchFx = { path: result.path, t: 0 }
        const cx = tileX(cell.x) + TILE / 2
        const cy = tileY(cell.y) + TILE / 2
        for (let i = 0; i < 10; i++) {
          const a = Math.random() * Math.PI * 2
          const sp = 40 + Math.random() * 80
          particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6 })
        }
        if (result.autoShuffled) {
          toastText = t('autoShuffle')
          toastT = 1.6
        }
      } else if (result.kind === 'no-match' || result.kind === 'blocked') {
        hintPair = null
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
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
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        engine.pause()
      }
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
        canvas.style.touchAction = 'manipulation'
        ctx = canvas.getContext('2d')
        root.appendChild(canvas)
        toolsEl = document.createElement('div')
        toolsEl.className = 'llk-tools'
        root.appendChild(toolsEl)
        overlayEl = document.createElement('div')
        overlayEl.className = 'llk-overlay'
        overlayEl.style.display = 'none'
        panelEl = document.createElement('div')
        panelEl.className = 'llk-panel'
        overlayEl.appendChild(panelEl)
        root.appendChild(overlayEl)
        el.appendChild(root)
        canvas.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('keydown', onKeyDown)
        callbacks.onPhase?.(engine.phase)
        renderOverlay()
        updateTools()
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
        canvas?.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('keydown', onKeyDown)
        root?.remove()
        root = null
        canvas = null
        ctx = null
        toolsEl = null
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

export default LianliankanGame
