import { useEffect, useRef } from 'react'
import { pickLang, useI18n } from '../../i18n'
import { scoreService } from '../../services/score'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'
import { LianliankanEngine } from './engine'
import type { LianPhase, Point, TapResult } from './engine'
import { getSprite, SPRITE_PALETTES, SPRITE_SIZE } from './pixel'
import { CHAPTERS } from './themes'
import type { ChapterId, ChapterPalette } from './themes'
import { lianliankanStrings as S } from './strings'
import './styles.css'

// ============================================================
// 星露谷连连看（stardew clickclick）—— 渲染与输入层
// 规则/关卡/大关/阶段唯一出处：同目录 DESIGN.md v0.6
// 纯逻辑在 engine.ts（node 直跑可测）；精灵图鉴 pixel.ts；主题 themes.ts
// ============================================================

const W = 480
const H = 360
const BOARD_X = 16
const BOARD_Y = 68
const TILE = 32
const GAP = 2
const SCALE = 2
const PIXEL_FONT = '"Press Start 2P", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

interface MatchFx {
  /** 含起终点的连线路径（engine.tap 已补齐起点，DESIGN.md §10 缺陷 #1） */
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
    let lastLevel = engine.level
    let lastChapter = engine.chapter
    let matchFx: MatchFx | null = null
    let particles: Particle[] = []
    let hintPair: [Point, Point] | null = null
    let toastText = ''
    let toastT = 0
    let callbacks: GameCallbacks = { onScore: () => {} }

    const t = (key: keyof typeof S) => pickLang(S[key], langRef.current)
    const fmt = (key: 'chapterIntro', n: number, name: string) =>
      pickLang(S[key], langRef.current).replace('{n}', String(n)).replace('{name}', name)

    const toastChapter = () => {
      const theme = CHAPTERS[engine.chapter] ?? CHAPTERS[0]
      const name = pickLang(theme.name, langRef.current)
      toastText = fmt('chapterIntro', engine.chapter + 1, name)
      toastT = 2.4
    }

    /* —— 像素绘制 —— */

    const tileX = (col: number) => BOARD_X + col * (TILE + GAP)
    const tileY = (row: number) => BOARD_Y + row * (TILE + GAP)

    const drawSprite = (g: CanvasRenderingContext2D, id: number, x: number, y: number) => {
      const sprite = getSprite(id)
      const palette = SPRITE_PALETTES[id]
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
                      : ch === 'B'
                        ? palette.blush
                        : ch === 'A'
                          ? palette.accent
                          : palette.accentLight
          g.fillStyle = color
          g.fillRect(x + px * SCALE, y + py * SCALE, SCALE, SCALE)
        }
      }
    }

    /** 六大关场景（DESIGN.md §3/§4.1；装饰一律避开左上 HUD 区 x<190,y<66） */
    const drawScene = (g: CanvasRenderingContext2D, p: ChapterPalette, id: ChapterId) => {
      g.fillStyle = p.sky
      g.fillRect(0, 0, W, H)
      switch (id) {
        case 'spring-farm': {
          g.fillStyle = p.cloud
          g.fillRect(208, 14, 28, 8)
          g.fillRect(216, 6, 12, 8)
          g.fillRect(336, 32, 22, 6)
          g.fillStyle = p.decor
          g.fillRect(392, 10, 12, 12)
          g.fillStyle = p.ground
          g.fillRect(0, 244, W, H - 244)
          g.fillStyle = p.groundDark
          for (let y = 254; y < H; y += 14) {
            const offset = ((y / 14) % 2) * 10
            for (let x = 6 + offset; x < W; x += 26) g.fillRect(x, y, 6, 3)
          }
          break
        }
        case 'summer-beach': {
          g.fillStyle = p.decor
          g.fillRect(392, 12, 14, 14)
          g.fillStyle = p.skyAlt
          g.fillRect(0, 204, W, 52)
          g.fillStyle = p.cloud
          for (const y of [212, 226, 240]) {
            for (let x = 8; x < W; x += 48) g.fillRect(x + (y % 24), y, 16, 3)
          }
          g.fillStyle = p.ground
          g.fillRect(0, 256, W, H - 256)
          g.fillStyle = p.groundDark
          for (let y = 268; y < H; y += 16) {
            for (let x = 10 + ((y / 16) % 2) * 12; x < W; x += 44) g.fillRect(x, y, 6, 3)
          }
          break
        }
        case 'autumn-forest': {
          // 远处树影（树干+树冠，frame 深木色剪影，位于棋盘下方草地可见带）
          g.fillStyle = p.frame
          for (const [tx, th] of [
            [8, 40],
            [52, 34],
            [404, 38],
          ] as [number, number][]) {
            g.fillRect(tx + 12, 330 - th, 6, th)
            g.fillRect(tx, 330 - th - 18, 30, 18)
          }
          g.fillStyle = p.ground
          g.fillRect(0, 244, W, H - 244)
          g.fillStyle = p.groundDark
          for (let y = 254; y < H; y += 14) {
            const offset = ((y / 14) % 2) * 12
            for (let x = 4 + offset; x < W; x += 30) g.fillRect(x, y, 7, 3)
          }
          g.fillStyle = p.decor
          for (const [lx, ly] of [
            [16, 262],
            [58, 278],
            [104, 252],
            [150, 268],
            [204, 254],
            [250, 272],
            [302, 258],
            [348, 276],
            [394, 252],
            [446, 268],
            [28, 330],
            [186, 332],
            [330, 334],
            [452, 326],
          ] as [number, number][]) {
            g.fillRect(lx, ly, 4, 3)
          }
          break
        }
        case 'town-folk': {
          g.fillStyle = p.cloud
          g.fillRect(214, 12, 26, 8)
          g.fillRect(220, 4, 14, 8)
          // 两栋民居剪影（白墙 + 装饰色屋顶 + 深窗；右侧一栋下移避开道具列）
          for (const [hx, hw, dy] of [
            [2, 52, 0],
            [300, 48, 12],
          ] as [number, number, number][]) {
            g.fillStyle = p.cloud
            g.fillRect(hx, 208 + dy, hw, 40)
            g.fillStyle = p.decor
            g.fillRect(hx - 4, 198 + dy, hw + 8, 12)
            g.fillStyle = p.frame
            g.fillRect(hx + 8, 220 + dy, 10, 12)
            g.fillRect(hx + hw - 18, 220 + dy, 10, 12)
          }
          g.fillStyle = p.ground
          g.fillRect(0, 250, W, H - 250)
          g.fillStyle = p.groundDark
          for (let y = 258; y < H; y += 12) {
            const offset = ((y / 12) % 2) * 14
            for (let x = 2 + offset; x < W; x += 40) g.fillRect(x, y, 12, 2)
          }
          break
        }
        case 'deep-mines': {
          g.fillStyle = p.skyAlt
          g.fillRect(0, 0, W, 12)
          g.fillStyle = p.groundDark
          for (let y = 24; y < H; y += 18) {
            for (let x = 8 + ((y / 18) % 3) * 7; x < W; x += 42) g.fillRect(x, y, 5, 4)
          }
          // 岩壁晶簇（decor 紫晶 + cloud 亮点，避开棋盘与道具列）
          g.fillStyle = p.decor
          for (const [cx, cy] of [
            [4, 140],
            [4, 168],
            [452, 220],
            [462, 242],
            [452, 300],
            [8, 312],
          ] as [number, number][]) {
            g.fillRect(cx, cy, 8, 8)
            g.fillRect(cx + 2, cy - 6, 4, 6)
          }
          g.fillStyle = p.cloud
          for (const [cx, cy] of [
            [6, 144],
            [454, 224],
            [454, 304],
          ] as [number, number][]) {
            g.fillRect(cx, cy, 4, 4)
          }
          // 火把（火焰随 time 闪烁，位于棋盘两侧可见带）
          g.fillStyle = p.ground
          g.fillRect(0, 250, W, H - 250)
          g.fillStyle = p.groundDark
          for (let y = 262; y < H; y += 20) {
            for (let x = 14 + ((y / 20) % 2) * 10; x < W; x += 46) g.fillRect(x, y, 6, 3)
          }
          for (const tx of [6, 462]) {
            g.fillStyle = p.frame
            g.fillRect(tx, 234, 4, 16)
            g.fillStyle = p.select
            const flicker = Math.floor(time * 8) % 2
            g.fillRect(tx - 2, 222 + flicker * 2, 8, 12 - flicker * 2)
          }
          break
        }
        case 'winter-festival': {
          // 星空（避开左上 HUD 状态箱）
          g.fillStyle = p.cloud
          for (const [sx, sy] of [
            [200, 14],
            [252, 30],
            [300, 44],
            [380, 22],
            [436, 40],
            [330, 8],
            [210, 30],
            [262, 52],
          ] as [number, number][]) {
            g.fillRect(sx, sy, 3, 3)
          }
          // 飘雪（随 time 下落）
          for (let i = 0; i < 12; i++) {
            const sx = 8 + ((i * 41) % 464)
            const sy = ((i * 37 + Math.floor(time * 28)) % (H + 20)) - 10
            g.fillRect(sx, sy, 3, 3)
            g.fillRect(sx + 1, sy + 3, 2, 2)
          }
          // 远处松影（frame 冰蓝木色，位于棋盘下方雪地可见带）
          g.fillStyle = p.frame
          g.fillRect(10, 288, 24, 8)
          g.fillRect(16, 278, 12, 10)
          g.fillRect(19, 296, 6, 6)
          g.fillRect(452, 288, 20, 8)
          g.fillRect(457, 278, 10, 10)
          g.fillRect(459, 296, 4, 6)
          // 雪地
          g.fillStyle = p.ground
          g.fillRect(0, 244, W, H - 244)
          g.fillStyle = p.groundDark
          for (let y = 252; y < H; y += 16) {
            for (let x = 6 + ((y / 16) % 2) * 14; x < W; x += 52) g.fillRect(x, y, 10, 3)
          }
          g.fillStyle = p.decor
          g.fillRect(300, 252, 8, 8)
          g.fillRect(306, 246, 4, 6)
          break
        }
      }
    }

    const draw = () => {
      if (!ctx) return
      const g = ctx
      const theme = CHAPTERS[engine.chapter] ?? CHAPTERS[0]
      const p = theme.palette
      g.imageSmoothingEnabled = false
      g.clearRect(0, 0, W, H)

      drawScene(g, p, theme.id)

      // 棋盘：木框 + 面板
      g.fillStyle = p.frame
      g.fillRect(
        BOARD_X - 4,
        BOARD_Y - 4,
        engine.cols * (TILE + GAP) + 6,
        engine.rows * (TILE + GAP) + 6,
      )
      g.fillStyle = p.panel
      g.fillRect(
        BOARD_X - 2,
        BOARD_Y - 2,
        engine.cols * (TILE + GAP) + 2,
        engine.rows * (TILE + GAP) + 2,
      )

      // 棋盘网格线（淡色 1px）
      g.strokeStyle = p.panelLine
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

      // 元素精灵
      for (let row = 0; row < engine.rows; row++) {
        for (let col = 0; col < engine.cols; col++) {
          const value = engine.grid[row][col]
          if (value === null) continue
          drawSprite(g, value, tileX(col), tileY(row))
          // 选中高亮（主题色框脉冲）
          if (engine.selected && engine.selected.x === col && engine.selected.y === row) {
            const a = 0.5 + 0.5 * Math.sin(time * 6)
            g.strokeStyle = p.select
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
            g.strokeStyle = p.hint
            g.globalAlpha = Math.max(0.35, a)
            g.lineWidth = 2
            g.strokeRect(tileX(col) - 2, tileY(row) - 2, TILE + 4, TILE + 4)
            g.globalAlpha = 1
          }
        }
      }

      // 匹配连接线：1px 深色衬底 + 3px 主题色（DESIGN.md §10 缺陷 #6），含起终点
      if (matchFx && matchFx.t < 0.35) {
        const alpha = 1 - matchFx.t / 0.35
        const pts = matchFx.path.map((pt) => ({
          x: tileX(pt.x) + TILE / 2,
          y: tileY(pt.y) + TILE / 2,
        }))
        g.globalAlpha = alpha
        g.lineCap = 'butt'
        g.strokeStyle = p.lineDark
        g.lineWidth = 5
        g.beginPath()
        pts.forEach((pt, i) => (i === 0 ? g.moveTo(pt.x, pt.y) : g.lineTo(pt.x, pt.y)))
        g.stroke()
        g.strokeStyle = p.line
        g.lineWidth = 3
        g.beginPath()
        pts.forEach((pt, i) => (i === 0 ? g.moveTo(pt.x, pt.y) : g.lineTo(pt.x, pt.y)))
        g.stroke()
        g.fillStyle = p.sparkle
        g.fillRect(pts[0].x - 2, pts[0].y - 2, 4, 4)
        g.fillRect(pts[pts.length - 1].x - 2, pts[pts.length - 1].y - 2, 4, 4)
        g.globalAlpha = 1
      }

      // 星屑粒子（方块）
      particles.forEach((pt) => {
        g.globalAlpha = Math.max(0, pt.life / 0.6)
        g.fillStyle = p.sparkle
        g.fillRect(pt.x - 2, pt.y - 2, 4, 4)
      })
      g.globalAlpha = 1

      // HUD：左上木框状态箱（三行，像素字体）
      const boxX = 12
      const boxY = 8
      const boxW = 170
      const boxH = 58
      g.fillStyle = p.uiBg
      g.fillRect(boxX, boxY, boxW, boxH)
      g.strokeStyle = p.uiBorder
      g.lineWidth = 2
      g.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2)
      g.textBaseline = 'top'
      g.textAlign = 'left'
      g.font = `8px ${PIXEL_FONT}`
      g.fillStyle = p.text
      g.fillText(`${t('level')} ${engine.level}`, boxX + 8, boxY + 8)
      const secs = Math.max(0, Math.ceil(engine.timeLeftSec))
      const timeStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
      g.fillStyle = secs <= 10 ? p.timeWarn : p.text
      g.fillText(`${t('time')} ${timeStr}`, boxX + 8, boxY + 26)
      g.fillStyle = p.text
      g.fillText(`${t('score')} ${engine.score}`, boxX + 8, boxY + 44)

      // 连击提示（带 1px 阴影提高可读性）
      if (engine.combo >= 2 && engine.phase === 'playing' && !engine.frozen) {
        g.fillStyle = p.uiShadow
        g.fillText(`${t('combo')} x${engine.combo}`, 21, 301)
        g.fillStyle = p.select
        g.fillText(`${t('combo')} x${engine.combo}`, 20, 300)
      }

      // 横幅提示（底部中央，避开 HUD/棋盘，DESIGN.md §10 缺陷 #5）
      if (toastT > 0) {
        const alpha = Math.min(1, toastT / 0.4)
        g.globalAlpha = alpha
        g.fillStyle = p.toastBg
        g.fillRect(W / 2 - 80, 318, 160, 26)
        g.strokeStyle = p.uiBorder
        g.lineWidth = 2
        g.strokeRect(W / 2 - 80, 318, 160, 26)
        g.fillStyle = p.text
        g.font = `8px ${PIXEL_FONT}`
        g.textAlign = 'center'
        g.fillText(toastText, W / 2, 327)
        g.textAlign = 'left'
        g.globalAlpha = 1
      }
    }

    /* —— 主题 CSS 变量（DOM 道具/浮层随大关配色） —— */

    const applyTheme = (rootEl: HTMLDivElement, p: ChapterPalette) => {
      const vars: Record<string, string> = {
        '--llk-ui-bg': p.uiBg,
        '--llk-ui-border': p.uiBorder,
        '--llk-ui-shadow': p.uiShadow,
        '--llk-text': p.text,
        '--llk-sub': p.subText,
        '--llk-btn-bg': p.toastBg,
        '--llk-overlay': p.overlay,
        '--llk-primary-bg': p.frame,
        // 主按钮：木框底 + 主题连线色文字（DESIGN.md §9 主按钮规则）
        '--llk-primary-text': p.line,
      }
      for (const [k, v] of Object.entries(vars)) rootEl.style.setProperty(k, v)
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
        h.textContent = pickLang(S.levelClear, langRef.current).replace('{n}', String(engine.level))
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
          (engine.phase !== 'playing' && engine.phase !== 'paused') || engine.frozen,
        ),
      )
    }

    const sync = () => {
      if (engine.score !== lastScore) {
        lastScore = engine.score
        callbacks.onScore(engine.score)
      }
      if (engine.phase !== lastPhase) {
        const prev = lastPhase
        lastPhase = engine.phase
        callbacks.onPhase?.(engine.phase)
        // 从 menu/over 开局进入 playing：显示当前大关横幅（含首关第 1 大关）
        if (engine.phase === 'playing' && (prev === 'menu' || prev === 'over')) {
          // 同关卡重开/重试时 level 可能不变：此处统一清残留（DESIGN.md §10 缺陷 #2）
          hintPair = null
          matchFx = null
          toastChapter()
        }
      }
      // 关卡变化：清提示高亮与连线特效（DESIGN.md §10 缺陷 #2），防止残影落于新棋盘
      if (engine.level !== lastLevel) {
        const chapterChanged = engine.chapter !== lastChapter
        lastLevel = engine.level
        hintPair = null
        matchFx = null
        // 跨大关推进：大关横幅
        if (chapterChanged) toastChapter()
      }
      // 大关变化：换主题配色
      if (engine.chapter !== lastChapter) {
        lastChapter = engine.chapter
        if (root) applyTheme(root, CHAPTERS[engine.chapter].palette)
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
      // playing：过关冻结面板支持回车/空格进入下一关（DESIGN.md §10 缺陷 #4）
      if (engine.frozen) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          engine.nextLevel()
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
        // 容器查询基准（§4.3 窄窗紧凑布局，styles.css @container）
        root.style.containerType = 'inline-size'
        canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        canvas.style.imageRendering = 'pixelated'
        // §4.3：游戏画布 touch-action: none（指针事件统一处理，防触屏手势干扰）
        canvas.style.touchAction = 'none'
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
        applyTheme(root, CHAPTERS[0].palette)
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
