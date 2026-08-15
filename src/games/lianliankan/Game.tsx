import { useEffect, useRef } from 'react'
import { pickLang, useI18n } from '../../i18n'
import { scoreService } from '../../services/score'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'
import { LianliankanEngine } from './engine'
import type { LianPhase, Point, TapResult } from './engine'
import { LLK_PALETTE, SHAPE_COLORS } from './shapes'
import type { ShapeIndex } from './shapes'
import { lianliankanStrings as S } from './strings'
import './styles.css'

// ============================================================
// 连连看（二次元几何风）—— 渲染与输入层
// 规则/色板/关卡/阶段唯一出处：同目录 DESIGN.md v0.1
// 纯逻辑在 engine.ts（node 直跑可测）
// ============================================================

const W = 480
const H = 360
const BOARD_X = 16
const BOARD_Y = 68
const TILE = 38
const GAP = 2

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

    /* —— 形状绘制 —— */

    const poly = (g: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number) => {
      g.beginPath()
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / n
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        if (i === 0) g.moveTo(px, py)
        else g.lineTo(px, py)
      }
      g.closePath()
    }

    const star = (
      g: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      outer: number,
      inner: number,
    ) => {
      g.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const px = cx + Math.cos(a) * r
        const py = cy + Math.sin(a) * r
        if (i === 0) g.moveTo(px, py)
        else g.lineTo(px, py)
      }
      g.closePath()
    }

    const drawFace = (g: CanvasRenderingContext2D, cx: number, cy: number, s: number) => {
      const eyeR = Math.max(1.6, s * 0.1)
      const eyeDX = s * 0.3
      const eyeY = cy - s * 0.14
      g.fillStyle = LLK_PALETTE.face
      g.beginPath()
      g.arc(cx - eyeDX, eyeY, eyeR, 0, Math.PI * 2)
      g.arc(cx + eyeDX, eyeY, eyeR, 0, Math.PI * 2)
      g.fill()
      // 腮红
      g.fillStyle = LLK_PALETTE.blush
      g.beginPath()
      g.ellipse(cx - s * 0.52, cy + s * 0.12, s * 0.16, s * 0.1, 0, 0, Math.PI * 2)
      g.ellipse(cx + s * 0.52, cy + s * 0.12, s * 0.16, s * 0.1, 0, 0, Math.PI * 2)
      g.fill()
      // 微笑
      g.strokeStyle = LLK_PALETTE.face
      g.lineWidth = Math.max(1.4, s * 0.09)
      g.beginPath()
      g.arc(cx, cy + s * 0.12, s * 0.24, Math.PI * 0.18, Math.PI * 0.82)
      g.stroke()
    }

    const drawShape = (
      g: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      s: number,
      shape: ShapeIndex,
    ) => {
      g.fillStyle = SHAPE_COLORS[shape]
      switch (shape) {
        case 0:
          g.beginPath()
          g.arc(cx, cy, s * 0.72, 0, Math.PI * 2)
          g.fill()
          break
        case 1:
          g.beginPath()
          g.roundRect(cx - s * 0.62, cy - s * 0.62, s * 1.24, s * 1.24, 4)
          g.fill()
          break
        case 2:
          poly(g, cx, cy, s * 0.78, 3)
          g.fill()
          break
        case 3:
          poly(g, cx, cy, s * 0.66, 4)
          g.fill()
          break
        case 4:
          poly(g, cx, cy, s * 0.72, 5)
          g.fill()
          break
        case 5:
          poly(g, cx, cy, s * 0.72, 6)
          g.fill()
          break
        case 6:
          star(g, cx, cy, s * 0.8, s * 0.36)
          g.fill()
          break
      }
      drawFace(g, cx, cy, s)
    }

    /* —— 主绘制 —— */

    const draw = () => {
      if (!ctx) return
      const g = ctx
      g.imageSmoothingEnabled = true
      g.clearRect(0, 0, W, H)

      // 背景渐变 + 装饰星屑
      const bg = g.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, LLK_PALETTE.bgTop)
      bg.addColorStop(1, LLK_PALETTE.bgBottom)
      g.fillStyle = bg
      g.fillRect(0, 0, W, H)
      for (let i = 0; i < 20; i++) {
        const sx = (i * 97) % W
        const sy = (i * 53) % H
        const a = 0.25 + 0.2 * Math.sin(time * 2 + i * 1.7)
        g.fillStyle = `rgba(255, 160, 190, ${Math.max(0.05, a)})`
        g.fillRect(sx, sy, 3, 3)
      }

      // HUD
      g.textBaseline = 'top'
      g.textAlign = 'left'
      g.fillStyle = LLK_PALETTE.text
      g.font = 'bold 11px "Space Grotesk", monospace'
      g.fillText(t('level'), 16, 12)
      g.fillText(t('time'), 16, 34)
      g.fillText(t('score'), 16, 56)
      g.font = 'bold 16px "Space Grotesk", monospace'
      g.fillText(String(engine.level), 74, 10)
      const secs = Math.max(0, Math.ceil(engine.timeLeftSec))
      const timeStr = `${String(Math.floor(secs / 60)).padStart(1, '0')}:${String(secs % 60).padStart(2, '0')}`
      g.fillStyle = secs <= 10 ? LLK_PALETTE.timeWarn : LLK_PALETTE.text
      g.fillText(timeStr, 74, 32)
      g.fillStyle = LLK_PALETTE.text
      g.fillText(String(engine.score), 74, 54)

      // 棋盘卡片
      for (let row = 0; row < engine.rows; row++) {
        for (let col = 0; col < engine.cols; col++) {
          const value = engine.grid[row][col]
          if (value === null) continue
          const x = BOARD_X + col * (TILE + GAP)
          const y = BOARD_Y + row * (TILE + GAP)
          g.save()
          g.shadowColor = LLK_PALETTE.cardShadow
          g.shadowBlur = 6
          g.shadowOffsetY = 2
          g.fillStyle = LLK_PALETTE.card
          g.beginPath()
          g.roundRect(x, y, TILE, TILE, 10)
          g.fill()
          g.restore()
          drawShape(g, x + TILE / 2, y + TILE / 2, TILE * 0.26, value as ShapeIndex)
          // 选中高亮
          if (engine.selected && engine.selected.x === col && engine.selected.y === row) {
            const a = 0.55 + 0.45 * Math.sin(time * 6)
            g.strokeStyle = LLK_PALETTE.select
            g.globalAlpha = Math.max(0.3, a)
            g.lineWidth = 3
            g.beginPath()
            g.roundRect(x - 1, y - 1, TILE + 2, TILE + 2, 11)
            g.stroke()
            g.globalAlpha = 1
          }
          // 提示高亮
          if (
            hintPair &&
            ((hintPair[0].x === col && hintPair[0].y === row) ||
              (hintPair[1].x === col && hintPair[1].y === row))
          ) {
            const a = 0.5 + 0.5 * Math.sin(time * 5)
            g.strokeStyle = LLK_PALETTE.hint
            g.globalAlpha = Math.max(0.3, a)
            g.lineWidth = 3
            g.beginPath()
            g.roundRect(x - 2, y - 2, TILE + 4, TILE + 4, 12)
            g.stroke()
            g.globalAlpha = 1
          }
        }
      }

      // 匹配连接线
      if (matchFx && matchFx.t < 0.35) {
        const alpha = 1 - matchFx.t / 0.35
        g.strokeStyle = LLK_PALETTE.select
        g.lineWidth = 4
        g.lineJoin = 'round'
        g.globalAlpha = alpha
        g.beginPath()
        matchFx.path.forEach((p, i) => {
          const cx = BOARD_X + p.x * (TILE + GAP) + TILE / 2
          const cy = BOARD_Y + p.y * (TILE + GAP) + TILE / 2
          if (i === 0) g.moveTo(cx, cy)
          else g.lineTo(cx, cy)
        })
        g.stroke()
        g.globalAlpha = 1
      }

      // 星屑粒子
      particles.forEach((p) => {
        g.globalAlpha = Math.max(0, p.life / 0.6)
        g.fillStyle = LLK_PALETTE.select
        g.beginPath()
        g.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        g.fill()
      })
      g.globalAlpha = 1

      // 连击提示
      if (engine.combo >= 2 && engine.phase === 'playing') {
        g.fillStyle = LLK_PALETTE.select
        g.font = 'bold 13px "Space Grotesk", monospace'
        g.fillText(`${t('combo')} ×${engine.combo}`, BOARD_X, H - 18)
      }

      // 自动洗牌提示
      if (toastT > 0) {
        const alpha = Math.min(1, toastT / 0.4)
        g.globalAlpha = alpha
        g.fillStyle = 'rgba(255, 253, 253, 0.92)'
        const tw = g.measureText(toastText).width + 24
        g.beginPath()
        g.roundRect(W / 2 - tw / 2, BOARD_Y + 10, tw, 30, 15)
        g.fill()
        g.fillStyle = LLK_PALETTE.text
        g.font = 'bold 12px "Space Grotesk", monospace'
        g.textAlign = 'center'
        g.fillText(toastText, W / 2, BOARD_Y + 19)
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
          `✦ ${t('hint')} ×${engine.hintsLeft}`,
          t('hint'),
          () => {
            const hint = engine.useHint()
            if (hint) hintPair = hint
          },
          !inPlay || engine.hintsLeft <= 0,
        ),
        mk(
          `⇄ ${t('shuffle')} ×${engine.shufflesLeft}`,
          t('shuffle'),
          () => {
            if (engine.shuffleRemaining()) hintPair = null
          },
          !inPlay || engine.shufflesLeft <= 0,
        ),
        mk(
          '⏸',
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
        const cx = BOARD_X + cell.x * (TILE + GAP) + TILE / 2
        const cy = BOARD_Y + cell.y * (TILE + GAP) + TILE / 2
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
