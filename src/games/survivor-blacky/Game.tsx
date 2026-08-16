import { useEffect, useRef } from 'react'
import { pickLang, useI18n } from '../../i18n'
import { scoreService } from '../../services/score'
import { progressService } from '../../services/progress'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'
import { SurvivorEngine, WORLD_W, WORLD_H, WAVE_COUNT, WEAPON_MAX_LEVEL } from './engine'
import type { Enemy, Gem, Projectile, SpawnKind, UpgradeOption } from './engine'
import type { QuoteKey } from './engine'
import { survivorbkStrings as S } from './strings'
import type { SurvivorBkStringKey } from './strings'
import { PIXEL_PALETTE } from './sprites'
import {
  SPR_CAT_IDLE,
  SPR_CAT_WALK1,
  SPR_CAT_WALK2,
  SPR_PIG_1,
  SPR_PIG_2,
  SPR_CHICK_1,
  SPR_CHICK_2,
  SPR_DOG_1,
  SPR_DOG_2,
  SPR_PIGEON_1,
  SPR_PIGEON_2,
  SPR_MINIPIGEON,
  SPR_BOSS,
  SPR_GEM,
  SPR_HAIRBALL,
  SPR_YARN,
  SPR_BOOMERANG,
  SPR_FISH,
  SPR_BOMB,
  SPR_HEART,
  SPR_SKULL,
  SPR_CROWN,
  SPR_ICON_WEAPON,
  SPR_ICON_PASSIVE,
  SPR_ICON_ACHIEVEMENT,
} from './sprites'
import type { Sprite } from './sprites'
import './styles.css'

// ============================================================
// 幸存者小黑 —— 像素版渲染与输入层（DESIGN.md v1.1）
// 画布 960×540 = 世界 1:1（土豆兄弟式单屏竞技场，无相机）
// 全部美术为代码绘制像素精灵（sprites.ts），image-rendering: pixelated
// 屏幕状态：menu / achievements / howto / playing / paused / over + 升级浮层
// ============================================================

const W = 960
const H = 540
const GAME_ID = 'survivor-blacky'
const PS2P = '"Press Start 2P", monospace'
const PS2P_ZH = '"Press Start 2P", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", monospace'

// 场景色（DESIGN.md v1.1 §4 色板；令牌出处 + 游戏级画板）
const C = {
  ink: PIXEL_PALETTE.K,
  paper: PIXEL_PALETTE.W,
  red: PIXEL_PALETTE.R,
  blue: '#0074e4', // tokens secondary-container（Power Blue）
  yellow: PIXEL_PALETTE.Y,
  dark: PIXEL_PALETTE.X,
  grass: PIXEL_PALETTE.G,
  grassDark: PIXEL_PALETTE.g,
  path: PIXEL_PALETTE.F,
  trunk: PIXEL_PALETTE.V,
  trunkDark: '#6f4720',
  rock: PIXEL_PALETTE.L,
  rockDark: '#98a0a9',
  fence: '#a9713f',
  fenceLight: PIXEL_PALETTE.N,
  barBg: '#dcd9d9',
  pip: '#c9c4c4',
  zone: 'rgba(121,184,85,0.5)',
  zoneEdge: PIXEL_PALETTE.g,
  elite: PIXEL_PALETTE.U,
  shadowSoft: 'rgba(28,27,27,0.22)',
}

// —— 视觉状态（仅本层） ——
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
}
interface PopText {
  x: number
  y: number
  text: string
  life: number
  max: number
  size: number
  color: string
  crit: boolean
}
interface Banner {
  wave: number
  t: number
}
interface QuoteBubble {
  text: string
  t: number
}
interface Prop {
  kind: 'tree' | 'rock' | 'bush' | 'flower'
  x: number
  y: number
  s: number
  seed: number
}
interface ToastItem {
  text: string
  t: number
}

const QUOTE_TEXT: Record<QuoteKey, SurvivorBkStringKey> = {
  start: 'quoteStart',
  boss: 'quoteBoss',
  lowHp: 'quoteLowHp',
  levelUp: 'quoteLevelUp',
  victory: 'quoteVictory',
}

const ENEMY_PARTICLE_COLOR: Record<SpawnKind, string> = {
  pig: C.red,
  chicken: C.paper,
  dog: C.fenceLight,
  pigeon: C.rock,
  minipigeon: C.paper,
  boss: C.red,
}

// —— 精灵缓存：网格 → 离屏 canvas（含翻转/缩放变体） ——
const spriteCache = new Map<string, HTMLCanvasElement>()

function spriteCanvas(sprite: Sprite, scale: number, flip: boolean): HTMLCanvasElement {
  const width = Math.max(...sprite.map((r) => r.length))
  const height = sprite.length
  const key = (flip ? 'F' : 'N') + ':' + scale + ':' + width + 'x' + height + ':' + sprite[0]
  const hit = spriteCache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  for (let y = 0; y < height; y++) {
    const row = sprite[y]!
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]!
      if (ch === '.') continue
      const color = PIXEL_PALETTE[ch]
      if (!color) continue
      const dx = flip ? width - 1 - x : x
      ctx.fillStyle = color
      ctx.fillRect(
        Math.round(dx * scale),
        Math.round(y * scale),
        Math.max(1, Math.round(scale)),
        Math.max(1, Math.round(scale)),
      )
    }
  }
  spriteCache.set(key, canvas)
  return canvas
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale = 1,
  flip = false,
  alpha = 1,
): void {
  const img = spriteCanvas(sprite, scale, flip)
  if (alpha < 1) ctx.globalAlpha = alpha
  ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2))
  if (alpha < 1) ctx.globalAlpha = 1
}

function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/** 布景（树/石/灌木/花，固定种子，避开出生点） */
function makeProps(): Prop[] {
  const rng = seededRng(20260815)
  const props: Prop[] = []
  const kinds: Prop['kind'][] = ['tree', 'tree', 'rock', 'bush', 'bush', 'flower', 'flower']
  for (let i = 0; i < 26; i++) {
    const x = 40 + rng() * (WORLD_W - 80)
    const y = 40 + rng() * (WORLD_H - 80)
    const dx = x - WORLD_W / 2
    const dy = y - WORLD_H / 2
    if (dx * dx + dy * dy < 130 * 130) continue
    props.push({ kind: kinds[i % kinds.length]!, x, y, s: 0.8 + rng() * 0.5, seed: rng() * 10 })
  }
  return props
}

// ============================================================
// 成就定义（DESIGN.md v1.1 §7；判定条件为会话内快照）
// ============================================================
interface AchievementDef {
  id: string
  icon: Sprite
  nameKey: SurvivorBkStringKey
  descKey: SurvivorBkStringKey
  cumulative: boolean
  check: (g: AchievementCtx) => boolean
}
interface AchievementCtx {
  engine: SurvivorEngine
  sessionKills: number
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_kill',
    icon: SPR_ICON_ACHIEVEMENT.first_kill!,
    nameKey: 'ach_first_kill',
    descKey: 'ach_first_kill_desc',
    cumulative: false,
    check: (g) => g.engine.kills >= 1,
  },
  {
    id: 'kill_100',
    icon: SPR_ICON_ACHIEVEMENT.kill_100!,
    nameKey: 'ach_kill_100',
    descKey: 'ach_kill_100_desc',
    cumulative: true,
    check: (g) => progressService.totalKills() + g.sessionKills >= 100,
  },
  {
    id: 'kill_1000',
    icon: SPR_ICON_ACHIEVEMENT.kill_1000!,
    nameKey: 'ach_kill_1000',
    descKey: 'ach_kill_1000_desc',
    cumulative: true,
    check: (g) => progressService.totalKills() + g.sessionKills >= 1000,
  },
  {
    id: 'wave5',
    icon: SPR_ICON_ACHIEVEMENT.wave5!,
    nameKey: 'ach_wave5',
    descKey: 'ach_wave5_desc',
    cumulative: false,
    check: (g) => g.engine.wave >= 5,
  },
  {
    id: 'wave10',
    icon: SPR_ICON_ACHIEVEMENT.wave10!,
    nameKey: 'ach_wave10',
    descKey: 'ach_wave10_desc',
    cumulative: false,
    check: (g) => g.engine.wave >= 10,
  },
  {
    id: 'win',
    icon: SPR_ICON_ACHIEVEMENT.win!,
    nameKey: 'ach_win',
    descKey: 'ach_win_desc',
    cumulative: false,
    check: (g) => g.engine.outcome === 'win',
  },
  {
    id: 'gem500',
    icon: SPR_ICON_ACHIEVEMENT.gem500!,
    nameKey: 'ach_gem500',
    descKey: 'ach_gem500_desc',
    cumulative: false,
    check: (g) => g.engine.gemsCollected >= 500,
  },
  {
    id: 'weapon_max',
    icon: SPR_ICON_ACHIEVEMENT.weapon_max!,
    nameKey: 'ach_weapon_max',
    descKey: 'ach_weapon_max_desc',
    cumulative: false,
    check: (g) => g.engine.weapons.some((w) => w.level >= WEAPON_MAX_LEVEL),
  },
  {
    id: 'all_weapons',
    icon: SPR_ICON_ACHIEVEMENT.all_weapons!,
    nameKey: 'ach_all_weapons',
    descKey: 'ach_all_weapons_desc',
    cumulative: false,
    check: (g) => g.engine.weapons.length >= 6,
  },
  {
    id: 'level15',
    icon: SPR_ICON_ACHIEVEMENT.level15!,
    nameKey: 'ach_level15',
    descKey: 'ach_level15_desc',
    cumulative: false,
    check: (g) => g.engine.currentLevel >= 15,
  },
  {
    id: 'pig_death',
    icon: SPR_ICON_ACHIEVEMENT.pig_death!,
    nameKey: 'ach_pig_death',
    descKey: 'ach_pig_death_desc',
    cumulative: false,
    check: (g) => g.engine.outcome === 'lose' && g.engine.deathCause === 'pig',
  },
  {
    id: 'perfect_wave1',
    icon: SPR_ICON_ACHIEVEMENT.perfect_wave1!,
    nameKey: 'ach_perfect_wave1',
    descKey: 'ach_perfect_wave1_desc',
    cumulative: false,
    check: (g) => g.engine.wave >= 2 && g.engine.hitsTaken === 0,
  },
]

// ============================================================
// 组件主体
// ============================================================

export const SurvivorBkGame: GameComponent = ({ onReady }) => {
  const { lang } = useI18n()
  const langRef = useRef(lang)
  langRef.current = lang

  useEffect(() => {
    const engine = new SurvivorEngine()
    const props = makeProps()
    let root: HTMLDivElement | null = null
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    let overlayEl: HTMLDivElement | null = null
    let panelEl: HTMLDivElement | null = null
    let levelupEl: HTMLDivElement | null = null
    let toastEl: HTMLDivElement | null = null
    let rafId = 0
    let running = false
    let last = performance.now()

    let callbacks: GameCallbacks = { onScore: () => {} }
    let lastScore = engine.score
    let lastPhase = engine.phase
    let lastPending = 0
    let lastLang: string = langRef.current
    let lastScreen = ''

    // 屏幕子状态（menu 阶段内）：menu / achievements / howto
    let screen: 'menu' | 'achievements' | 'howto' = 'menu'

    // 视觉状态
    const particles: Particle[] = []
    const popTexts: PopText[] = []
    let banner: Banner | null = null
    let quote: QuoteBubble | null = null
    let shake = 0
    let hurtFlash = 0
    let walkT = 0
    let time = 0
    const keys = new Set<string>()
    const joy = { active: false, ax: 0, ay: 0, dx: 0, dy: 0 }
    // 成就
    let flushedKills = 0
    const toasts: ToastItem[] = []
    let toastTimer = 0

    const t = (key: SurvivorBkStringKey) => pickLang(S[key], langRef.current)

    /* ================= 成就系统 ================= */

    const toast = (text: string): void => {
      toasts.push({ text, t: 3 })
      if (toasts.length > 4) toasts.shift()
      toastTimer = 3
      renderToasts()
    }

    const checkAchievements = (): void => {
      const sessionKills = engine.kills - flushedKills
      for (const def of ACHIEVEMENTS) {
        if (progressService.isUnlocked(def.id)) continue
        if (!def.check({ engine, sessionKills })) continue
        if (progressService.unlock(def.id)) {
          toast(t('achToast') + ' · ' + t(def.nameKey))
          if (def.cumulative) {
            progressService.addKills(sessionKills)
            flushedKills = engine.kills
          }
        }
      }
    }

    const flushKills = (): void => {
      const pending = engine.kills - flushedKills
      if (pending > 0) {
        progressService.addKills(pending)
        flushedKills = engine.kills
      }
    }

    /* ================= 事件 → 视觉 ================= */

    const addPop = (
      x: number,
      y: number,
      text: string,
      size: number,
      color: string,
      crit: boolean,
    ): void => {
      if (popTexts.length > 36) popTexts.shift()
      popTexts.push({ x, y, text, life: 0.9, max: 0.9, size, color, crit })
    }

    const burst = (x: number, y: number, color: string, count: number): void => {
      for (let i = 0; i < count; i++) {
        if (particles.length > 260) particles.shift()
        const a = Math.random() * Math.PI * 2
        const sp = 30 + Math.random() * 90
        particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 30,
          life: 0.4 + Math.random() * 0.3,
          max: 0.7,
          size: 2,
          color,
        })
      }
    }

    const handleEvents = (events: ReturnType<SurvivorEngine['drainEvents']>): void => {
      for (const ev of events) {
        switch (ev.type) {
          case 'hit':
            addPop(
              ev.x,
              ev.y,
              String(ev.amount),
              ev.crit ? 9 : 7,
              ev.crit ? C.yellow : C.paper,
              ev.crit,
            )
            break
          case 'kill': {
            burst(ev.x, ev.y, ENEMY_PARTICLE_COLOR[ev.kind], ev.tier === 'boss' ? 22 : 6)
            if (popTexts.length < 8) {
              const pool = S.onomatopoeia
              const word = pool[Math.floor(Math.random() * pool.length)]!
              const colors = [C.paper, C.yellow, C.red]
              addPop(
                ev.x,
                ev.y - 8,
                word,
                6,
                colors[Math.floor(Math.random() * colors.length)]!,
                false,
              )
            }
            break
          }
          case 'collect':
            particles.push({
              x: ev.x,
              y: ev.y,
              vx: 0,
              vy: -20,
              life: 0.25,
              max: 0.25,
              size: 1,
              color: C.yellow,
            })
            break
          case 'wave':
            banner = { wave: ev.wave, t: 0 }
            break
          case 'boss':
            shake = 10
            burst(engine.boss?.x ?? engine.player.x, engine.boss?.y ?? engine.player.y, C.red, 18)
            break
          case 'boom': {
            shake = Math.max(shake, 6)
            burst(ev.x, ev.y, C.yellow, 7)
            burst(ev.x, ev.y, C.dark, 7)
            break
          }
          case 'zone':
            for (let i = 0; i < 5; i++) {
              particles.push({
                x: ev.x + (Math.random() - 0.5) * 40,
                y: ev.y + (Math.random() - 0.5) * 40,
                vx: 0,
                vy: -14,
                life: 1.2,
                max: 1.2,
                size: 3,
                color: C.zone,
              })
            }
            break
          case 'hurt':
            hurtFlash = 1
            shake = Math.max(shake, 5)
            break
          case 'quote':
            quote = { text: t(QUOTE_TEXT[ev.key]), t: 0 }
            break
          case 'levelup':
          case 'over':
            break
        }
      }
    }

    /* ================= 更新 ================= */

    const updateVisuals = (dt: number): void => {
      time += dt
      shake = Math.max(0, shake - dt * 24)
      hurtFlash = Math.max(0, hurtFlash - dt * 3.2)
      if (banner) {
        banner.t += dt
        if (banner.t > 2.6) banner = null
      }
      if (quote) {
        quote.t += dt
        if (quote.t > 3.2) quote = null
      }
      if (toastTimer > 0) {
        toastTimer -= dt
        if (toastTimer <= 0 && toasts.length > 0) {
          toasts.shift()
          toastTimer = toasts.length > 0 ? 3 : 0
          renderToasts()
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!
        p.life -= dt
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 220 * dt
      }
      for (let i = popTexts.length - 1; i >= 0; i--) {
        const pop = popTexts[i]!
        pop.life -= dt
        pop.y -= 26 * dt
        if (pop.life <= 0) popTexts.splice(i, 1)
      }
      if (engine.player.moving) walkT += dt
    }

    /* ================= 渲染：场地 ================= */

    const drawGround = (): void => {
      if (!ctx) return
      ctx.fillStyle = C.grass
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = C.grassDark
      const cell = 40
      for (let gx = 0; gx < W; gx += cell) {
        for (let gy = 0; gy < H; gy += cell) {
          if ((Math.floor(gx / cell) + Math.floor(gy / cell)) % 2 === 0) {
            ctx.fillRect(gx, gy, cell, cell)
          }
        }
      }
      // 十字土路
      ctx.fillStyle = C.path
      ctx.fillRect(WORLD_W / 2 - 55, 0, 110, H)
      ctx.fillRect(0, WORLD_H / 2 - 55, W, 110)
      // 栅栏
      ctx.fillStyle = C.fence
      for (let x = 0; x <= W; x += 60) {
        ctx.fillRect(x - 3, 0, 6, 16)
        ctx.fillRect(x - 3, H - 16, 6, 16)
      }
      for (let y = 0; y <= H; y += 60) {
        ctx.fillRect(0, y - 3, 16, 6)
        ctx.fillRect(W - 16, y - 3, 16, 6)
      }
      ctx.fillStyle = C.ink
      ctx.fillRect(0, 0, W, 2)
      ctx.fillRect(0, H - 2, W, 2)
      ctx.fillRect(0, 0, 2, H)
      ctx.fillRect(W - 2, 0, 2, H)
    }

    const drawProps = (): void => {
      if (!ctx) return
      for (const p of props) {
        const s = p.s
        switch (p.kind) {
          case 'tree': {
            ctx.fillStyle = C.shadowSoft
            ctx.fillRect(
              Math.round(p.x - 10 * s),
              Math.round(p.y + 4 * s),
              Math.round(20 * s),
              Math.round(5 * s),
            )
            ctx.fillStyle = C.trunk
            ctx.fillRect(
              Math.round(p.x - 2 * s),
              Math.round(p.y - 4 * s),
              Math.round(4 * s),
              Math.round(9 * s),
            )
            const canopy: [number, number, number, number, string][] = [
              [-9, -12, 18, 9, C.ink],
              [-8, -11, 16, 7, C.grassDark],
              [-5, -14, 10, 5, C.ink],
              [-4, -13, 8, 3, C.grass],
            ]
            for (const [dx, dy, w, h, color] of canopy) {
              ctx.fillStyle = color
              ctx.fillRect(
                Math.round(p.x + dx * s),
                Math.round(p.y + dy * s),
                Math.round(w * s),
                Math.round(h * s),
              )
            }
            break
          }
          case 'rock': {
            ctx.fillStyle = C.shadowSoft
            ctx.fillRect(
              Math.round(p.x - 7 * s),
              Math.round(p.y + 2 * s),
              Math.round(14 * s),
              Math.round(4 * s),
            )
            ctx.fillStyle = C.ink
            ctx.fillRect(
              Math.round(p.x - 7 * s),
              Math.round(p.y - 4 * s),
              Math.round(14 * s),
              Math.round(7 * s),
            )
            ctx.fillStyle = C.rock
            ctx.fillRect(
              Math.round(p.x - 6 * s),
              Math.round(p.y - 3 * s),
              Math.round(12 * s),
              Math.round(5 * s),
            )
            ctx.fillStyle = C.rockDark
            ctx.fillRect(
              Math.round(p.x - 6 * s),
              Math.round(p.y + 1 * s),
              Math.round(12 * s),
              Math.round(2 * s),
            )
            break
          }
          case 'bush': {
            ctx.fillStyle = C.ink
            ctx.fillRect(
              Math.round(p.x - 7 * s),
              Math.round(p.y - 4 * s),
              Math.round(14 * s),
              Math.round(6 * s),
            )
            ctx.fillStyle = C.grassDark
            ctx.fillRect(
              Math.round(p.x - 6 * s),
              Math.round(p.y - 3 * s),
              Math.round(12 * s),
              Math.round(4 * s),
            )
            ctx.fillStyle = C.grass
            ctx.fillRect(
              Math.round(p.x - 3 * s),
              Math.round(p.y - 6 * s),
              Math.round(6 * s),
              Math.round(3 * s),
            )
            break
          }
          case 'flower': {
            const sway = Math.round(Math.sin(time * 2 + p.seed) * 1)
            const color = p.seed % 2 < 1 ? C.red : C.paper
            ctx.fillStyle = color
            ctx.fillRect(Math.round(p.x) + sway - 1, Math.round(p.y - 6), 2, 2)
            ctx.fillRect(Math.round(p.x) + sway - 4, Math.round(p.y - 3), 2, 2)
            ctx.fillRect(Math.round(p.x) + sway + 2, Math.round(p.y - 3), 2, 2)
            ctx.fillStyle = C.yellow
            ctx.fillRect(Math.round(p.x) + sway - 1, Math.round(p.y - 3), 2, 2)
            ctx.fillStyle = C.ink
            ctx.fillRect(Math.round(p.x) + sway, Math.round(p.y - 1), 1, 2)
            break
          }
        }
      }
    }

    /* ================= 渲染：实体 ================= */

    const catSprite = (moving: boolean): Sprite => {
      if (!moving) return SPR_CAT_IDLE
      return Math.floor(time * 8) % 2 === 0 ? SPR_CAT_WALK1 : SPR_CAT_WALK2
    }

    const drawTail = (x: number, y: number, facing: number, moving: boolean): void => {
      if (!ctx) return
      const flip = Math.cos(facing) < 0
      const dir = flip ? 1 : -1
      const sway = Math.sin(time * 3 + (moving ? walkT * 6 : 0)) * 0.4
      let px = x + dir * 7
      let py = y + 3
      ctx.fillStyle = C.ink
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2)
      for (let i = 0; i < 4; i++) {
        px += dir * (2 + sway)
        py += 1.5
        const color = i >= 2 ? C.paper : C.ink
        ctx.fillStyle = color
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2)
      }
    }

    const drawCat = (): void => {
      if (!ctx) return
      const p = engine.player
      const flip = Math.cos(p.facing) < 0
      ctx.fillStyle = C.shadowSoft
      ctx.fillRect(Math.round(p.x - 7), Math.round(p.y + 5), 14, 3)
      if (p.invuln > 0 && Math.floor(time * 16) % 2 === 0) {
        drawSprite(ctx, catSprite(p.moving), p.x, p.y, 1.5, flip, 0.55)
      } else {
        drawSprite(ctx, catSprite(p.moving), p.x, p.y, 1.5, flip)
      }
      drawTail(p.x, p.y, p.facing, p.moving)
      if (p.hurtT > 0) {
        ctx.globalAlpha = Math.min(1, p.hurtT * 4) * 0.45
        ctx.fillStyle = C.red
        ctx.fillRect(Math.round(p.x - 8), Math.round(p.y - 10), 16, 18)
        ctx.globalAlpha = 1
      }
    }

    const enemySprite = (e: Enemy): { sprite: Sprite; scale: number } => {
      switch (e.kind) {
        case 'pig':
          return {
            sprite: Math.floor(time * 6 + e.wobbleSeed) % 2 === 0 ? SPR_PIG_1 : SPR_PIG_2,
            scale: 1,
          }
        case 'chicken':
          return {
            sprite: Math.floor(time * 10 + e.wobbleSeed) % 2 === 0 ? SPR_CHICK_1 : SPR_CHICK_2,
            scale: 1,
          }
        case 'dog':
          return {
            sprite: Math.floor(time * 8 + e.wobbleSeed) % 2 === 0 ? SPR_DOG_1 : SPR_DOG_2,
            scale: 1,
          }
        case 'pigeon':
          return {
            sprite: Math.floor(time * 5 + e.wobbleSeed) % 2 === 0 ? SPR_PIGEON_1 : SPR_PIGEON_2,
            scale: 1,
          }
        case 'minipigeon':
          return { sprite: SPR_MINIPIGEON, scale: 1 }
        case 'boss':
          return { sprite: SPR_BOSS, scale: 1.5 }
      }
    }

    const drawEnemy = (e: Enemy): void => {
      if (!ctx) return
      const flip = Math.cos(e.facing) < 0
      const { sprite, scale } = enemySprite(e)
      const shW = e.kind === 'boss' ? 24 : Math.min(e.radius, 10)
      ctx.fillStyle = C.shadowSoft
      ctx.fillRect(Math.round(e.x - shW), Math.round(e.y + e.radius * 0.7), Math.round(shW * 2), 3)
      if (e.spawnT > 0) {
        const k = 1 - e.spawnT / 0.4
        drawSprite(ctx, sprite, e.x, e.y, scale * Math.min(1, k * 3), flip)
        return
      }
      drawSprite(ctx, sprite, e.x, e.y, scale, flip)
      if (e.tier === 'elite') {
        ctx.fillStyle = C.elite
        ctx.fillRect(Math.round(e.x - 3), Math.round(e.y - e.radius - 8), 6, 2)
        ctx.fillRect(Math.round(e.x - 1), Math.round(e.y - e.radius - 11), 2, 3)
        ctx.globalAlpha = 0.4 + Math.sin(time * 6) * 0.2
        ctx.strokeStyle = C.elite
        ctx.lineWidth = 1
        ctx.strokeRect(
          Math.round(e.x - e.radius - 2),
          Math.round(e.y - e.radius - 2),
          Math.round(e.radius * 2 + 4),
          Math.round(e.radius * 2 + 4),
        )
        ctx.globalAlpha = 1
      }
      if (e.flash > 0) {
        ctx.globalAlpha = Math.min(1, e.flash * 8) * 0.7
        ctx.fillStyle = C.paper
        ctx.fillRect(
          Math.round(e.x - e.radius),
          Math.round(e.y - e.radius * 0.7),
          Math.round(e.radius * 2),
          Math.round(e.radius * 1.4),
        )
        ctx.globalAlpha = 1
      }
      if (e.burnT > 0) {
        ctx.fillStyle = Math.floor(time * 10) % 2 === 0 ? C.yellow : C.red
        ctx.fillRect(
          Math.round(e.x + Math.sin(time * 9 + e.wobbleSeed) * 4 - 1),
          Math.round(e.y - e.radius - 3),
          2,
          2,
        )
      }
    }

    const drawGem = (g: Gem): void => {
      if (!ctx) return
      const bob = Math.round(Math.sin(time * 4 + g.x * 0.05 + g.y * 0.03) * 1.5)
      drawSprite(ctx, SPR_GEM, g.x, g.y + bob, 1)
      if (g.magnet) {
        ctx.globalAlpha = 0.35
        ctx.fillStyle = C.yellow
        ctx.fillRect(Math.round(g.x - 1), Math.round(g.y - 1), 2, 2)
        ctx.globalAlpha = 1
      }
    }

    const drawProjectile = (p: Projectile): void => {
      if (!ctx) return
      switch (p.kind) {
        case 'homing':
          drawSprite(ctx, SPR_HAIRBALL, p.x, p.y, 1)
          break
        case 'orbit':
          drawSprite(ctx, SPR_YARN, p.x, p.y, 1)
          break
        case 'boomerang': {
          const ang = Math.atan2(p.vy, p.vx) + time * 10
          ctx.save()
          ctx.translate(Math.round(p.x), Math.round(p.y))
          ctx.rotate(ang)
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(spriteCanvas(SPR_BOOMERANG, 1, false), -4, -2)
          ctx.restore()
          break
        }
        case 'beam': {
          const alpha = Math.max(0, p.life / 0.16)
          ctx.globalAlpha = alpha
          ctx.strokeStyle = C.red
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.fx, p.fy)
          ctx.stroke()
          ctx.strokeStyle = C.paper
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.fillStyle = C.paper
          ctx.fillRect(Math.round(p.fx) - 2, Math.round(p.fy) - 2, 4, 4)
          ctx.globalAlpha = 1
          break
        }
        case 'straight': {
          const ang = Math.atan2(p.vy, p.vx)
          ctx.save()
          ctx.translate(Math.round(p.x), Math.round(p.y))
          ctx.rotate(ang)
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(spriteCanvas(SPR_FISH, 1, false), -3, -2)
          ctx.restore()
          break
        }
        case 'bomb': {
          drawSprite(ctx, SPR_BOMB, p.x, p.y, 1)
          if (Math.floor(time * 14) % 2 === 0) {
            ctx.fillStyle = C.yellow
            ctx.fillRect(Math.round(p.x + 3), Math.round(p.y - 9), 2, 2)
          }
          break
        }
        case 'zone': {
          const alpha = Math.max(0, Math.min(0.5, p.life / 3))
          ctx.globalAlpha = alpha
          ctx.fillStyle = C.zone
          ctx.fillRect(Math.round(p.x - 30), Math.round(p.y - 30), 60, 60)
          ctx.globalAlpha = 1
          break
        }
      }
    }

    /* ================= 渲染：HUD ================= */

    const pxText = (
      text: string,
      x: number,
      y: number,
      size: number,
      color: string,
      align: CanvasTextAlign = 'left',
      shadow = true,
    ): void => {
      if (!ctx) return
      ctx.font = size + 'px ' + PS2P_ZH
      ctx.textAlign = align
      ctx.textBaseline = 'top'
      if (shadow) {
        ctx.fillStyle = C.ink
        ctx.fillText(text, x + 1, y + 1)
      }
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
    }

    const panel = (x: number, y: number, w: number, h: number): void => {
      if (!ctx) return
      ctx.fillStyle = C.ink
      ctx.fillRect(x + 3, y + 3, w, h)
      ctx.fillStyle = C.paper
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
    }

    const drawHUD = (): void => {
      if (!ctx) return
      const p = engine.player
      const lowHp = p.hp < 0.3 * p.maxHp
      const pulse = lowHp ? 0.6 + Math.sin(time * 8) * 0.4 : 1
      // —— 生命条 ——
      panel(8, 8, 216, 26)
      drawSprite(ctx, SPR_HEART, 22, 21, 1)
      ctx.fillStyle = C.barBg
      ctx.fillRect(36, 14, 150, 14)
      const hpRatio = Math.max(0, p.hp / p.maxHp)
      ctx.globalAlpha = pulse
      ctx.fillStyle = C.red
      ctx.fillRect(36, 14, Math.round(150 * hpRatio), 14)
      ctx.globalAlpha = 1
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1
      ctx.strokeRect(36, 14, 150, 14)
      for (let i = 1; i < 10; i++) ctx.fillRect(36 + i * 15, 14, 1, 14)
      pxText(Math.max(0, Math.ceil(p.hp)) + '/' + p.maxHp, 190, 16, 7, C.ink, 'left', false)
      // —— 经验条 ——
      panel(8, 40, 216, 18)
      drawSprite(ctx, SPR_GEM, 20, 49, 1)
      ctx.fillStyle = C.barBg
      ctx.fillRect(30, 45, 150, 8)
      ctx.fillStyle = C.blue
      ctx.fillRect(30, 45, Math.round(150 * Math.min(1, engine.xp / engine.xpNext)), 8)
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1
      ctx.strokeRect(30, 45, 150, 8)
      pxText('LV ' + engine.currentLevel, 184, 45, 6, C.ink, 'left', false)
      // —— 右上：时间/波次/击杀 ——
      panel(W - 216, 8, 208, 34)
      const mm = String(Math.floor(engine.survived / 60)).padStart(2, '0')
      const ss = String(Math.floor(engine.survived % 60)).padStart(2, '0')
      pxText(mm + ':' + ss, W - 206, 14, 7, C.ink)
      pxText('WAVE ' + engine.wave + '/' + WAVE_COUNT, W - 130, 14, 7, C.red)
      pxText('KILLS ' + engine.kills, W - 206, 26, 7, C.ink)
      drawSprite(ctx, SPR_SKULL, W - 16, 21, 1)
      // —— 武器槽 ——
      if (engine.weapons.length > 0) {
        const n = engine.weapons.length
        const slot = 26
        const startX = 8
        const startY = H - 30
        panel(startX, startY - 2, slot * n + 4, 30)
        for (let i = 0; i < n; i++) {
          const wpn = engine.weapons[i]!
          const icon = SPR_ICON_WEAPON[wpn.id] ?? SPR_ICON_WEAPON.hairball!
          drawSprite(ctx, icon, startX + i * slot + 8, startY + 6, 1)
          for (let l = 0; l < 5; l++) {
            const dotX = startX + i * slot + 4 + l * 4
            const dotY = startY + 20
            ctx.fillStyle =
              l < wpn.level ? (wpn.level >= WEAPON_MAX_LEVEL ? C.yellow : C.ink) : C.pip
            ctx.fillRect(dotX, dotY, 2, 2)
          }
        }
      }
      // —— BOSS 血条 ——
      const boss = engine.boss
      if (boss) {
        const bw = 400
        const bx = W / 2 - bw / 2
        panel(bx - 6, 8, bw + 12, 30)
        drawSprite(ctx, SPR_CROWN, bx + 8, 17, 1)
        pxText(t('hudBossHp'), bx + 18, 13, 6, C.ink, 'left', false)
        ctx.fillStyle = C.barBg
        ctx.fillRect(bx, 25, bw, 8)
        ctx.fillStyle = C.red
        ctx.fillRect(bx, 25, Math.round(bw * Math.max(0, boss.hp / boss.maxHp)), 8)
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 1
        ctx.strokeRect(bx, 25, bw, 8)
      }
      // —— 波次横幅 ——
      if (banner) {
        const bt = banner.t
        const slideIn = Math.min(1, bt / 0.25)
        const slideOut = bt > 2.2 ? Math.max(0, 1 - (bt - 2.2) / 0.4) : 1
        const alpha = Math.min(slideIn, slideOut)
        const y = 118 + (1 - slideIn) * -60
        const names = S.waveNames
        const name = pickLang(names[Math.min(banner.wave, names.length) - 1]!, langRef.current)
        ctx.globalAlpha = alpha
        ctx.fillStyle = C.ink
        ctx.fillRect(W / 2 - 200 + 4, y + 4, 400, 52)
        ctx.fillStyle = C.red
        ctx.fillRect(W / 2 - 200, y, 400, 52)
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 2
        ctx.strokeRect(W / 2 - 200, y, 400, 52)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.font = '10px ' + PS2P_ZH
        ctx.fillStyle = C.paper
        ctx.fillText('WAVE ' + banner.wave, W / 2, y + 9)
        ctx.font = '8px ' + PS2P_ZH
        ctx.fillText(name, W / 2, y + 30)
        ctx.globalAlpha = 1
      }
      // —— 台词气泡 ——
      if (quote && engine.phase === 'playing') {
        const qx = engine.player.x
        const qy = engine.player.y - 34
        const alpha = quote.t > 2.6 ? Math.max(0, 1 - (quote.t - 2.6) / 0.6) : 1
        ctx.globalAlpha = alpha
        ctx.font = '6px ' + PS2P_ZH
        const tw = ctx.measureText(quote.text).width
        const bw = Math.round(tw) + 14
        ctx.fillStyle = C.paper
        ctx.fillRect(Math.round(qx - bw / 2), Math.round(qy - 9), bw, 14)
        ctx.fillStyle = C.ink
        ctx.fillRect(Math.round(qx - bw / 2), Math.round(qy - 9), bw, 1)
        ctx.fillRect(Math.round(qx - bw / 2), Math.round(qy + 4), bw, 1)
        ctx.fillRect(Math.round(qx - bw / 2), Math.round(qy - 9), 1, 14)
        ctx.fillRect(Math.round(qx + bw / 2 - 1), Math.round(qy - 9), 1, 14)
        ctx.fillRect(Math.round(qx - 3), Math.round(qy + 5), 2, 3)
        ctx.fillStyle = C.ink
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(quote.text, qx, Math.round(qy - 5))
        ctx.globalAlpha = 1
      }
      // —— 虚拟摇杆 ——
      if (joy.active) {
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(joy.ax, joy.ay, 40, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 0.6
        ctx.fillStyle = C.paper
        ctx.beginPath()
        ctx.arc(joy.ax + joy.dx, joy.ay + joy.dy, 16, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = C.ink
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      // —— 低血警示 / 受伤闪屏 ——
      if (lowHp && engine.phase === 'playing') {
        ctx.globalAlpha = (0.16 + Math.sin(time * 6) * 0.08) * pulse
        ctx.fillStyle = C.red
        ctx.fillRect(0, 0, W, H)
        ctx.globalAlpha = 0.5 + Math.sin(time * 6) * 0.2
        ctx.strokeStyle = C.red
        ctx.lineWidth = 6
        ctx.strokeRect(3, 3, W - 6, H - 6)
        ctx.globalAlpha = 1
      }
      if (hurtFlash > 0) {
        ctx.globalAlpha = Math.min(0.35, hurtFlash * 0.35)
        ctx.fillStyle = C.red
        ctx.fillRect(0, 0, W, H)
        ctx.globalAlpha = 1
      }
    }

    const render = (): void => {
      if (!ctx) return
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, W, H)
      const shX = Math.round((Math.random() - 0.5) * shake)
      const shY = Math.round((Math.random() - 0.5) * shake)
      ctx.save()
      ctx.translate(shX, shY)
      drawGround()
      drawProps()
      for (const p of engine.projectiles) {
        if (p.kind === 'zone') drawProjectile(p)
      }
      for (const g of engine.gems) drawGem(g)
      const entities: { y: number; draw: () => void }[] = []
      for (const e of engine.enemies) {
        entities.push({ y: e.y, draw: () => drawEnemy(e) })
      }
      entities.push({ y: engine.player.y, draw: () => drawCat() })
      entities.sort((a, b) => a.y - b.y)
      for (const ent of entities) ent.draw()
      for (const p of engine.projectiles) {
        if (p.kind !== 'zone') drawProjectile(p)
      }
      for (const p of particles) {
        ctx.globalAlpha = Math.min(1, p.life / p.max)
        ctx.fillStyle = p.color
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
      }
      ctx.globalAlpha = 1
      ctx.restore()
      for (const pop of popTexts) {
        ctx.globalAlpha = Math.min(1, pop.life / pop.max)
        pxText(
          pop.text,
          Math.round(pop.x),
          Math.round(pop.y),
          pop.size,
          pop.crit ? C.yellow : pop.color,
          'center',
          true,
        )
      }
      ctx.globalAlpha = 1
      drawHUD()
    }

    /* ================= 菜单布景 ================= */

    const drawMenuScene = (): void => {
      if (!ctx) return
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = C.grass
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = C.grassDark
      for (let gx = 0; gx < W; gx += 40) {
        for (let gy = 0; gy < H; gy += 40) {
          if ((Math.floor(gx / 40) + Math.floor(gy / 40)) % 2 === 0) ctx.fillRect(gx, gy, 40, 40)
        }
      }
      ctx.fillStyle = C.path
      ctx.fillRect(WORLD_W / 2 - 55, 0, 110, H)
      ctx.fillRect(0, WORLD_H / 2 - 55, W, 110)
      // 像素云
      ctx.fillStyle = C.paper
      for (let i = 0; i < 4; i++) {
        const cx = ((time * (6 + i * 3) + i * 260) % (W + 120)) - 60
        const cy = 34 + i * 22
        ctx.fillRect(Math.round(cx) - 16, cy, 32, 5)
        ctx.fillRect(Math.round(cx) - 10, cy - 5, 20, 5)
      }
      // 大标题（像素字 + 红影）
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.font = '22px ' + PS2P
      ctx.fillStyle = C.ink
      ctx.fillText('SURVIVOR', W / 2 + 3, 58)
      ctx.fillText('BLACKY', W / 2 + 3, 86)
      ctx.fillStyle = C.red
      ctx.fillText('SURVIVOR', W / 2 + 2, 57)
      ctx.fillText('BLACKY', W / 2 + 2, 85)
      ctx.fillStyle = C.paper
      ctx.fillText('SURVIVOR', W / 2, 55)
      ctx.fillText('BLACKY', W / 2, 83)
      ctx.font = '13px ' + PS2P_ZH
      ctx.fillStyle = C.ink
      ctx.fillText(t('title'), W / 2 + 2, 118)
      ctx.fillStyle = C.yellow
      ctx.fillText(t('title'), W / 2, 116)
      // 主角大立绘 + 散步的动物
      drawSprite(ctx, SPR_CAT_IDLE, W / 2, 300, 3)
      drawTail(W / 2 - 10, 285, Math.PI, false)
      const pig1: Enemy = {
        id: 0,
        kind: 'pig',
        tier: 'normal',
        x: W / 2 - 210 + Math.sin(time * 0.8) * 60,
        y: 380,
        hp: 1,
        maxHp: 1,
        speed: 0,
        damage: 0,
        radius: 15,
        xp: 1,
        facing: 1,
        vx: 0,
        vy: 0,
        flash: 0,
        burnDps: 0,
        burnT: 0,
        wobbleSeed: 0,
        spawnT: 0,
        bossTimer: 0,
        bornT: 0,
      }
      const pig2: Enemy = {
        ...pig1,
        x: W / 2 + 170 + Math.cos(time * 0.6) * 50,
        y: 400,
        facing: -1,
        wobbleSeed: 2,
      }
      const bird: Enemy = {
        id: 0,
        kind: 'pigeon',
        tier: 'normal',
        x: W / 2 + 240 + Math.cos(time * 0.5) * 40,
        y: 240,
        hp: 1,
        maxHp: 1,
        speed: 0,
        damage: 0,
        radius: 19,
        xp: 1,
        facing: -1,
        vx: 0,
        vy: 0,
        flash: 0,
        burnDps: 0,
        burnT: 0,
        wobbleSeed: 1,
        spawnT: 0,
        bossTimer: 0,
        bornT: 0,
      }
      drawEnemy(pig1)
      drawEnemy(pig2)
      drawEnemy(bird)
      ctx.fillStyle = 'rgba(15,14,14,0.3)'
      ctx.fillRect(0, 428, W, 112)
    }

    /* ================= 输入 ================= */

    const moveFromInput = (): void => {
      let mx = 0
      let my = 0
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) mx += 1
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) mx -= 1
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) my += 1
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) my -= 1
      if (joy.active) {
        mx = joy.dx / 40
        my = joy.dy / 40
      }
      engine.setMove(mx, my)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const k = event.key
      if (event.target instanceof HTMLButtonElement) {
        if (engine.phase === 'playing' && engine.pendingLevelUps > 0) {
          if (k === '1') {
            engine.chooseUpgrade(0)
            canvas?.focus()
          } else if (k === '2') {
            engine.chooseUpgrade(1)
            canvas?.focus()
          } else if (k === '3') {
            engine.chooseUpgrade(2)
            canvas?.focus()
          }
        }
        return
      }
      if (
        k === 'ArrowUp' ||
        k === 'ArrowDown' ||
        k === 'ArrowLeft' ||
        k === 'ArrowRight' ||
        k === ' '
      ) {
        event.preventDefault()
      }
      if (engine.phase === 'menu') {
        if (screen === 'achievements' || screen === 'howto') {
          if (k === 'Escape' || k === 'Enter') {
            screen = 'menu'
            renderOverlay()
          }
        } else if (k === 'Enter' || k === ' ') {
          engine.startRun()
        }
        return
      }
      if (engine.phase === 'over') {
        if (k === 'Enter' || k === ' ') engine.startRun()
        return
      }
      if (engine.phase === 'paused') {
        if (k === 'Enter' || k === 'p' || k === 'P') engine.resume()
        return
      }
      if (engine.phase === 'playing') {
        if (engine.pendingLevelUps > 0) {
          if (k === '1') engine.chooseUpgrade(0)
          else if (k === '2') engine.chooseUpgrade(1)
          else if (k === '3') engine.chooseUpgrade(2)
          return
        }
        if (k === 'p' || k === 'P') engine.pause()
      }
      keys.add(k)
    }

    const onKeyUp = (event: KeyboardEvent): void => {
      keys.delete(event.key)
    }

    const canvasPoint = (event: PointerEvent): { x: number; y: number } => {
      const rect = canvas!.getBoundingClientRect()
      return {
        x: ((event.clientX - rect.left) / rect.width) * W,
        y: ((event.clientY - rect.top) / rect.height) * H,
      }
    }

    const onPointerDown = (event: PointerEvent): void => {
      if (engine.phase !== 'playing' || engine.pendingLevelUps > 0) return
      const pt = canvasPoint(event)
      joy.active = true
      joy.ax = pt.x
      joy.ay = pt.y
      joy.dx = 0
      joy.dy = 0
      canvas?.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (!joy.active) return
      const pt = canvasPoint(event)
      let dx = pt.x - joy.ax
      let dy = pt.y - joy.ay
      const len = Math.hypot(dx, dy)
      if (len > 40) {
        dx = (dx / len) * 40
        dy = (dy / len) * 40
      }
      joy.dx = dx
      joy.dy = dy
    }

    const onPointerUp = (event: PointerEvent): void => {
      if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      joy.active = false
      joy.dx = 0
      joy.dy = 0
    }

    /* ================= 主循环 ================= */

    const loop = (now: number): void => {
      const dtMs = Math.min(now - last, 250)
      last = now
      const dt = dtMs / 1000
      if (running && engine.phase === 'playing') {
        moveFromInput()
        engine.tick(dt)
      }
      handleEvents(engine.drainEvents())
      updateVisuals(dt)
      if (engine.phase === 'menu') drawMenuScene()
      else render()
      sync()
      rafId = requestAnimationFrame(loop)
    }

    /* ================= 浮层（DOM，像素风） ================= */

    const mkBtn = (label: string, onClick: () => void, primary = false): HTMLButtonElement => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = label
      btn.className = primary ? 'sbk-btn primary' : 'sbk-btn'
      btn.addEventListener('click', onClick)
      return btn
    }

    const row = (label: string, value: string, highlight = false): HTMLDivElement => {
      const el = document.createElement('div')
      el.className = 'sbk-row'
      const l = document.createElement('span')
      l.textContent = label
      const v = document.createElement('b')
      v.textContent = value
      if (highlight) v.className = 'hl'
      el.append(l, v)
      return el
    }

    const mkIconCanvas = (sprite: Sprite, scale: number): HTMLCanvasElement => {
      const c = document.createElement('canvas')
      c.width = Math.round(Math.max(...sprite.map((r) => r.length)) * scale)
      c.height = Math.round(sprite.length * scale)
      c.className = 'sbk-icon'
      const ictx = c.getContext('2d')!
      ictx.imageSmoothingEnabled = false
      ictx.drawImage(spriteCanvas(sprite, scale, false), 0, 0)
      return c
    }

    const fmtTime = (sec: number): string =>
      String(Math.floor(sec / 60)).padStart(2, '0') +
      ':' +
      String(Math.floor(sec % 60)).padStart(2, '0')

    const renderOverlay = (): void => {
      if (!overlayEl || !panelEl) return
      panelEl.replaceChildren()
      const p = engine.phase
      if (p === 'menu') {
        if (screen === 'achievements') {
          const h = document.createElement('h2')
          h.className = 'sbk-title'
          const list = document.createElement('div')
          list.className = 'sbk-ach-list'
          let unlockedCount = 0
          for (const def of ACHIEVEMENTS) {
            const unlocked = progressService.isUnlocked(def.id)
            if (unlocked) unlockedCount++
            const item = document.createElement('div')
            item.className = 'sbk-ach' + (unlocked ? ' on' : '')
            const iconWrap = document.createElement('div')
            iconWrap.className = 'sbk-ach-icon'
            const ic = mkIconCanvas(def.icon, 2)
            if (!unlocked) ic.style.opacity = '0.35'
            iconWrap.append(ic)
            item.append(iconWrap)
            const body = document.createElement('div')
            body.className = 'sbk-ach-body'
            const name = document.createElement('div')
            name.className = 'sbk-ach-name'
            name.textContent = t(def.nameKey)
            const desc = document.createElement('div')
            desc.className = 'sbk-ach-desc'
            desc.textContent = t(def.descKey)
            const st = document.createElement('div')
            st.className = 'sbk-ach-state'
            st.textContent = unlocked ? '★ ' + t('achUnlocked') : t('achLocked')
            body.append(name, desc, st)
            item.append(body)
            list.append(item)
          }
          h.textContent = t('achTitle') + ' ' + unlockedCount + '/' + ACHIEVEMENTS.length
          panelEl.append(h, list)
          panelEl.append(row(t('achTotal'), String(progressService.totalKills())))
          panelEl.append(
            mkBtn(
              t('menuBack'),
              () => {
                screen = 'menu'
                renderOverlay()
              },
              true,
            ),
          )
        } else if (screen === 'howto') {
          const h = document.createElement('h2')
          h.className = 'sbk-title'
          h.textContent = t('howTitle')
          panelEl.append(h)
          const list = document.createElement('div')
          list.className = 'sbk-how-list'
          for (const line of S.howLines) {
            const d = document.createElement('div')
            d.className = 'sbk-how-line'
            d.textContent = pickLang(line, langRef.current)
            list.append(d)
          }
          panelEl.append(list)
          panelEl.append(
            mkBtn(
              t('menuBack'),
              () => {
                screen = 'menu'
                renderOverlay()
              },
              true,
            ),
          )
        } else {
          panelEl.append(mkBtn(t('menuStart'), () => engine.startRun(), true))
          const side = document.createElement('div')
          side.className = 'sbk-side-btns'
          side.append(
            mkBtn(t('menuAchievements'), () => {
              screen = 'achievements'
              renderOverlay()
            }),
            mkBtn(t('howTitle'), () => {
              screen = 'howto'
              renderOverlay()
            }),
          )
          panelEl.append(side)
          panelEl.append(row(t('menuBest'), String(scoreService.best(GAME_ID))))
          const footer = document.createElement('div')
          footer.className = 'sbk-hint'
          footer.textContent = t('menuFooter') + ' · ' + t('menuHint')
          panelEl.append(footer)
        }
      } else if (p === 'paused') {
        const h = document.createElement('h2')
        h.className = 'sbk-title'
        h.textContent = t('paused')
        panelEl.append(h)
        panelEl.append(mkBtn(t('resume'), () => engine.resume(), true))
        const side = document.createElement('div')
        side.className = 'sbk-side-btns'
        side.append(
          mkBtn(t('restart'), () => engine.startRun()),
          mkBtn(t('menuAchievements'), () => {
            screen = 'achievements'
            renderOverlay()
          }),
        )
        panelEl.append(side)
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      } else if (p === 'over') {
        const h = document.createElement('h2')
        h.className = 'sbk-title ' + (engine.outcome === 'win' ? 'win' : 'lose')
        h.textContent = engine.outcome === 'win' ? t('victory') : t('defeated')
        panelEl.append(h)
        const cause = document.createElement('p')
        cause.className = 'sbk-cause'
        const causeKey = ('cause_' + engine.deathCause) as SurvivorBkStringKey
        cause.textContent =
          engine.outcome === 'win' ? t('winLine') : causeKey in S ? t(causeKey) : t('cause_unknown')
        panelEl.append(cause)
        panelEl.append(row(t('time'), fmtTime(engine.survived)))
        panelEl.append(row(t('wave'), engine.wave + '/' + WAVE_COUNT))
        panelEl.append(row(t('kills'), String(engine.kills)))
        panelEl.append(row(t('level'), String(engine.currentLevel)))
        const best = scoreService.best(GAME_ID)
        const newBest = engine.score > best
        panelEl.append(row(t('score'), String(engine.score), newBest))
        if (newBest) {
          const nb = document.createElement('div')
          nb.className = 'sbk-newbest'
          nb.textContent = t('newBest')
          panelEl.append(nb)
        }
        panelEl.append(mkBtn(t('playAgain'), () => engine.startRun(), true))
        panelEl.append(mkBtn(t('toMenu'), () => engine.toMenu()))
      }
      overlayEl.style.display = p === 'playing' ? 'none' : 'flex'
    }

    const describeOption = (
      option: UpgradeOption,
    ): {
      name: string
      desc: string
      tag: string
      lvl: string
      icon: Sprite
      newWeapon: boolean
    } => {
      if (option.kind === 'heal') {
        return {
          name: t('heal_name'),
          desc: t('heal_desc'),
          tag: t('upgradeHeal'),
          lvl: '',
          icon: SPR_ICON_ACHIEVEMENT.first_kill!,
          newWeapon: false,
        }
      }
      if (option.kind === 'weapon') {
        const name = t(('weapon_' + option.id) as SurvivorBkStringKey)
        const desc = t(('weapon_' + option.id + '_desc') as SurvivorBkStringKey)
        return {
          name,
          desc,
          tag: t('upgradeWeapon'),
          lvl: option.nextLevel === 1 ? t('newWeapon') : t('upgradeTo') + ' Lv' + option.nextLevel,
          icon: SPR_ICON_WEAPON[option.id] ?? SPR_ICON_WEAPON.hairball!,
          newWeapon: option.nextLevel === 1,
        }
      }
      const name = t(('passive_' + option.id) as SurvivorBkStringKey)
      const desc = t(('passive_' + option.id + '_desc') as SurvivorBkStringKey)
      return {
        name,
        desc,
        tag: t('upgradePassive'),
        lvl: t('upgradeTo') + ' Lv' + option.nextLevel,
        icon: SPR_ICON_PASSIVE[option.id] ?? SPR_ICON_PASSIVE.box!,
        newWeapon: false,
      }
    }

    const renderLevelUp = (): void => {
      if (!levelupEl) return
      levelupEl.replaceChildren()
      const open = engine.phase === 'playing' && engine.pendingLevelUps > 0
      levelupEl.style.display = open ? 'flex' : 'none'
      if (!open) return
      const box = document.createElement('div')
      box.className = 'sbk-levelup-box'
      const h = document.createElement('h2')
      h.className = 'sbk-title'
      h.textContent = t('levelUp')
      box.append(h)
      const sub = document.createElement('div')
      sub.className = 'sbk-sub'
      sub.textContent = t('pressKey')
      box.append(sub)
      const cards = document.createElement('div')
      cards.className = 'sbk-cards'
      const choices = engine.pendingChoices[0] ?? []
      let first: HTMLButtonElement | null = null
      choices.forEach((option, index) => {
        const info = describeOption(option)
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'sbk-card' + (info.newWeapon ? ' new' : '')
        btn.setAttribute(
          'aria-label',
          info.tag + '：' + info.name + '。' + info.desc + '（' + info.lvl + '）',
        )
        btn.append(mkIconCanvas(info.icon, 3))
        const tag = document.createElement('div')
        tag.className = 'sbk-card-tag'
        tag.textContent = info.tag
        const name = document.createElement('div')
        name.className = 'sbk-card-name'
        name.textContent = info.name
        const desc = document.createElement('div')
        desc.className = 'sbk-card-desc'
        desc.textContent = info.desc
        const lvl = document.createElement('div')
        lvl.className = 'sbk-card-lvl'
        lvl.textContent = info.lvl
        const key = document.createElement('span')
        key.className = 'sbk-card-key'
        key.textContent = String(index + 1)
        btn.append(tag, name, desc, lvl, key)
        btn.addEventListener('click', () => {
          engine.chooseUpgrade(index)
          canvas?.focus()
        })
        cards.append(btn)
        if (!first) first = btn
      })
      box.append(cards)
      levelupEl.append(box)
      requestAnimationFrame(() => first?.focus())
    }

    const renderToasts = (): void => {
      if (!toastEl) return
      toastEl.replaceChildren()
      if (toasts.length === 0) {
        toastEl.style.display = 'none'
        return
      }
      toastEl.style.display = 'flex'
      const current = toasts[0]!
      const div = document.createElement('div')
      div.className = 'sbk-toast'
      div.textContent = current.text
      toastEl.append(div)
    }

    const sync = (): void => {
      if (engine.score !== lastScore) {
        lastScore = engine.score
        callbacks.onScore(engine.score)
      }
      if (engine.phase !== lastPhase) {
        lastPhase = engine.phase
        callbacks.onPhase?.(engine.phase)
        if (engine.phase === 'over') {
          callbacks.onScore(engine.score)
          flushKills()
        }
        if (engine.phase === 'menu') {
          screen = 'menu'
        }
        renderOverlay()
        renderLevelUp()
      }
      if (engine.pendingLevelUps !== lastPending) {
        lastPending = engine.pendingLevelUps
        renderLevelUp()
      }
      const screenKey = engine.phase + ':' + screen
      if (screenKey !== lastScreen) {
        lastScreen = screenKey
        renderOverlay()
      }
      if (langRef.current !== lastLang) {
        lastLang = langRef.current
        renderOverlay()
        renderLevelUp()
        renderToasts()
      }
      checkAchievements()
    }

    /* ================= GameInstance 契约 ================= */

    const instance: GameInstance = {
      mount(el) {
        root = document.createElement('div')
        root.className = 'sbk-root'
        canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        // 宽驱动 + 固有比例：任何环境（含 aspect-ratio 不支持的旧浏览器）
        // 都保持 16:9 完整显示，不依赖父容器高度解析（修复"画面只显示一半"）
        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        canvas.style.aspectRatio = W + ' / ' + H
        canvas.style.display = 'block'
        canvas.style.imageRendering = 'pixelated'
        canvas.style.touchAction = 'none'
        canvas.tabIndex = -1
        ctx = canvas.getContext('2d')
        canvas.addEventListener('pointerdown', onPointerDown)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerup', onPointerUp)
        canvas.addEventListener('pointercancel', onPointerUp)
        root.appendChild(canvas)
        toastEl = document.createElement('div')
        toastEl.className = 'sbk-toasts'
        root.appendChild(toastEl)
        levelupEl = document.createElement('div')
        levelupEl.className = 'sbk-levelup'
        root.appendChild(levelupEl)
        overlayEl = document.createElement('div')
        overlayEl.className = 'sbk-overlay'
        panelEl = document.createElement('div')
        panelEl.className = 'sbk-panel'
        overlayEl.appendChild(panelEl)
        root.appendChild(overlayEl)
        el.appendChild(root)
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        try {
          void document.fonts.load('8px "Press Start 2P"')
        } catch {
          /* 字体预热失败不阻塞 */
        }
        callbacks.onPhase?.(engine.phase)
        screen = 'menu'
        lastScreen = ''
        renderOverlay()
        renderLevelUp()
        renderToasts()
        drawMenuScene()
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
        window.removeEventListener('keyup', onKeyUp)
        flushKills()
        root?.remove()
        root = null
        canvas = null
        ctx = null
        overlayEl = null
        panelEl = null
        levelupEl = null
        toastEl = null
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

export default SurvivorBkGame
