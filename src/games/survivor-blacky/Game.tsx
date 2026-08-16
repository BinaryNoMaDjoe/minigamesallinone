import { useEffect, useRef } from 'react'
import { pickLang, useI18n } from '../../i18n'
import { scoreService } from '../../services/score'
import type { GameCallbacks, GameComponent, GameInstance } from '../shared/types'
import { SurvivorEngine } from './engine'
import { WORLD_W, WORLD_H, WAVE_COUNT, WEAPON_MAX_LEVEL } from './engine'
import type { Enemy, Gem, Projectile, SpawnKind, UpgradeOption, WeaponId } from './engine'
import type { QuoteKey } from './engine'
import { survivorbkStrings as S } from './strings'
import type { SurvivorBkStringKey } from './strings'
import './styles.css'

// ============================================================
// 幸存者小黑 —— 渲染与输入层
// 规则/色板/布局唯一出处：同目录 DESIGN.md v1.0
// 纯逻辑在 engine.ts；本文件只做 Canvas 2D + DOM 浮层 + 输入
// 三渲二纪律：平涂色块 + 2px 墨线 + 左下暗面 + 硬边落地阴影，无渐变无 blur
// ============================================================

const W = 960
const H = 600
const GAME_ID = 'survivor-blacky'
const FONT_DISPLAY = "Anybody, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
const FONT_LABEL = "'Space Grotesk', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"

// —— 色板（DESIGN.md §4，全部出处可溯） ——
const C = {
  ink: '#1c1b1b',
  paper: '#ffffff',
  red: '#e62429',
  blue: '#0074e4',
  yellow: '#ffd700',
  board: '#0f0e0e',
  grass: '#86c95e',
  grassDark: '#79b855',
  grassShade: '#5f9a44',
  path: '#e8d59c',
  cat: '#2b2b33',
  catLight: '#3d3d49',
  catBelly: '#f3f0ef',
  pig: '#ff9db1',
  pigDark: '#e5849a',
  chick: '#fff6e8',
  beak: '#ffb300',
  dog: '#c98a4b',
  dogDark: '#a56b33',
  pigeon: '#b9c2cf',
  pigeonChest: '#e8edf4',
  elite: '#a200ff',
  fish: '#ffb300',
  fishLight: '#ffe16d',
  zone: 'rgba(121,184,85,0.5)',
  zoneEdge: '#5f9a44',
  leafDark: '#3f7a2e',
  leafLight: '#54a03c',
  trunk: '#8a5a2b',
  trunkDark: '#6f4720',
  leaf: '#4e8f3a',
  rock: '#b9c0c8',
  rockDark: '#98a0a9',
  fence: '#a9713f',
  fenceLight: '#c98a4b',
  bone: '#f3f0ef',
  yarnBall: '#e62429',
  bomb: '#23232b',
  hairball: '#23232b',
  beam: '#e62429',
  beamCore: '#ffd700',
  bellyShade: '#d9d2cf',
  chickShade: '#e4d8c2',
  chickTail: '#d8cfc2',
  dogMuzzle: '#f0d9b8',
  dogEarDark: '#7c4e22',
  tongue: '#ff7a8a',
  pigeonShade: '#98a1af',
  pigeonWing: '#a4aebb',
  pigeonWingDark: '#8490a1',
  pigeonTail: '#9aa6b5',
  pigeonTailDark: '#7d8a9c',
  pipEmpty: '#c9c4c4',
  barBg: '#dcd9d9',
  shadowSoft: 'rgba(28,27,27,0.22)',
  whisker: 'rgba(243,240,239,0.85)',
  hairStreak: 'rgba(255,255,255,0.5)',
}

// —— 视觉状态（仅存在于本层，引擎不感知） ——
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  shape: 'square' | 'circle' | 'spark'
  rot: number
  vrot: number
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
  rot: number
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

/** 圆角矩形（含回退路径） */
function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

/** 三渲二块：平涂 + 左下暗面 + 墨线描边 */
function celBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  shade: string,
  outline = true,
): void {
  rr(ctx, x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.save()
  rr(ctx, x, y, w, h, r)
  ctx.clip()
  ctx.fillStyle = shade
  ctx.fillRect(x, y + h * 0.45, w * 0.55, h * 0.55)
  ctx.restore()
  if (outline) {
    rr(ctx, x, y, w, h, r)
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

/** 硬边落地阴影 */
function groundShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = C.shadowSoft
  ctx.fill()
}

function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/** 布景（树/石头/灌木/花，固定种子，避开出生点） */
function makeProps(): Prop[] {
  const rng = seededRng(20260815)
  const props: Prop[] = []
  const kinds: Prop['kind'][] = ['tree', 'tree', 'tree', 'rock', 'bush', 'bush', 'flower', 'flower']
  for (let i = 0; i < 46; i++) {
    const x = 70 + rng() * (WORLD_W - 140)
    const y = 70 + rng() * (WORLD_H - 140)
    const dx = x - WORLD_W / 2
    const dy = y - WORLD_H / 2
    if (dx * dx + dy * dy < 240 * 240) continue
    props.push({ kind: kinds[i % kinds.length]!, x, y, s: 0.85 + rng() * 0.5, seed: rng() * 10 })
  }
  return props
}

// ============================================================
// 角色绘制（三渲二块面）
// ============================================================

/** 主角小黑（罗小黑气质的方块猫） */
function drawCat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  moving: boolean,
  walkT: number,
  t: number,
  invuln: number,
  hurtT: number,
): void {
  const flip = Math.cos(facing) < 0
  const bounce = moving ? Math.abs(Math.sin(walkT * 9)) * 2.2 : Math.sin(t * 2.2) * 0.9
  // 无敌帧闪烁
  if (invuln > 0 && Math.floor(t * 16) % 2 === 0) ctx.globalAlpha = 0.55

  groundShadow(ctx, x, y + 2, 17, 5)
  ctx.save()
  ctx.translate(x, y + bounce)
  ctx.scale(flip ? -1 : 1, 1)

  // 尾巴（白色尾尖，摇摆）
  const sway = Math.sin(t * 3 + (moving ? walkT * 6 : 0)) * 0.45
  ctx.save()
  ctx.translate(-13, 2)
  ctx.rotate(sway - 0.5)
  ctx.strokeStyle = C.cat
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(-12, 2, -20, -4)
  ctx.stroke()
  ctx.strokeStyle = C.catBelly
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(-16, -2.4)
  ctx.quadraticCurveTo(-18, -3.4, -20, -4)
  ctx.stroke()
  ctx.restore()

  // 身体
  celBlock(ctx, -13, -12, 26, 22, 5, C.cat, C.board, false)
  ctx.fillStyle = C.cat
  rr(ctx, -13, -12, 26, 22, 5)
  ctx.fill()
  // 白肚皮
  celBlock(ctx, -7, -6, 12, 13, 4, C.catBelly, C.bellyShade, false)
  // 腿（行走摆动）
  const leg = moving ? Math.sin(walkT * 9) * 2.6 : 0
  celBlock(ctx, -11, 8 + (leg > 0 ? leg : 0), 5.5, 7, 2, C.cat, C.board, false)
  celBlock(ctx, 3, 8 - (leg > 0 ? leg : 0), 5.5, 7, 2, C.cat, C.board, false)

  // 头
  celBlock(ctx, -15, -44, 30, 30, 13, C.cat, C.board, false)
  // 耳朵
  ctx.fillStyle = C.cat
  ctx.beginPath()
  ctx.moveTo(-13, -40)
  ctx.lineTo(-15, -54)
  ctx.lineTo(-4, -45)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(13, -40)
  ctx.lineTo(15, -54)
  ctx.lineTo(4, -45)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = C.catLight
  ctx.beginPath()
  ctx.moveTo(-11, -42)
  ctx.lineTo(-13, -50)
  ctx.lineTo(-6, -45)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(11, -42)
  ctx.lineTo(13, -50)
  ctx.lineTo(6, -45)
  ctx.closePath()
  ctx.fill()
  // 头部亮面（cel 光照）
  rr(ctx, -11, -40, 17, 17, 8)
  ctx.fillStyle = C.catLight
  ctx.fill()

  // 眼睛（大黄眼 + 竖瞳 + 高光，眨眼）
  const blink = Math.sin(t * 1.7 + 1) > 0.985 ? 0.15 : 1
  for (const ex of [-6.5, 6.5]) {
    ctx.beginPath()
    ctx.ellipse(ex, -30, 4.4, 4.8 * blink, 0, 0, Math.PI * 2)
    ctx.fillStyle = C.yellow
    ctx.fill()
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 1.5
    ctx.stroke()
    if (blink === 1) {
      ctx.beginPath()
      ctx.ellipse(ex, -29.6, 1.5, 2.6, 0, 0, Math.PI * 2)
      ctx.fillStyle = C.ink
      ctx.fill()
      ctx.beginPath()
      ctx.arc(ex + 1.5, -31.6, 1.1, 0, Math.PI * 2)
      ctx.fillStyle = C.paper
      ctx.fill()
    }
  }
  // ω 嘴
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(-3, -23)
  ctx.quadraticCurveTo(-1.5, -21.4, 0, -23)
  ctx.quadraticCurveTo(1.5, -21.4, 3, -23)
  ctx.stroke()
  // 胡须
  ctx.strokeStyle = C.whisker
  ctx.lineWidth = 1
  ctx.beginPath()
  for (const side of [-1, 1]) {
    ctx.moveTo(side * 7, -27)
    ctx.lineTo(side * 15, -28)
    ctx.moveTo(side * 7, -25)
    ctx.lineTo(side * 15, -24)
  }
  ctx.stroke()

  ctx.restore()

  // 受伤红闪
  if (hurtT > 0) {
    ctx.globalAlpha = Math.min(1, hurtT * 4) * 0.5
    ctx.beginPath()
    ctx.arc(x, y - 14, 20, 0, Math.PI * 2)
    ctx.fillStyle = C.red
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawPig(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
  const flip = Math.cos(e.facing) < 0
  const bob = Math.sin(t * 7 + e.wobbleSeed) * 1.2
  groundShadow(ctx, e.x, e.y + 2, 14, 4)
  ctx.save()
  ctx.translate(e.x, e.y + bob)
  ctx.scale(flip ? -1 : 1, 1)
  // 卷尾巴
  ctx.strokeStyle = C.pigDark
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(-15, -6, 3.2, 0, Math.PI * 1.6)
  ctx.stroke()
  // 身体
  celBlock(ctx, -14, -9, 28, 19, 7, C.pig, C.pigDark)
  // 耳朵
  ctx.fillStyle = C.pig
  ctx.beginPath()
  ctx.moveTo(-9, -11)
  ctx.lineTo(-12, -17)
  ctx.lineTo(-3, -13)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(9, -11)
  ctx.lineTo(12, -17)
  ctx.lineTo(3, -13)
  ctx.closePath()
  ctx.fill()
  // 鼻子
  ctx.beginPath()
  ctx.ellipse(13, -4, 4.6, 3.6, 0, 0, Math.PI * 2)
  ctx.fillStyle = C.pigDark
  ctx.fill()
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = C.ink
  ctx.beginPath()
  ctx.arc(12, -4.5, 0.9, 0, Math.PI * 2)
  ctx.arc(14.6, -4.5, 0.9, 0, Math.PI * 2)
  ctx.fill()
  // 眼睛
  ctx.beginPath()
  ctx.arc(7, -10, 1.8, 0, Math.PI * 2)
  ctx.fillStyle = C.ink
  ctx.fill()
  // 腿
  celBlock(ctx, -10, 9, 6, 7, 2, C.pig, C.pigDark, false)
  celBlock(ctx, 3, 9, 6, 7, 2, C.pig, C.pigDark, false)
  ctx.restore()
}

function drawChicken(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
  const flip = Math.cos(e.facing) < 0
  const hop = Math.abs(Math.sin(t * 10 + e.wobbleSeed)) * 2.6
  groundShadow(ctx, e.x, e.y + 1, 10, 3)
  ctx.save()
  ctx.translate(e.x, e.y + hop)
  ctx.scale(flip ? -1 : 1, 1)
  // 尾羽
  ctx.fillStyle = C.paper
  for (const [ox, oy] of [
    [-11, -6],
    [-12, -2],
    [-10, 2],
  ] as const) {
    celBlock(ctx, ox, oy, 7, 4.5, 2, C.paper, C.chickTail, false)
  }
  // 身体
  celBlock(ctx, -10, -8, 21, 16, 6, C.chick, C.chickShade)
  // 翅膀（扑扇）
  const flap = Math.sin(t * 11 + e.wobbleSeed) * 0.5
  ctx.save()
  ctx.translate(0, -2)
  ctx.rotate(flap)
  celBlock(ctx, -4, -9, 9, 6, 3, C.chick, C.chickShade)
  ctx.restore()
  // 头
  ctx.beginPath()
  ctx.arc(11, -13, 5.2, 0, Math.PI * 2)
  ctx.fillStyle = C.chick
  ctx.fill()
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 1.5
  ctx.stroke()
  // 鸡冠（Action Red）
  ctx.fillStyle = C.red
  ctx.beginPath()
  ctx.arc(11, -19.5, 2.1, 0, Math.PI * 2)
  ctx.arc(8, -20.5, 2.1, 0, Math.PI * 2)
  ctx.arc(14, -20.5, 2.1, 0, Math.PI * 2)
  ctx.fill()
  // 喙
  ctx.fillStyle = C.beak
  ctx.beginPath()
  ctx.moveTo(16, -14)
  ctx.lineTo(21, -12.4)
  ctx.lineTo(16, -11)
  ctx.closePath()
  ctx.fill()
  // 眼
  ctx.beginPath()
  ctx.arc(12, -14, 1.5, 0, Math.PI * 2)
  ctx.fillStyle = C.ink
  ctx.fill()
  // 腿
  ctx.strokeStyle = C.beak
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-3, 8)
  ctx.lineTo(-3, 12)
  ctx.moveTo(4, 8)
  ctx.lineTo(4, 12)
  ctx.stroke()
  ctx.restore()
}

function drawDog(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
  const flip = Math.cos(e.facing) < 0
  const bob = Math.sin(t * 9 + e.wobbleSeed) * 1.1
  groundShadow(ctx, e.x, e.y + 2, 13, 4)
  ctx.save()
  ctx.translate(e.x, e.y + bob)
  ctx.scale(flip ? -1 : 1, 1)
  // 尾巴（摇）
  const wag = Math.sin(t * 12 + e.wobbleSeed) * 0.6
  ctx.save()
  ctx.translate(-13, -4)
  ctx.rotate(-0.7 + wag)
  ctx.strokeStyle = C.dog
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-8, -6)
  ctx.stroke()
  ctx.restore()
  // 身体
  celBlock(ctx, -13, -8, 26, 17, 6, C.dog, C.dogDark)
  // 头
  ctx.beginPath()
  ctx.arc(13, -13, 7, 0, Math.PI * 2)
  ctx.fillStyle = C.dog
  ctx.fill()
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 1.5
  ctx.stroke()
  // 口鼻
  ctx.beginPath()
  ctx.ellipse(16, -11, 3.6, 2.8, 0, 0, Math.PI * 2)
  ctx.fillStyle = C.dogMuzzle
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(16.4, -12, 1, 0, Math.PI * 2)
  ctx.fillStyle = C.ink
  ctx.fill()
  // 舌头（追猫专用）
  ctx.fillStyle = C.tongue
  rr(ctx, 14, -7.5, 4, 3.4, 1.6)
  ctx.fill()
  // 垂耳
  celBlock(ctx, 7, -20, 5, 9, 2.4, C.dogDark, C.dogEarDark, false)
  celBlock(ctx, 13, -20, 5, 9, 2.4, C.dogDark, C.dogEarDark, false)
  // 眼
  ctx.beginPath()
  ctx.arc(12, -15, 1.7, 0, Math.PI * 2)
  ctx.fillStyle = C.ink
  ctx.fill()
  // 腿
  celBlock(ctx, -9, 8, 5.5, 6.5, 2, C.dog, C.dogDark, false)
  celBlock(ctx, 3, 8, 5.5, 6.5, 2, C.dog, C.dogDark, false)
  ctx.restore()
}

function drawPigeon(ctx: CanvasRenderingContext2D, e: Enemy, t: number, boss: boolean): void {
  const flip = Math.cos(e.facing) < 0
  const bob = Math.sin(t * 6 + e.wobbleSeed) * 1.4
  const s = boss ? 1 : e.kind === 'minipigeon' ? 0.55 : 1
  groundShadow(ctx, e.x, e.y + 2, 20 * s, 6 * s)
  ctx.save()
  ctx.translate(e.x, e.y + bob * s)
  ctx.scale((flip ? -1 : 1) * s, s)
  // 披风（BOSS，Action Red，迎风飘）
  if (boss) {
    const wave = Math.sin(t * 3.2) * 5
    ctx.fillStyle = C.red
    ctx.beginPath()
    ctx.moveTo(-6, -16)
    ctx.quadraticCurveTo(-30, -10 + wave, -38, 6 + wave * 1.4)
    ctx.lineTo(-24, 14 + wave)
    ctx.lineTo(-12, 0)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 2
    ctx.stroke()
  }
  // 尾羽
  ctx.fillStyle = C.pigeonTail
  for (const [ox, oy] of [
    [-18, -4],
    [-19, 1],
    [-17, 6],
  ] as const) {
    celBlock(ctx, ox, oy, 9, 5, 2, C.pigeonTail, C.pigeonTailDark, false)
  }
  // 胖身体
  celBlock(ctx, -16, -14, 34, 26, 10, C.pigeon, C.pigeonShade)
  // 白胸
  ctx.beginPath()
  ctx.ellipse(4, 2, 9, 8.5, 0, 0, Math.PI * 2)
  ctx.fillStyle = C.pigeonChest
  ctx.fill()
  // 翅膀（扑扇）
  const flap = Math.sin(t * 8 + e.wobbleSeed) * (boss ? 0.25 : 0.5)
  ctx.save()
  ctx.translate(-4, -8)
  ctx.rotate(flap)
  celBlock(ctx, -10, -10, 18, 9, 4, C.pigeonWing, C.pigeonWingDark)
  ctx.restore()
  // 头
  ctx.beginPath()
  ctx.arc(14, -20, 7, 0, Math.PI * 2)
  ctx.fillStyle = C.pigeon
  ctx.fill()
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 1.5
  ctx.stroke()
  // 喙
  ctx.fillStyle = C.beak
  ctx.beginPath()
  ctx.moveTo(20, -20)
  ctx.lineTo(26, -18.5)
  ctx.lineTo(20, -17)
  ctx.closePath()
  ctx.fill()
  // 眼（BOSS 愤怒白眼 + 斜眉）
  if (boss) {
    ctx.beginPath()
    ctx.arc(16, -22, 2.6, 0, Math.PI * 2)
    ctx.fillStyle = C.paper
    ctx.fill()
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(16.6, -21.6, 1.1, 0, Math.PI * 2)
    ctx.fillStyle = C.red
    ctx.fill()
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(12.5, -26.5)
    ctx.lineTo(18.5, -24)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(16, -22, 1.8, 0, Math.PI * 2)
    ctx.fillStyle = C.ink
    ctx.fill()
  }
  // 王冠（BOSS/精英）
  if (boss) {
    ctx.fillStyle = C.yellow
    ctx.beginPath()
    ctx.moveTo(9, -27)
    ctx.lineTo(9, -34)
    ctx.lineTo(13, -29.5)
    ctx.lineTo(17, -35)
    ctx.lineTo(21, -29.5)
    ctx.lineTo(25, -34)
    ctx.lineTo(25, -27)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = C.red
    ctx.beginPath()
    ctx.arc(17, -31.5, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
  // 脚
  ctx.strokeStyle = C.red
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(-4, 12)
  ctx.lineTo(-4, 16)
  ctx.moveTo(4, 12)
  ctx.lineTo(4, 16)
  ctx.stroke()
  ctx.restore()
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, t: number): void {
  // 精英紫色头冠与描边光晕
  if (e.tier === 'elite') {
    ctx.strokeStyle = C.elite
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(e.x, e.y - e.radius * 0.4, e.radius + 5, 0, Math.PI * 2)
    ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.2
    ctx.stroke()
    ctx.globalAlpha = 1
    // 小皇冠
    const s = e.radius / 15
    ctx.fillStyle = C.elite
    ctx.beginPath()
    ctx.moveTo(e.x - 6 * s, e.y - e.radius - 6)
    ctx.lineTo(e.x - 6 * s, e.y - e.radius - 13 * s)
    ctx.lineTo(e.x - 2 * s, e.y - e.radius - 9 * s)
    ctx.lineTo(e.x, e.y - e.radius - 15 * s)
    ctx.lineTo(e.x + 2 * s, e.y - e.radius - 9 * s)
    ctx.lineTo(e.x + 6 * s, e.y - e.radius - 13 * s)
    ctx.lineTo(e.x + 6 * s, e.y - e.radius - 6)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 1.2
    ctx.stroke()
  }
  switch (e.kind) {
    case 'pig':
      drawPig(ctx, e, t)
      break
    case 'chicken':
      drawChicken(ctx, e, t)
      break
    case 'dog':
      drawDog(ctx, e, t)
      break
    case 'pigeon':
    case 'minipigeon':
      drawPigeon(ctx, e, t, false)
      break
    case 'boss':
      drawPigeon(ctx, e, t, true)
      break
  }
  // 受击白闪
  if (e.flash > 0) {
    ctx.globalAlpha = Math.min(1, e.flash * 8) * 0.75
    ctx.beginPath()
    ctx.arc(e.x, e.y - e.radius * 0.4, e.radius, 0, Math.PI * 2)
    ctx.fillStyle = C.paper
    ctx.fill()
    ctx.globalAlpha = 1
  }
  // 灼烧特效
  if (e.burnT > 0) {
    ctx.globalAlpha = 0.7
    for (let i = 0; i < 3; i++) {
      const fx = e.x + Math.sin(t * 9 + i * 2.1 + e.wobbleSeed) * e.radius * 0.5
      const fy = e.y - e.radius * 0.6 + Math.sin(t * 11 + i * 1.7) * 3 - i * 3
      ctx.beginPath()
      ctx.arc(fx, fy, 2.4, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? C.yellow : C.red
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  // 入场缩小弹出
  if (e.spawnT > 0) {
    const k = 1 - e.spawnT / 0.4
    ctx.globalAlpha = Math.min(1, k * 3)
  } else {
    ctx.globalAlpha = 1
  }
}

function drawGem(ctx: CanvasRenderingContext2D, g: Gem, t: number): void {
  const bob = Math.sin(t * 4 + g.x * 0.05 + g.y * 0.03) * 1.6
  ctx.save()
  ctx.translate(g.x, g.y + bob)
  // 小鱼干
  ctx.rotate(Math.sin(t * 3 + g.x * 0.1) * 0.15)
  ctx.beginPath()
  ctx.ellipse(0, 0, 5.2, 3.2, 0, 0, Math.PI * 2)
  ctx.fillStyle = C.fish
  ctx.fill()
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 1.2
  ctx.stroke()
  // 尾巴
  ctx.fillStyle = C.fish
  ctx.beginPath()
  ctx.moveTo(-4.4, 0)
  ctx.lineTo(-9, -3)
  ctx.lineTo(-9, 3)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // 眼睛与高光
  ctx.beginPath()
  ctx.arc(2.4, -1, 0.9, 0, Math.PI * 2)
  ctx.fillStyle = C.ink
  ctx.fill()
  ctx.beginPath()
  ctx.arc(-1, -1.6, 1.3, 0, Math.PI * 2)
  ctx.fillStyle = C.fishLight
  ctx.fill()
  ctx.restore()
  // 磁吸尾迹
  if (g.magnet) {
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    ctx.arc(g.x, g.y, 2, 0, Math.PI * 2)
    ctx.fillStyle = C.fishLight
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile, t: number): void {
  switch (p.kind) {
    case 'homing': {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(t * 8 + p.id)
      ctx.beginPath()
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = C.hairball
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.6
      ctx.stroke()
      ctx.strokeStyle = C.hairStreak
      ctx.lineWidth = 1
      for (const a of [0.4, 1.8, 3.1]) {
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(a) * (p.radius + 3), Math.sin(a) * (p.radius + 3))
        ctx.stroke()
      }
      ctx.restore()
      break
    }
    case 'orbit': {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(t * 4 + p.angle)
      ctx.beginPath()
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = C.yarnBall
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.6
      ctx.stroke()
      ctx.strokeStyle = C.paper
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 0, p.radius - 2.5, 0.6, Math.PI * 1.4)
      ctx.stroke()
      ctx.restore()
      break
    }
    case 'boomerang': {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(Math.atan2(p.vy, p.vx) + t * 14)
      ctx.strokeStyle = C.bone
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-8, 0)
      ctx.lineTo(8, 0)
      ctx.stroke()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(-8, 0)
      ctx.lineTo(-11, -3.5)
      ctx.moveTo(-8, 0)
      ctx.lineTo(-11, 3.5)
      ctx.moveTo(8, 0)
      ctx.lineTo(11, -3.5)
      ctx.moveTo(8, 0)
      ctx.lineTo(11, 3.5)
      ctx.stroke()
      ctx.restore()
      break
    }
    case 'beam': {
      const alpha = Math.max(0, p.life / 0.16)
      ctx.globalAlpha = alpha
      ctx.strokeStyle = C.beam
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.fx, p.fy)
      ctx.stroke()
      ctx.strokeStyle = C.beamCore
      ctx.lineWidth = 2
      ctx.stroke()
      // 端点爆闪
      ctx.beginPath()
      ctx.arc(p.fx, p.fy, 6 * (1 - alpha) + 3, 0, Math.PI * 2)
      ctx.fillStyle = C.paper
      ctx.fill()
      ctx.globalAlpha = 1
      break
    }
    case 'straight': {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(Math.atan2(p.vy, p.vx))
      ctx.beginPath()
      ctx.ellipse(0, 0, 6.5, 3.4, 0, 0, Math.PI * 2)
      ctx.fillStyle = C.fish
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.fillStyle = C.fish
      ctx.beginPath()
      ctx.moveTo(-5.5, 0)
      ctx.lineTo(-10, -3)
      ctx.lineTo(-10, 3)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.arc(2, -1, 0.9, 0, Math.PI * 2)
      ctx.fillStyle = C.ink
      ctx.fill()
      ctx.restore()
      break
    }
    case 'bomb': {
      const pulse = 1 + Math.sin(t * 16) * 0.08
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.scale(pulse, pulse)
      ctx.beginPath()
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = C.bomb
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.6
      ctx.stroke()
      // 引信火花
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(3, -7)
      ctx.quadraticCurveTo(6, -11, 4, -13)
      ctx.stroke()
      const spark = Math.sin(t * 22) > 0 ? C.yellow : C.red
      ctx.beginPath()
      ctx.arc(4, -13, 2, 0, Math.PI * 2)
      ctx.fillStyle = spark
      ctx.fill()
      ctx.restore()
      break
    }
    case 'zone': {
      const alpha = Math.max(0, Math.min(0.6, p.life / 3)) * 0.9
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(p.x, p.y, 60, 0, Math.PI * 2)
      ctx.fillStyle = C.zone
      ctx.fill()
      ctx.globalAlpha = Math.min(1, alpha * 1.5)
      ctx.strokeStyle = C.zoneEdge
      ctx.lineWidth = 3
      ctx.setLineDash([8, 6])
      ctx.lineDashOffset = -t * 20
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
      break
    }
  }
}

/** 武器图标（HUD 用） */
function drawWeaponIcon(
  ctx: CanvasRenderingContext2D,
  id: WeaponId,
  x: number,
  y: number,
  s: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  switch (id) {
    case 'hairball':
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = C.hairball
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.strokeStyle = C.paper
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(s * 0.42, -s * 0.3)
      ctx.moveTo(0, 0)
      ctx.lineTo(s * 0.45, s * 0.12)
      ctx.stroke()
      break
    case 'yarn':
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2)
      ctx.fillStyle = C.yarnBall
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.strokeStyle = C.paper
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.16, 0.5, Math.PI * 1.5)
      ctx.stroke()
      break
    case 'boomerang':
      ctx.strokeStyle = C.bone
      ctx.lineWidth = s * 0.14
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-s * 0.36, s * 0.1)
      ctx.lineTo(s * 0.36, -s * 0.1)
      ctx.stroke()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(-s * 0.36, s * 0.1)
      ctx.lineTo(-s * 0.46, s * 0.24)
      ctx.moveTo(s * 0.36, -s * 0.1)
      ctx.lineTo(s * 0.46, -s * 0.24)
      ctx.stroke()
      break
    case 'laser':
      ctx.beginPath()
      ctx.ellipse(0, 0, s * 0.34, s * 0.24, 0, 0, Math.PI * 2)
      ctx.fillStyle = C.paper
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2)
      ctx.fillStyle = C.red
      ctx.fill()
      ctx.strokeStyle = C.red
      ctx.lineWidth = s * 0.07
      ctx.beginPath()
      ctx.moveTo(s * 0.3, -s * 0.2)
      ctx.lineTo(s * 0.44, -s * 0.32)
      ctx.moveTo(-s * 0.3, -s * 0.2)
      ctx.lineTo(-s * 0.44, -s * 0.32)
      ctx.stroke()
      break
    case 'fishgun':
      ctx.beginPath()
      ctx.ellipse(0, 0, s * 0.3, s * 0.16, 0, 0, Math.PI * 2)
      ctx.fillStyle = C.fish
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.fillStyle = C.fish
      ctx.beginPath()
      ctx.moveTo(-s * 0.26, 0)
      ctx.lineTo(-s * 0.44, -s * 0.16)
      ctx.lineTo(-s * 0.44, s * 0.16)
      ctx.closePath()
      ctx.fill()
      break
    case 'litterbomb':
      ctx.beginPath()
      ctx.arc(0, s * 0.06, s * 0.28, 0, Math.PI * 2)
      ctx.fillStyle = C.bomb
      ctx.fill()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.4
      ctx.stroke()
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(s * 0.16, -s * 0.22)
      ctx.quadraticCurveTo(s * 0.3, -s * 0.4, s * 0.2, -s * 0.46)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(s * 0.2, -s * 0.48, s * 0.07, 0, Math.PI * 2)
      ctx.fillStyle = C.yellow
      ctx.fill()
      break
  }
  ctx.restore()
}

const ENEMY_PARTICLE_COLOR: Record<SpawnKind, string> = {
  pig: C.pig,
  chicken: C.chick,
  dog: C.dog,
  pigeon: C.pigeon,
  minipigeon: C.pigeonChest,
  boss: C.red,
}

const QUOTE_TEXT: Record<QuoteKey, SurvivorBkStringKey> = {
  start: 'quoteStart',
  boss: 'quoteBoss',
  lowHp: 'quoteLowHp',
  levelUp: 'quoteLevelUp',
  victory: 'quoteVictory',
}

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
    let rafId = 0
    let running = false
    let last = performance.now()

    let callbacks: GameCallbacks = { onScore: () => {} }
    let lastScore = engine.score
    let lastPhase = engine.phase
    let lastPending = 0
    let lastLang: string = langRef.current

    // 视觉状态
    const particles: Particle[] = []
    const popTexts: PopText[] = []
    let banner: Banner | null = null
    let quote: QuoteBubble | null = null
    let shake = 0
    let hurtFlash = 0
    let camX = engine.player.x
    let camY = engine.player.y
    const keys = new Set<string>()
    const joy = { active: false, ax: 0, ay: 0, dx: 0, dy: 0 }
    let walkT = 0
    let time = 0

    const t = (key: SurvivorBkStringKey) => pickLang(S[key], langRef.current)
    const tn = (arr: { zh: string; en: string }[]) =>
      arr.map((item) => pickLang(item, langRef.current))

    /* ================= 事件 → 视觉 ================= */

    const addPop = (
      x: number,
      y: number,
      text: string,
      size: number,
      color: string,
      crit: boolean,
    ): void => {
      if (popTexts.length > 40) popTexts.shift()
      popTexts.push({
        x,
        y,
        text,
        life: 0.9,
        max: 0.9,
        size,
        color,
        crit,
        rot: (Math.random() - 0.5) * 0.3,
      })
    }

    const burst = (x: number, y: number, color: string, count: number): void => {
      for (let i = 0; i < count; i++) {
        if (particles.length > 320) particles.shift()
        const a = Math.random() * Math.PI * 2
        const sp = 60 + Math.random() * 160
        particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 60,
          life: 0.5 + Math.random() * 0.3,
          max: 0.8,
          size: 3 + Math.random() * 4,
          color,
          shape: 'square',
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 10,
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
              ev.crit ? 22 : 15,
              ev.crit ? C.yellow : C.paper,
              ev.crit,
            )
            break
          case 'kill': {
            const color = ENEMY_PARTICLE_COLOR[ev.kind]
            burst(ev.x, ev.y, color, ev.tier === 'boss' ? 26 : 7)
            // 拟声词（限流，幽默核心）
            if (popTexts.length < 9) {
              const pool = S.onomatopoeia
              const word = pool[Math.floor(Math.random() * pool.length)]!
              const colors = [C.paper, C.yellow, C.red]
              addPop(
                ev.x,
                ev.y - 10,
                word,
                17,
                colors[Math.floor(Math.random() * colors.length)]!,
                false,
              )
            }
            break
          }
          case 'collect': {
            particles.push({
              x: ev.x,
              y: ev.y,
              vx: 0,
              vy: -30,
              life: 0.3,
              max: 0.3,
              size: 2.4,
              color: C.fishLight,
              shape: 'spark',
              rot: 0,
              vrot: 0,
            })
            break
          }
          case 'wave':
            banner = { wave: ev.wave, t: 0 }
            break
          case 'boss':
            shake = 14
            burst(engine.boss?.x ?? engine.player.x, engine.boss?.y ?? engine.player.y, C.red, 20)
            break
          case 'boom': {
            shake = Math.max(shake, 7)
            burst(ev.x, ev.y, C.yellow, 8)
            burst(ev.x, ev.y, C.bomb, 8)
            particles.push({
              x: ev.x,
              y: ev.y,
              vx: 0,
              vy: 0,
              life: 0.28,
              max: 0.28,
              size: ev.radius,
              color: C.paper,
              shape: 'circle',
              rot: 0,
              vrot: 0,
            })
            break
          }
          case 'zone':
            for (let i = 0; i < 6; i++) {
              particles.push({
                x: ev.x + (Math.random() - 0.5) * 50,
                y: ev.y + (Math.random() - 0.5) * 50,
                vx: 0,
                vy: -20,
                life: 1.4,
                max: 1.4,
                size: 6,
                color: C.zone,
                shape: 'circle',
                rot: 0,
                vrot: 0,
              })
            }
            break
          case 'levelup':
            break
          case 'hurt':
            hurtFlash = 1
            shake = Math.max(shake, 6)
            break
          case 'quote':
            quote = { text: t(QUOTE_TEXT[ev.key]), t: 0 }
            break
          case 'over':
            break
        }
      }
    }

    /* ================= 更新视觉 ================= */

    const updateVisuals = (dt: number): void => {
      time += dt
      shake = Math.max(0, shake - dt * 30)
      hurtFlash = Math.max(0, hurtFlash - dt * 3.2)
      if (banner) {
        banner.t += dt
        if (banner.t > 2.6) banner = null
      }
      if (quote) {
        quote.t += dt
        if (quote.t > 3.2) quote = null
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
        p.vy += (p.shape === 'square' ? 380 : 0) * dt
        p.rot += p.vrot * dt
        if (p.shape === 'spark') p.size = Math.max(0.5, p.size - dt * 4)
      }
      for (let i = popTexts.length - 1; i >= 0; i--) {
        const pop = popTexts[i]!
        pop.life -= dt
        pop.y -= 42 * dt
        if (pop.life <= 0) popTexts.splice(i, 1)
      }
      // 相机跟随
      const targetX = Math.max(W / 2, Math.min(WORLD_W - W / 2, engine.player.x))
      const targetY = Math.max(H / 2, Math.min(WORLD_H - H / 2, engine.player.y))
      camX += (targetX - camX) * Math.min(1, dt * 5)
      camY += (targetY - camY) * Math.min(1, dt * 5)
      if (engine.player.moving) walkT += dt
    }

    /* ================= 渲染 ================= */

    const drawGround = (): void => {
      if (!ctx) return
      const vx = camX - W / 2
      const vy = camY - H / 2
      ctx.fillStyle = C.grass
      ctx.fillRect(vx, vy, W, H)
      // 棋盘格草皮
      ctx.fillStyle = C.grassDark
      const cell = 120
      const x0 = Math.floor(vx / cell) * cell
      const y0 = Math.floor(vy / cell) * cell
      for (let gx = x0; gx < vx + W + cell; gx += cell) {
        for (let gy = y0; gy < vy + H + cell; gy += cell) {
          if ((Math.floor(gx / cell) + Math.floor(gy / cell)) % 2 === 0) {
            ctx.fillRect(gx, gy, cell, cell)
          }
        }
      }
      // 土地路（中心十字）
      ctx.fillStyle = C.path
      ctx.fillRect(WORLD_W / 2 - 90, vy, 180, H)
      ctx.fillRect(vx, WORLD_H / 2 - 90, W, 180)
      // 装饰草斑
      for (let i = 0; i < 24; i++) {
        const px = ((i * 971 + 13) % (WORLD_W - 80)) + 40
        const py = ((i * 613 + 57) % (WORLD_H - 80)) + 40
        if (px > vx - 30 && px < vx + W + 30 && py > vy - 30 && py < vy + H + 30) {
          ctx.fillStyle = C.grassShade
          ctx.beginPath()
          ctx.ellipse(px, py, 14 + (i % 3) * 6, 9 + (i % 2) * 5, i, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const drawFence = (): void => {
      if (!ctx) return
      const c = ctx
      const vx = camX - W / 2
      const vy = camY - H / 2
      const posts = 90
      const drawPost = (x: number, y: number): void => {
        celBlock(c, x - 5, y - 12, 10, 24, 2, C.fence, C.trunkDark)
        c.fillStyle = C.fenceLight
        c.fillRect(x - 5, y - 12, 10, 3)
      }
      // 上下边栅栏
      for (
        let gx = Math.floor(Math.max(0, vx) / posts) * posts;
        gx <= Math.min(WORLD_W, vx + W);
        gx += posts
      ) {
        if (gx + 60 > vx && gx - 60 < vx + W) {
          if (vy < 30) drawPost(gx, 14)
          if (vy + H > WORLD_H - 30) drawPost(gx, WORLD_H - 14)
        }
      }
      for (
        let gy = Math.floor(Math.max(0, vy) / posts) * posts;
        gy <= Math.min(WORLD_H, vy + H);
        gy += posts
      ) {
        if (gy + 60 > vy && gy - 60 < vy + H) {
          if (vx < 30) drawPost(14, gy)
          if (vx + W > WORLD_W - 30) drawPost(WORLD_W - 14, gy)
        }
      }
      // 横杆
      c.strokeStyle = C.fence
      c.lineWidth = 5
      for (const [fx, fy, horiz] of [
        [0, 6, true],
        [0, WORLD_H - 6, true],
        [6, 0, false],
        [WORLD_W - 6, 0, false],
      ] as const) {
        if (horiz && fy > vy - 10 && fy < vy + H + 10) {
          c.beginPath()
          c.moveTo(Math.max(0, vx), fy)
          c.lineTo(Math.min(WORLD_W, vx + W), fy)
          c.stroke()
        } else if (!horiz && fx > vx - 10 && fx < vx + W + 10) {
          c.beginPath()
          c.moveTo(fx, Math.max(0, vy))
          c.lineTo(fx, Math.min(WORLD_H, vy + H))
          c.stroke()
        }
      }
    }

    const drawProps = (): void => {
      if (!ctx) return
      const vx = camX - W / 2 - 70
      const vy = camY - H / 2 - 70
      for (const p of props) {
        if (p.x < vx || p.x > vx + W + 140 || p.y < vy || p.y > vy + H + 140) continue
        const s = p.s
        switch (p.kind) {
          case 'tree': {
            groundShadow(ctx, p.x, p.y + 8 * s, 16 * s, 6 * s)
            celBlock(ctx, p.x - 5 * s, p.y - 8 * s, 10 * s, 16 * s, 2, C.trunk, C.trunkDark)
            const sway = Math.sin(time * 1.4 + p.seed) * 1.5
            ctx.save()
            ctx.translate(p.x, p.y - 26 * s)
            ctx.rotate(sway * 0.02)
            celBlock(ctx, -16 * s, -14 * s, 32 * s, 24 * s, 8 * s, C.leaf, C.leafDark)
            celBlock(ctx, -10 * s, -20 * s, 20 * s, 12 * s, 6 * s, C.leafLight, C.leafDark)
            ctx.restore()
            break
          }
          case 'rock': {
            groundShadow(ctx, p.x, p.y + 3 * s, 13 * s, 4 * s)
            celBlock(ctx, p.x - 12 * s, p.y - 8 * s, 24 * s, 12 * s, 4 * s, C.rock, C.rockDark)
            celBlock(ctx, p.x - 4 * s, p.y - 13 * s, 12 * s, 8 * s, 3 * s, C.rock, C.rockDark)
            break
          }
          case 'bush': {
            groundShadow(ctx, p.x, p.y + 2 * s, 12 * s, 4 * s)
            celBlock(ctx, p.x - 10 * s, p.y - 7 * s, 20 * s, 12 * s, 6 * s, C.leaf, C.leafDark)
            celBlock(ctx, p.x - 4 * s, p.y - 12 * s, 12 * s, 9 * s, 5 * s, C.leafLight, C.leafDark)
            break
          }
          case 'flower': {
            const sway = Math.sin(time * 2 + p.seed) * 1.2
            ctx.strokeStyle = C.leaf
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.quadraticCurveTo(p.x + 2, p.y - 7, p.x + sway, p.y - 12)
            ctx.stroke()
            ctx.fillStyle = iColor(p.seed)
            for (const a of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
              ctx.beginPath()
              ctx.ellipse(
                p.x + sway + Math.cos(a) * 3,
                p.y - 12 + Math.sin(a) * 3,
                2.6,
                2.6,
                0,
                0,
                Math.PI * 2,
              )
              ctx.fill()
            }
            ctx.beginPath()
            ctx.arc(p.x + sway, p.y - 12, 2, 0, Math.PI * 2)
            ctx.fillStyle = C.yellow
            ctx.fill()
            break
          }
        }
      }
    }

    const iColor = (seed: number): string => (seed % 2 < 1 ? C.red : C.paper)

    const drawMenuScene = (): void => {
      if (!ctx) return
      ctx.fillStyle = C.grass
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = C.grassDark
      for (let gx = -60; gx < W + 60; gx += 120) {
        for (let gy = -60; gy < H + 60; gy += 120) {
          if ((Math.floor(gx / 120) + Math.floor(gy / 120)) % 2 === 0)
            ctx.fillRect(gx, gy, 120, 120)
        }
      }
      ctx.fillStyle = C.path
      ctx.fillRect(W / 2 - 120, 0, 240, H)
      ctx.fillRect(0, H / 2 - 100, W, 200)
      // 待机小黑 + 散步的猪与鸽子（吸引模式）
      drawCat(ctx, W / 2 - 60, H / 2 + 40, 0.3, false, 0, time, 0, 0)
      const pig1: Enemy = {
        id: 0,
        kind: 'pig',
        tier: 'normal',
        x: W / 2 + 140 + Math.sin(time * 0.8) * 60,
        y: H / 2 + 60,
        hp: 1,
        maxHp: 1,
        speed: 0,
        damage: 0,
        radius: 15,
        xp: 1,
        facing: -1,
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
        x: W / 2 - 160 + Math.cos(time * 0.6) * 50,
        y: H / 2 - 40,
        facing: 1,
        wobbleSeed: 2,
      }
      const bird: Enemy = {
        id: 0,
        kind: 'pigeon',
        tier: 'normal',
        x: W / 2 + 240 + Math.cos(time * 0.5) * 40,
        y: H / 2 - 60,
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
      drawPig(ctx, pig1, time)
      drawPig(ctx, pig2, time)
      drawPigeon(ctx, bird, time, false)
      // 标题字（canvas 内，大字压画面）
      ctx.save()
      ctx.translate(W / 2, 150)
      ctx.rotate(-0.03)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'italic 900 74px ' + FONT_DISPLAY
      ctx.fillStyle = C.ink
      ctx.fillText('SURVIVOR', 8, -34)
      ctx.fillText('BLACKY', 8, 34)
      ctx.fillStyle = C.paper
      ctx.fillText('SURVIVOR', 0, -42)
      ctx.fillText('BLACKY', 0, 26)
      ctx.fillStyle = C.red
      ctx.font = 'italic 900 74px ' + FONT_DISPLAY
      ctx.fillText('SURVIVOR', 6, -42)
      ctx.fillText('BLACKY', 6, 26)
      ctx.fillStyle = C.paper
      ctx.fillText('SURVIVOR', 0, -42)
      ctx.fillText('BLACKY', 0, 26)
      ctx.restore()
      // 红影中文副标题
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '900 40px ' + FONT_DISPLAY
      ctx.fillStyle = C.ink
      ctx.fillText('幸存者小黑', W / 2 + 4, 226)
      ctx.fillStyle = C.red
      ctx.fillText('幸存者小黑', W / 2, 222)
    }

    const render = (): void => {
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)
      if (engine.phase === 'menu') {
        drawMenuScene()
        return
      }
      const shX = (Math.random() - 0.5) * shake
      const shY = (Math.random() - 0.5) * shake
      ctx.save()
      ctx.translate(-camX + shX, -camY + shY)
      drawGround()
      drawProps()
      drawFence()
      // 臭气区
      for (const p of engine.projectiles) {
        if (p.kind === 'zone') drawProjectile(ctx, p, time)
      }
      // 小鱼干
      for (const g of engine.gems) drawGem(ctx, g, time)
      // 实体按 y 排序（伪纵深）
      const entities: { y: number; draw: () => void }[] = []
      for (const e of engine.enemies) {
        if (
          e.x < camX - W / 2 - 60 ||
          e.x > camX + W / 2 + 60 ||
          e.y < camY - H / 2 - 60 ||
          e.y > camY + H / 2 + 60
        )
          continue
        entities.push({ y: e.y, draw: () => drawEnemy(ctx!, e, time) })
      }
      entities.push({
        y: engine.player.y,
        draw: () =>
          drawCat(
            ctx!,
            engine.player.x,
            engine.player.y,
            engine.player.facing,
            engine.player.moving,
            walkT,
            time,
            engine.player.invuln,
            engine.player.hurtT,
          ),
      })
      entities.sort((a, b) => a.y - b.y)
      for (const ent of entities) ent.draw()
      // 弹体
      for (const p of engine.projectiles) {
        if (p.kind !== 'zone') drawProjectile(ctx, p, time)
      }
      // 粒子与弹出文字
      for (const p of particles) {
        ctx.globalAlpha = Math.min(1, p.life / p.max)
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        if (p.shape === 'square') {
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
          ctx.strokeStyle = C.ink
          ctx.lineWidth = 1
          ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()
        }
        ctx.restore()
      }
      ctx.globalAlpha = 1
      // 主角台词气泡（世界空间）
      if (quote && engine.phase === 'playing') {
        const qx = engine.player.x
        const qy = engine.player.y - 58
        const alpha = quote.t > 2.6 ? Math.max(0, 1 - (quote.t - 2.6) / 0.6) : 1
        ctx.globalAlpha = alpha
        ctx.font = '700 15px ' + FONT_LABEL
        const tw = ctx.measureText(quote.text).width
        const bw = tw + 26
        ctx.fillStyle = C.paper
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 2
        rr(ctx, qx - bw / 2, qy - 20, bw, 26, 4)
        ctx.fill()
        ctx.stroke()
        // 尾巴
        ctx.beginPath()
        ctx.moveTo(qx - 10, qy + 6)
        ctx.lineTo(qx - 3, qy + 12)
        ctx.lineTo(qx + 4, qy + 6)
        ctx.closePath()
        ctx.fillStyle = C.paper
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = C.ink
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(quote.text, qx, qy - 6)
        ctx.globalAlpha = 1
      }
      ctx.restore()

      drawHUD()
    }

    /* ================= HUD（屏幕空间） ================= */

    const panel = (x: number, y: number, w: number, h: number): void => {
      if (!ctx) return
      ctx.fillStyle = C.paper
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = C.ink
      ctx.globalAlpha = 0.18
      ctx.fillRect(x + 4, y + 4, w, h)
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.rect(x, y, w, h)
      ctx.fillStyle = C.paper
      ctx.fill()
      ctx.stroke()
    }

    const drawHUD = (): void => {
      if (!ctx) return
      const p = engine.player
      // —— 生命条 ——
      const lowHp = p.hp < 0.3 * p.maxHp
      const pulse = lowHp ? 0.75 + Math.sin(time * 8) * 0.25 : 1
      panel(16, 14, 262, 36)
      ctx.font = '700 11px ' + FONT_LABEL
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = C.ink
      ctx.fillText(t('hudHp'), 24, 20)
      ctx.fillStyle = C.barBg
      ctx.fillRect(50, 20, 190, 16)
      const hpRatio = Math.max(0, p.hp / p.maxHp)
      ctx.globalAlpha = pulse
      ctx.fillStyle = C.red
      ctx.fillRect(50, 20, 190 * hpRatio, 16)
      ctx.globalAlpha = 1
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.5
      for (let i = 1; i < 10; i++) {
        ctx.beginPath()
        ctx.moveTo(50 + i * 19, 20)
        ctx.lineTo(50 + i * 19, 36)
        ctx.stroke()
      }
      ctx.font = '700 12px ' + FONT_LABEL
      ctx.fillStyle = C.ink
      ctx.textAlign = 'right'
      ctx.fillText(Math.max(0, Math.ceil(p.hp)) + '/' + p.maxHp, 266, 22)
      // —— 经验条 ——
      panel(16, 56, 262, 24)
      ctx.fillStyle = C.barBg
      ctx.fillRect(24, 62, 200, 10)
      const xpRatio = Math.min(1, engine.xp / engine.xpNext)
      ctx.fillStyle = C.blue
      ctx.fillRect(24, 62, 200 * xpRatio, 10)
      ctx.strokeStyle = C.ink
      ctx.lineWidth = 1.5
      ctx.strokeRect(24, 62, 200, 10)
      // 小鱼干图标
      ctx.fillStyle = C.fish
      ctx.beginPath()
      ctx.ellipse(20, 67, 5, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '700 12px ' + FONT_LABEL
      ctx.textAlign = 'left'
      ctx.fillStyle = C.ink
      ctx.fillText(t('level') + ' ' + engine.currentLevel, 230, 61)
      // —— 右上：时间/波次/击杀 ——
      panel(960 - 16 - 208, 14, 208, 74)
      ctx.font = '700 11px ' + FONT_LABEL
      ctx.textAlign = 'left'
      ctx.fillStyle = C.ink
      const mm = String(Math.floor(engine.survived / 60)).padStart(2, '0')
      const ss = String(Math.floor(engine.survived % 60)).padStart(2, '0')
      ctx.fillText(t('hudTime') + ' ' + mm + ':' + ss, 960 - 16 - 198, 22)
      ctx.fillText(t('hudWave') + ' ' + engine.wave + '/' + WAVE_COUNT, 960 - 16 - 198, 42)
      ctx.fillText(t('hudKills') + ' ' + engine.kills, 960 - 16 - 198, 62)
      // 小骷髅
      ctx.fillStyle = C.ink
      ctx.beginPath()
      ctx.arc(960 - 32, 68, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(960 - 33.4, 71, 2.8, 3)
      ctx.fillRect(960 - 30, 73, 1, 1.4)
      ctx.fillRect(960 - 35, 73, 1, 1.4)
      // —— 武器槽 ——
      if (engine.weapons.length > 0) {
        const n = engine.weapons.length
        const slot = 38
        const startX = 16
        const startY = H - 60
        panel(startX - 4, startY - 4, slot * n + 8, 52)
        for (let i = 0; i < n; i++) {
          const w = engine.weapons[i]!
          drawWeaponIcon(ctx, w.id, startX + i * slot + slot / 2, startY + 14, 26)
          // 等级点
          for (let l = 0; l < 5; l++) {
            const px = startX + i * slot + slot / 2 - 10 + l * 5
            const py = startY + 32
            ctx.beginPath()
            ctx.arc(px, py, 1.8, 0, Math.PI * 2)
            ctx.fillStyle =
              l < w.level ? (w.level >= WEAPON_MAX_LEVEL ? C.yellow : C.ink) : C.pipEmpty
            ctx.fill()
          }
        }
      }
      // —— BOSS 血条 ——
      const boss = engine.boss
      if (boss) {
        const bw = 440
        const bx = W / 2 - bw / 2
        panel(bx - 6, 12, bw + 12, 40)
        ctx.font = 'italic 800 15px ' + FONT_DISPLAY
        ctx.textAlign = 'center'
        ctx.fillStyle = C.ink
        ctx.fillText(t('hudBossHp'), W / 2, 19)
        ctx.fillStyle = C.barBg
        ctx.fillRect(bx, 34, bw, 12)
        ctx.fillStyle = C.red
        ctx.fillRect(bx, 34, bw * Math.max(0, boss.hp / boss.maxHp), 12)
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 1.5
        for (let i = 1; i < 10; i++) {
          ctx.beginPath()
          ctx.moveTo(bx + (i * bw) / 10, 34)
          ctx.lineTo(bx + (i * bw) / 10, 46)
          ctx.stroke()
        }
        ctx.strokeRect(bx, 34, bw, 12)
      }
      // —— 波次横幅 ——
      if (banner) {
        const bt = banner.t
        const slideIn = Math.min(1, bt / 0.25)
        const slideOut = bt > 2.2 ? Math.max(0, 1 - (bt - 2.2) / 0.4) : 1
        const alpha = Math.min(slideIn, slideOut)
        const y = 96 + (1 - slideIn) * -70
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(W / 2, y)
        ctx.rotate(-0.03)
        ctx.fillStyle = C.red
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.rect(-235, -34, 470, 68)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = C.ink
        ctx.fillRect(-235 + 7, -34 + 7, 470, 68)
        ctx.fillStyle = C.red
        ctx.fillRect(-235, -34, 470, 68)
        ctx.stroke()
        const names = tn(S.waveNames)
        const name = names[Math.min(banner.wave, names.length) - 1] ?? ''
        ctx.font = 'italic 900 30px ' + FONT_DISPLAY
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = C.paper
        ctx.fillText('WAVE ' + banner.wave, 0, -8)
        ctx.font = '700 15px ' + FONT_LABEL
        ctx.fillText(name, 0, 16)
        ctx.restore()
        ctx.globalAlpha = 1
      }
      // —— 虚拟摇杆 ——
      if (joy.active) {
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = C.ink
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(joy.ax, joy.ay, 46, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 0.55
        ctx.beginPath()
        ctx.arc(joy.ax + joy.dx, joy.ay + joy.dy, 20, 0, Math.PI * 2)
        ctx.fillStyle = C.paper
        ctx.fill()
        ctx.strokeStyle = C.ink
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      // —— 低血量红晕 / 受伤闪屏 ——
      if (lowHp && engine.phase === 'playing') {
        ctx.globalAlpha = (0.14 + Math.sin(time * 6) * 0.06) * pulse
        ctx.fillStyle = C.red
        ctx.beginPath()
        ctx.rect(0, 0, W, H)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.globalAlpha = 0.5 + Math.sin(time * 6) * 0.2
        ctx.strokeStyle = C.red
        ctx.lineWidth = 10
        ctx.strokeRect(5, 5, W - 10, H - 10)
        ctx.globalAlpha = 1
      }
      if (hurtFlash > 0) {
        ctx.globalAlpha = Math.min(0.35, hurtFlash * 0.35)
        ctx.fillStyle = C.red
        ctx.fillRect(0, 0, W, H)
        ctx.globalAlpha = 1
      }
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
        mx = joy.dx / 46
        my = joy.dy / 46
      }
      engine.setMove(mx, my)
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      const k = event.key
      if (event.target instanceof HTMLButtonElement) {
        // 升级卡片聚焦时仍可用数字键直选（DESIGN.md §5）
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
        if (k === 'Enter' || k === ' ') engine.startRun()
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
      if (len > 46) {
        dx = (dx / len) * 46
        dy = (dy / len) * 46
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
      render()
      sync()
      rafId = requestAnimationFrame(loop)
    }

    /* ================= 浮层（DOM，无障碍可达） ================= */

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

    const fmtTime = (sec: number): string =>
      String(Math.floor(sec / 60)).padStart(2, '0') +
      ':' +
      String(Math.floor(sec % 60)).padStart(2, '0')

    const renderOverlay = (): void => {
      if (!overlayEl || !panelEl) return
      panelEl.replaceChildren()
      const p = engine.phase
      if (p === 'menu') {
        const h = document.createElement('h2')
        h.className = 'sbk-title'
        h.textContent = t('title')
        panelEl.append(h)
        const tag = document.createElement('p')
        tag.className = 'sbk-tagline'
        tag.textContent = t('tagline')
        panelEl.append(tag)
        panelEl.append(row(t('best'), String(scoreService.best(GAME_ID))))
        panelEl.append(mkBtn(t('start'), () => engine.startRun(), true))
        const hint = document.createElement('div')
        hint.className = 'sbk-hint'
        hint.textContent = t('menuHint')
        panelEl.append(hint)
      } else if (p === 'paused') {
        const h = document.createElement('h2')
        h.className = 'sbk-title'
        h.textContent = t('paused')
        panelEl.append(h)
        panelEl.append(mkBtn(t('resume'), () => engine.resume(), true))
        panelEl.append(mkBtn(t('restart'), () => engine.startRun()))
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
    ): { name: string; desc: string; tag: string; lvl: string; newWeapon: boolean } => {
      if (option.kind === 'heal') {
        return {
          name: t('heal_name'),
          desc: t('heal_desc'),
          tag: t('upgradeHeal'),
          lvl: '',
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
      // 等待布局后聚焦第一张卡（无障碍）
      requestAnimationFrame(() => first?.focus())
    }

    const sync = (): void => {
      if (engine.score !== lastScore) {
        lastScore = engine.score
        callbacks.onScore(engine.score)
      }
      if (engine.phase !== lastPhase) {
        lastPhase = engine.phase
        callbacks.onPhase?.(engine.phase)
        renderOverlay()
        renderLevelUp()
        if (engine.phase === 'over') callbacks.onScore(engine.score)
      }
      if (engine.pendingLevelUps !== lastPending) {
        lastPending = engine.pendingLevelUps
        renderLevelUp()
      }
      if (langRef.current !== lastLang) {
        lastLang = langRef.current
        renderOverlay()
        renderLevelUp()
      }
    }

    /* ================= GameInstance 契约 ================= */

    const instance: GameInstance = {
      mount(el) {
        root = document.createElement('div')
        root.className = 'sbk-root'
        canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        canvas.style.touchAction = 'none'
        canvas.tabIndex = -1
        ctx = canvas.getContext('2d')
        canvas.addEventListener('pointerdown', onPointerDown)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerup', onPointerUp)
        canvas.addEventListener('pointercancel', onPointerUp)
        root.appendChild(canvas)
        overlayEl = document.createElement('div')
        overlayEl.className = 'sbk-overlay'
        panelEl = document.createElement('div')
        panelEl.className = 'sbk-panel'
        overlayEl.appendChild(panelEl)
        root.appendChild(overlayEl)
        levelupEl = document.createElement('div')
        levelupEl.className = 'sbk-levelup'
        root.appendChild(levelupEl)
        el.appendChild(root)
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        // 预热画布字体（Anybody 等自托管字体）
        try {
          void document.fonts.load('italic 900 40px Anybody')
          void document.fonts.load('700 20px "Space Grotesk"')
        } catch {
          /* 字体预热失败不阻塞 */
        }
        // 初始阶段上报（ADR-0007）
        callbacks.onPhase?.(engine.phase)
        renderOverlay()
        renderLevelUp()
        render()
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
        root?.remove()
        root = null
        canvas = null
        ctx = null
        overlayEl = null
        panelEl = null
        levelupEl = null
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
