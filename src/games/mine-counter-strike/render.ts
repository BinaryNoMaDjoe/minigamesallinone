import type { McsEngine, Entity } from './engine'
import { WEAPON_INDEX, SKIN_INDEX } from './weapons'
import type { SkinId, WeaponId } from './strings'

// ============================================================
// MineCounter-Strike —— 射线投射渲染层（DESIGN.md v0.1 §0/§8）
// 低分辨率 480×270 内部画布（16:9），像素化拉伸 = 体素风。
// 墙贴图程序化生成；敌人为方块化士兵精灵（billboard，按 zbuffer 遮挡）。
// ============================================================

export const VIEW_W = 480
export const VIEW_H = 270
const TEX = 16 // 墙贴图分辨率

export interface Camera {
  x: number
  y: number
  angle: number
  pitch: number
  zoom: number // 0..1（0=腰射 1=开镜，用于平滑缩放）
}

export interface KillFeedItem {
  text: string
  t: number
}

export interface HudView {
  time: number
  adsBlend: number
  muzzle: number
  recoil: number
  hitmarker: number
  damageFlash: number
  killFeed: KillFeedItem[]
}

export interface RenderOptions {
  /** 是否绘制第一人称武器（战斗/载入为 true，菜单旋转镜头为 false） */
  drawGun: boolean
  /** 是否绘制战斗 HUD（血量/弹药/计时/比分/小地图/击杀播报） */
  drawHud: boolean
  /** 菜单预览用的单个角色（覆盖场景实体） */
  preview?: { skin: SkinId; team: 0 | 1 } | null
}

interface WallTexture {
  base: string
  dark: string
  line: string
}

// 材质纹理配色（DESIGN.md §4 材质表）
const WALL_TEX: Record<number, WallTexture> = {
  1: { base: '#7c7c7c', dark: '#5c5c5c', line: '#3a3a3a' }, // 石砖
  2: { base: '#8a5a2b', dark: '#6b4520', line: '#4a2f15' }, // 木箱
  3: { base: '#d9c48a', dark: '#c0ab70', line: '#8a7a4a' }, // 沙
  4: { base: '#c9a96a', dark: '#b0914f', line: '#8a6f3a' }, // 砂岩
  5: { base: '#eef4f8', dark: '#d4e0e8', line: '#a8b8c4' }, // 雪砖
  6: { base: '#a8d8f0', dark: '#8fc4de', line: '#6aa6c4' }, // 冰
  7: { base: '#6a7270', dark: '#525a58', line: '#343a38' }, // 金属集装箱
  8: { base: '#9a6b3f', dark: '#7a5230', line: '#523620' }, // 木板
  9: { base: '#a3523f', dark: '#7f3f30', line: '#5a2c20' }, // 红砖
  10: { base: '#c98a4b', dark: '#ab7038', line: '#7a4c24' }, // 球场木
  11: { base: '#9a9a9a', dark: '#7c7c7c', line: '#5a5a5a' }, // 混凝土
}

function hash2(x: number, y: number, seed: number): number {
  let n = (x * 374761393 + y * 668265263 + seed * 2246822519) >>> 0
  n = (n ^ (n >> 13)) >>> 0
  n = (n * 1274126177) >>> 0
  return ((n ^ (n >> 16)) >>> 0) / 0x100000000
}

const GUN_STYLE: Record<WeaponId, { body: string; dark: string; accent: string }> = {
  pistol: { body: '#4a4a4a', dark: '#2f2f2f', accent: '#6a6a6a' },
  smg: { body: '#3f5a6a', dark: '#2b3f4a', accent: '#5a7a8a' },
  rifle: { body: '#4a4a3a', dark: '#33322a', accent: '#6a6a52' },
  machinegun: { body: '#4a3f2f', dark: '#332c22', accent: '#6a5a3f' },
  sniper: { body: '#3a3f4a', dark: '#292d35', accent: '#5a616f' },
}

export class RaycastRenderer {
  private textures = new Map<number, HTMLCanvasElement>()
  private soldiers = new Map<string, HTMLCanvasElement>()

  texture(mat: number): HTMLCanvasElement {
    const hit = this.textures.get(mat)
    if (hit) return hit
    const tex = WALL_TEX[mat] ?? WALL_TEX[1]!
    const c = document.createElement('canvas')
    c.width = TEX
    c.height = TEX
    const g = c.getContext('2d')!
    g.fillStyle = tex.base
    g.fillRect(0, 0, TEX, TEX)
    for (let y = 0; y < TEX; y++) {
      for (let x = 0; x < TEX; x++) {
        const n = hash2(x, y, mat)
        if (n > 0.72) {
          g.fillStyle = tex.dark
          g.fillRect(x, y, 1, 1)
        } else if (n < 0.18) {
          g.fillStyle = '#ffffff'
          g.globalAlpha = 0.08
          g.fillRect(x, y, 1, 1)
          g.globalAlpha = 1
        }
      }
    }
    // 方块描边（Minecraft 体素感）
    g.fillStyle = tex.line
    g.fillRect(0, 0, TEX, 1)
    g.fillRect(0, TEX - 1, TEX, 1)
    g.fillRect(0, 0, 1, TEX)
    g.fillRect(TEX - 1, 0, 1, TEX)
    this.textures.set(mat, c)
    return c
  }

  private soldier(skin: SkinId, team: 0 | 1): HTMLCanvasElement {
    const key = skin + ':' + team
    const hit = this.soldiers.get(key)
    if (hit) return hit
    const s = SKIN_INDEX[skin] ?? SKIN_INDEX.red!
    const teamColor = team === 0 ? '#e62429' : '#0074e4'
    const W = 12
    const H = 24
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!
    const ink = '#1c1b1b'
    // 头（6×7）
    g.fillStyle = s.color
    g.fillRect(3, 0, 6, 6)
    g.fillStyle = teamColor
    g.fillRect(3, 0, 6, 2) // 队色头盔条
    g.fillStyle = ink
    g.fillRect(3, 6, 6, 1)
    // 脸（眼）
    g.fillStyle = '#ffffff'
    g.fillRect(4, 3, 2, 1)
    g.fillRect(7, 3, 2, 1)
    g.fillStyle = '#1c1b1b'
    g.fillRect(4, 4, 1, 1)
    g.fillRect(7, 4, 1, 1)
    // 身体（6×7）
    g.fillStyle = s.color
    g.fillRect(3, 7, 6, 7)
    g.fillStyle = s.dark
    g.fillRect(3, 13, 6, 1)
    // 手臂（两侧）
    g.fillStyle = s.dark
    g.fillRect(1, 7, 2, 7)
    g.fillRect(9, 7, 2, 7)
    // 腿（2×4 两段）
    g.fillStyle = '#3a3a3a'
    g.fillRect(3, 14, 3, 7)
    g.fillRect(6, 14, 3, 7)
    g.fillStyle = ink
    g.fillRect(3, 20, 3, 1)
    g.fillRect(6, 20, 3, 1)
    // 描边
    g.fillStyle = ink
    g.fillRect(2, 0, 8, 1)
    g.fillRect(0, 0, 1, H)
    g.fillRect(W - 1, 0, 1, H)
    this.soldiers.set(key, c)
    return c
  }

  render(
    ctx: CanvasRenderingContext2D,
    engine: McsEngine,
    cam: Camera,
    view: HudView,
    opts: RenderOptions,
  ): void {
    const map = engine.map
    const grid = map.grid
    const W = VIEW_W
    const H = VIEW_H

    // 相机方向 + 平面（开镜缩放：zoom 越小越放大）
    const zoom = 1 - cam.zoom * (1 - Math.max(0.3, this.adsZoomFor(engine)))
    const dirX = Math.cos(cam.angle)
    const dirY = Math.sin(cam.angle)
    const planeLen = 0.66 * zoom
    const planeX = -dirY * planeLen
    const planeY = dirX * planeLen
    const horizon = Math.max(0, Math.min(H, Math.round(H / 2 + Math.tan(cam.pitch) * H * 0.42)))

    ctx.imageSmoothingEnabled = false
    // 天与地
    ctx.fillStyle = map.ceiling
    ctx.fillRect(0, 0, W, Math.max(0, horizon))
    ctx.fillStyle = map.floor
    ctx.fillRect(0, horizon, W, H - horizon)

    const zbuffer = new Float32Array(W)

    // —— 墙体（逐列 DDA）——
    for (let x = 0; x < W; x++) {
      const cameraX = (2 * x) / W - 1
      const rdx = dirX + planeX * cameraX
      const rdy = dirY + planeY * cameraX
      let mapX = Math.floor(cam.x)
      let mapY = Math.floor(cam.y)
      const deltaX = rdx === 0 ? Infinity : Math.abs(1 / rdx)
      const deltaY = rdy === 0 ? Infinity : Math.abs(1 / rdy)
      const stepX = rdx < 0 ? -1 : 1
      const stepY = rdy < 0 ? -1 : 1
      let sideX = rdx === 0 ? Infinity : (rdx > 0 ? mapX + 1 - cam.x : cam.x - mapX) * deltaX
      let sideY = rdy === 0 ? Infinity : (rdy > 0 ? mapY + 1 - cam.y : cam.y - mapY) * deltaY
      let side: 0 | 1 = 0
      let cell = 0
      for (let i = 0; i < 256; i++) {
        if (sideX < sideY) {
          sideX += deltaX
          mapX += stepX
          side = 0
        } else {
          sideY += deltaY
          mapY += stepY
          side = 1
        }
        if (mapX < 0 || mapY < 0 || mapX >= map.width || mapY >= map.height) break
        cell = grid[mapY]![mapX]!
        if (cell !== 0) break
      }
      if (cell === 0) {
        zbuffer[x] = Infinity
        continue
      }
      const perp = side === 0 ? sideX - deltaX : sideY - deltaY
      zbuffer[x] = perp
      let wallX: number
      if (side === 0) wallX = cam.y + perp * rdy
      else wallX = cam.x + perp * rdx
      wallX -= Math.floor(wallX)
      const lineHeight = Math.max(1, Math.round(H / perp))
      const top = horizon - (lineHeight >> 1)
      const tex = this.texture(cell)
      const texCol = Math.min(TEX - 1, Math.floor(wallX * TEX))
      ctx.drawImage(tex, texCol, 0, 1, TEX, x, top, 1, lineHeight)
      if (side === 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)'
        ctx.fillRect(x, top, 1, lineHeight)
      }
      // 远距淡雾
      if (perp > 12) {
        ctx.fillStyle = map.fog
        ctx.globalAlpha = Math.min(0.55, (perp - 12) / 40)
        ctx.fillRect(x, top, 1, lineHeight)
        ctx.globalAlpha = 1
      }
    }

    // —— 精灵（敌人 / 队友 / 菜单预览）——
    const sprites: { e: Entity | null; x: number; y: number; skin: SkinId; team: 0 | 1 }[] = []
    if (opts.preview) {
      sprites.push({
        e: null,
        x: cam.x + dirX * 3.2,
        y: cam.y + dirY * 3.2,
        skin: opts.preview.skin,
        team: opts.preview.team,
      })
    } else {
      for (const e of engine.entities) {
        if (!e.alive) continue
        if (e.isPlayer) continue
        sprites.push({ e, x: e.x, y: e.y, skin: e.skin, team: e.team })
      }
    }
    // 距离排序（远→近）
    const invDet = 1 / (planeX * dirY - dirX * planeY)
    sprites.sort((a, b) => {
      const da = (a.x - cam.x) * (a.x - cam.x) + (a.y - cam.y) * (a.y - cam.y)
      const db = (b.x - cam.x) * (b.x - cam.x) + (b.y - cam.y) * (b.y - cam.y)
      return db - da
    })
    for (const sp of sprites) {
      const relX = sp.x - cam.x
      const relY = sp.y - cam.y
      const tfY = invDet * (-planeY * relX + planeX * relY)
      if (tfY <= 0.15) continue
      const tfX = invDet * (dirY * relX - dirX * relY)
      const screenX = (W / 2) * (1 + tfX / tfY)
      const hpx = Math.round(H / tfY)
      if (hpx < 4 || hpx > H * 6) continue
      const wpx = Math.round(hpx * 0.6)
      const top = horizon - (hpx >> 1)
      const left = Math.round(screenX - wpx / 2)
      const spr = this.soldier(sp.skin, sp.team)
      // 按 zbuffer 逐列遮挡绘制
      const right = left + wpx
      for (let sx = Math.max(0, left); sx < Math.min(W, right); sx++) {
        if (tfY >= zbuffer[sx]!) continue
        const u = Math.floor(((sx - left) / wpx) * spr.width)
        ctx.drawImage(spr, u, 0, 1, spr.height, sx, top, 1, hpx)
      }
    }

    // —— 第一人称武器 ——
    if (opts.drawGun) {
      const wId = engine.player.weapons[engine.player.slot] ?? 'rifle'
      this.drawGun(ctx, wId, view.adsBlend, view.recoil, view.muzzle, view.time)
    }

    // —— 准星 / 开镜 ——
    if (opts.drawGun) {
      this.drawAim(ctx, engine, view.adsBlend, view.hitmarker)
    }

    // —— 受伤红闪 ——
    if (view.damageFlash > 0) {
      ctx.fillStyle = 'rgba(186,26,26,' + Math.min(0.35, view.damageFlash * 0.35).toFixed(3) + ')'
      ctx.fillRect(0, 0, W, H)
    }

    // —— 战斗 HUD ——
    if (opts.drawHud) {
      this.drawHud(ctx, engine, view)
    }
  }

  private adsZoomFor(engine: McsEngine): number {
    const w = WEAPON_INDEX[engine.player.weapons[engine.player.slot] ?? 'rifle']
    return w.adsZoom
  }

  private drawGun(
    ctx: CanvasRenderingContext2D,
    weaponId: WeaponId,
    adsBlend: number,
    recoil: number,
    muzzle: number,
    time: number,
  ): void {
    const st = GUN_STYLE[weaponId] ?? GUN_STYLE.pistol!
    const W = VIEW_W
    const H = VIEW_H
    const bx = Math.round(W * 0.5 + (1 - adsBlend) * W * 0.13)
    const baseY = H + 8
    const kick = recoil * 14
    const bob = Math.sin(time * 8) * (1 - adsBlend) * 2.2
    const y = baseY - kick + Math.round(bob)
    ctx.fillStyle = st.dark
    // 枪身
    ctx.fillRect(bx - 16, y - 30, 30, 22)
    ctx.fillStyle = st.body
    ctx.fillRect(bx - 14, y - 28, 26, 16)
    // 枪管
    const barrelLen =
      weaponId === 'sniper' ? 46 : weaponId === 'rifle' ? 38 : weaponId === 'smg' ? 26 : 22
    ctx.fillStyle = st.dark
    ctx.fillRect(bx + 12, y - 24, barrelLen, 6)
    ctx.fillStyle = st.accent
    ctx.fillRect(bx + 12, y - 23, barrelLen, 3)
    // 弹匣 / 握把
    if (weaponId !== 'sniper') {
      ctx.fillStyle = st.dark
      ctx.fillRect(bx - 2, y - 8, 8, 14)
      ctx.fillStyle = st.body
      ctx.fillRect(bx - 1, y - 7, 6, 12)
    }
    // 狙击镜
    if (weaponId === 'sniper') {
      ctx.fillStyle = '#2f2f2f'
      ctx.fillRect(bx - 6, y - 38, 12, 10)
      ctx.fillStyle = '#6aa6c4'
      ctx.fillRect(bx - 4, y - 36, 4, 4)
      ctx.fillRect(bx + 2, y - 36, 4, 4)
    }
    // 手
    ctx.fillStyle = SKIN_INDEX[this.skinHint] ? SKIN_INDEX[this.skinHint].color : '#c98a4b'
    ctx.fillRect(bx - 18, y - 18, 6, 10)
    // 枪口火光
    if (muzzle > 0.15) {
      const mx = bx + 12 + barrelLen
      ctx.fillStyle = '#ffd700'
      ctx.fillRect(mx, y - 25, 8, 8)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(mx + 2, y - 23, 4, 4)
      ctx.fillStyle = '#e62429'
      ctx.fillRect(mx - 2, y - 22, 4, 4)
    }
    // 描边
    ctx.strokeStyle = '#1c1b1b'
    ctx.lineWidth = 1
    ctx.strokeRect(bx - 16, y - 30, 30, 22)
  }

  private skinHint: SkinId = 'red'

  private drawAim(
    ctx: CanvasRenderingContext2D,
    engine: McsEngine,
    adsBlend: number,
    hitmarker: number,
  ): void {
    const W = VIEW_W
    const H = VIEW_H
    const cx = W / 2
    const cy = H / 2
    const wId = engine.player.weapons[engine.player.slot] ?? 'rifle'
    const isSniper = wId === 'sniper' && adsBlend > 0.5
    ctx.fillStyle = '#1c1b1b'
    if (isSniper) {
      // 狙击镜：暗环 + 十字
      ctx.fillStyle = 'rgba(0,0,0,0.85)'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#1c1b1b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(cx, cy, 72, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = '#1c1b1b'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx - 72, cy)
      ctx.lineTo(cx + 72, cy)
      ctx.moveTo(cx, cy - 72)
      ctx.lineTo(cx, cy + 72)
      ctx.stroke()
      ctx.fillStyle = '#e62429'
      ctx.fillRect(cx - 1, cy - 1, 2, 2)
      return
    }
    // 普通准星（开镜更收紧）
    const gap = Math.round(3 + (1 - adsBlend) * 6)
    const len = Math.round(5 + adsBlend * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(cx - gap - len, cy - 1, len, 2)
    ctx.fillRect(cx + gap, cy - 1, len, 2)
    ctx.fillRect(cx - 1, cy - gap - len, 2, len)
    ctx.fillRect(cx - 1, cy + gap, 2, len)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - gap - len, cy - 1, len, 1)
    ctx.fillRect(cx + gap, cy - 1, len, 1)
    ctx.fillRect(cx - 1, cy - gap - len, 1, len)
    ctx.fillRect(cx - 1, cy + gap, 1, len)
    if (hitmarker > 0) {
      const s = 6
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - s, cy - s)
      ctx.lineTo(cx - s + 3, cy - s + 3)
      ctx.moveTo(cx + s, cy - s)
      ctx.lineTo(cx + s - 3, cy - s + 3)
      ctx.moveTo(cx - s, cy + s)
      ctx.lineTo(cx - s + 3, cy + s - 3)
      ctx.moveTo(cx + s, cy + s)
      ctx.lineTo(cx + s - 3, cy + s - 3)
      ctx.stroke()
    }
  }

  private pxText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size: number,
    color: string,
    align: CanvasTextAlign = 'left',
  ): void {
    ctx.font = size + 'px "Press Start 2P", monospace'
    ctx.textAlign = align
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#1c1b1b'
    ctx.fillText(text, x + 1, y + 1)
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
  }

  private drawHud(ctx: CanvasRenderingContext2D, engine: McsEngine, view: HudView): void {
    const W = VIEW_W
    const H = VIEW_H
    const p = engine.player
    const wId = p.weapons[p.slot] ?? 'rifle'
    const w = WEAPON_INDEX[wId]

    // 血量（左下）
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(8, H - 34, 132, 26)
    ctx.strokeStyle = '#1c1b1b'
    ctx.lineWidth = 1
    ctx.strokeRect(8, H - 34, 132, 26)
    ctx.fillStyle = '#dcd9d9'
    ctx.fillRect(34, H - 28, 96, 8)
    ctx.fillStyle = p.hp > 30 ? '#e62429' : '#ba1a1a'
    ctx.fillRect(34, H - 28, Math.round(96 * Math.max(0, p.hp / 100)), 8)
    this.pxText(ctx, 'HP ' + Math.max(0, p.hp), 34, H - 18, 6, '#e5e2e1')

    // 弹药（右下）
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(W - 150, H - 34, 142, 26)
    ctx.strokeStyle = '#1c1b1b'
    ctx.strokeRect(W - 150, H - 34, 142, 26)
    const ammoText = p.reloading > 0 ? 'RELOAD' : p.ammo[p.slot]! + '/' + w.magSize
    this.pxText(ctx, ammoText, W - 144, H - 28, 7, p.reloading > 0 ? '#ffd700' : '#e5e2e1')
    this.pxText(ctx, '[' + (p.slot + 1) + ']', W - 144, H - 17, 5, '#9aa2aa')

    // 计时 + 比分（顶部居中）
    const mm = String(Math.floor(Math.max(0, engine.timeLeft) / 60)).padStart(2, '0')
    const ss = String(Math.floor(Math.max(0, engine.timeLeft) % 60)).padStart(2, '0')
    this.pxText(ctx, mm + ':' + ss, W / 2 - 70, 8, 9, '#ffffff', 'left')
    this.pxText(
      ctx,
      engine.teamScores[0] + ' : ' + engine.teamScores[1],
      W / 2 + 8,
      8,
      9,
      '#ffd700',
      'left',
    )

    // 小地图（右上）
    this.drawMinimap(ctx, engine)

    // 击杀播报（右上小地图下方）
    let ky = 122
    for (const item of view.killFeed.slice(-4).reverse()) {
      this.pxText(ctx, item.text, W - 8, ky, 5, '#ffffff', 'right')
      ky += 11
    }

    // 换弹提示
    if (p.reloading > 0) {
      const prog = 1 - p.reloading / w.reloadTime
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(W / 2 - 50, H / 2 + 26, 100, 8)
      ctx.fillStyle = '#ffd700'
      ctx.fillRect(W / 2 - 50, H / 2 + 26, Math.round(100 * prog), 8)
    }
  }

  private drawMinimap(ctx: CanvasRenderingContext2D, engine: McsEngine): void {
    const map = engine.map
    const size = 92
    const ox = VIEW_W - size - 8
    const oy = 8
    const cs = size / map.width
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(ox - 2, oy - 2, size + 4, size + 4)
    ctx.fillStyle = 'rgba(20,20,20,0.7)'
    ctx.fillRect(ox, oy, size, size)
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.grid[y]![x] !== 0) {
          ctx.fillStyle = '#6a7270'
          ctx.fillRect(ox + x * cs, oy + y * cs, Math.max(1, cs), Math.max(1, cs))
        }
      }
    }
    for (const e of engine.entities) {
      if (!e.alive) continue
      const dx = ox + e.x * cs
      const dy = oy + e.y * cs
      ctx.fillStyle = e.isPlayer ? '#ffffff' : e.team === 0 ? '#e62429' : '#0074e4'
      ctx.fillRect(dx - 1, dy - 1, 3, 3)
    }
  }

  setSkinHint(skin: SkinId): void {
    this.skinHint = skin
  }
}
