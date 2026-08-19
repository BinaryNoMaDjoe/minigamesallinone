import { MAPS, MAP_INDEX } from './maps.ts'
import type { MapDef } from './maps.ts'
import { WEAPON_INDEX, SKINS } from './weapons.ts'
import type { WeaponDef } from './weapons.ts'
import type { MapId, SkinId, WeaponId } from './strings.ts'

// ============================================================
// MineCounter-Strike —— 纯逻辑引擎（决策 #25）
// 唯一出处：同目录 DESIGN.md v0.1
// 无 DOM / 无 React：可注入随机源，node 直跑可测（engine.test.ts）
// 2.5D 射线投射 FPS：移动碰撞、DDA 射线、命中判定、bot AI、计分、状态机、计时
// ============================================================

export type Rng = () => number
export type GamePhase = 'menu' | 'playing' | 'paused' | 'over'
export type MatchState = 'loadout' | 'combat' | 'ended'
export type Team = 0 | 1

// —— 常量（DESIGN.md v0.1 §2/§7） ——
export const WORLD_TIME_LIMIT = 300
export const LOADOUT_TIME = 30
export const RESPAWN_TIME = 3
export const HP_MAX = 100
export const MOVE_SPEED = 3.2
export const PLAYER_RADIUS = 0.3
export const BOT_TURN_SPEED = 3.0
export const BOT_AWARENESS = 24
export const ASSIST_WINDOW = 4
export const TEAM_SIZE = 5

export interface DamageEntry {
  by: number
  at: number
}

export interface BotAI {
  state: 'idle' | 'chase' | 'attack'
  targetId: number | null
  patrolX: number
  patrolY: number
  lastKnownX: number
  lastKnownY: number
  reaction: number
  nextDecision: number
  strafeDir: number
}

export interface Entity {
  id: number
  isPlayer: boolean
  name: string
  team: Team
  x: number
  y: number
  angle: number
  pitch: number
  hp: number
  alive: boolean
  respawnTimer: number
  weapons: WeaponId[]
  slot: number
  ammo: number[]
  reloading: number
  fireCooldown: number
  skin: SkinId
  kills: number
  deaths: number
  assists: number
  damageHistory: DamageEntry[]
  ai: BotAI | null
}

export interface RayHit {
  dist: number
  side: 0 | 1
  mapX: number
  mapY: number
  wallX: number
  hit: boolean
}

export type EngineEvent =
  | { type: 'shot' }
  | { type: 'hit'; x: number; y: number; amount: number; headshot: boolean; by: number }
  | { type: 'kill'; killerId: number; victimId: number; headshot: boolean; weaponId: WeaponId }
  | { type: 'damaged' }
  | { type: 'matchStart' }
  | { type: 'matchEnd'; winner: -1 | 0 | 1 }

function defaultRng(): number {
  return Math.random()
}

export function normalizeAngle(a: number): number {
  let x = a
  while (x > Math.PI) x -= Math.PI * 2
  while (x < -Math.PI) x += Math.PI * 2
  return x
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

// —— DDA 射线（欧氏距离），供命中遮挡 / bot 视线 / 敌我遮挡判定 ——
export function castRay(px: number, py: number, angle: number, grid: number[][]): RayHit {
  const w = grid[0]?.length ?? 0
  const h = grid.length
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  let mapX = Math.floor(px)
  let mapY = Math.floor(py)
  const deltaX = dirX === 0 ? Infinity : Math.abs(1 / dirX)
  const deltaY = dirY === 0 ? Infinity : Math.abs(1 / dirY)
  const stepX = dirX < 0 ? -1 : 1
  const stepY = dirY < 0 ? -1 : 1
  let sideX = dirX === 0 ? Infinity : (dirX > 0 ? mapX + 1 - px : px - mapX) * deltaX
  let sideY = dirY === 0 ? Infinity : (dirY > 0 ? mapY + 1 - py : py - mapY) * deltaY
  let side: 0 | 1 = 0
  for (let i = 0; i < 512; i++) {
    if (sideX < sideY) {
      sideX += deltaX
      mapX += stepX
      side = 0
    } else {
      sideY += deltaY
      mapY += stepY
      side = 1
    }
    if (mapX < 0 || mapY < 0 || mapX >= w || mapY >= h) {
      return { dist: Infinity, side, mapX, mapY, wallX: 0, hit: false }
    }
    if (grid[mapY]![mapX] !== 0) {
      const dist = side === 0 ? sideX - deltaX : sideY - deltaY
      let wallX: number
      if (side === 0) wallX = py + dist * dirY
      else wallX = px + dist * dirX
      wallX -= Math.floor(wallX)
      return { dist, side, mapX, mapY, wallX, hit: true }
    }
  }
  return { dist: Infinity, side, mapX, mapY, wallX: 0, hit: false }
}

/** 圆形（按方块近似）碰撞检测 */
function collides(x: number, y: number, r: number, grid: number[][]): boolean {
  const w = grid[0]?.length ?? 0
  const h = grid.length
  for (const dx of [-r, r]) {
    for (const dy of [-r, r]) {
      const cx = Math.floor(x + dx)
      const cy = Math.floor(y + dy)
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) return true
      if (grid[cy]![cx] !== 0) return true
    }
  }
  return false
}

function moveEntity(e: Entity, dx: number, dy: number, grid: number[][]): void {
  const nx = e.x + dx
  if (!collides(nx, e.y, PLAYER_RADIUS, grid)) e.x = nx
  const ny = e.y + dy
  if (!collides(e.x, ny, PLAYER_RADIUS, grid)) e.y = ny
}

/** 俯仰判定：'miss'（越过头顶/射进地面）/ 'head'（头部带）/ 'body' */
function verticalHit(pitch: number, dist: number): 'miss' | 'head' | 'body' {
  const bodyTop = Math.atan2(0.25, dist)
  const headTop = Math.atan2(0.5, dist)
  const feet = Math.atan2(-0.5, dist)
  if (pitch > headTop || pitch < feet) return 'miss'
  if (pitch > bodyTop) return 'head'
  return 'body'
}

export interface McsEngineOptions {
  random?: Rng
}

export class McsEngine {
  readonly rng: Rng

  phase: GamePhase = 'menu'
  matchState: MatchState = 'combat'
  map: MapDef = MAPS[0]!
  entities: Entity[] = []
  player: Entity
  selectedSkin: SkinId = 'red'
  selectedMap: MapId = 'shipment'
  teamScores: [number, number] = [0, 0]
  winner: -1 | 0 | 1 = -1
  matchClock = 0
  timeLeft = 0
  /** 玩家开镜状态 */
  playerAds = false
  /** 玩家是否按住扳机 */
  firing = false
  private inputX = 0
  private inputY = 0
  private events: EngineEvent[] = []

  constructor(opts: McsEngineOptions = {}) {
    this.rng = opts.random ?? defaultRng
    this.player = this.makeEntity(0, true, 'YOU', 0, 12.5, 12.5, 0, this.selectedSkin)
    this.entities = [this.player]
  }

  private makeEntity(
    id: number,
    isPlayer: boolean,
    name: string,
    team: Team,
    x: number,
    y: number,
    angle: number,
    skin: SkinId,
  ): Entity {
    return {
      id,
      isPlayer,
      name,
      team,
      x,
      y,
      angle,
      pitch: 0,
      hp: HP_MAX,
      alive: true,
      respawnTimer: 0,
      weapons: ['rifle', 'pistol'],
      slot: 0,
      ammo: [WEAPON_INDEX.rifle.magSize, WEAPON_INDEX.pistol.magSize],
      reloading: 0,
      fireCooldown: 0,
      skin,
      kills: 0,
      deaths: 0,
      assists: 0,
      damageHistory: [],
      ai: isPlayer ? null : this.makeBotAI(),
    }
  }

  private makeBotAI(): BotAI {
    return {
      state: 'idle',
      targetId: null,
      patrolX: 12.5,
      patrolY: 12.5,
      lastKnownX: 12.5,
      lastKnownY: 12.5,
      reaction: 0,
      nextDecision: 0,
      strafeDir: 1,
    }
  }

  private byId(id: number): Entity | undefined {
    return this.entities.find((e) => e.id === id)
  }

  private currentWeapon(e: Entity): WeaponDef {
    return WEAPON_INDEX[e.weapons[e.slot] ?? 'pistol']
  }

  /* ================= 流程 ================= */

  setSkin(skin: SkinId): void {
    this.selectedSkin = skin
    this.player.skin = skin
  }

  setMap(mapId: MapId): void {
    this.selectedMap = mapId
    this.map = MAP_INDEX[mapId] ?? MAPS[0]!
  }

  /** 从主菜单进入比赛：设地图、重置角色、进入 30s 载入阶段 */
  beginMatch(mapId?: MapId): void {
    if (mapId) this.setMap(mapId)
    const map = this.map
    const entities: Entity[] = []
    const sk = this.selectedSkin
    // A 队（真人 + 4 bot）
    entities.push(
      this.makeEntity(0, true, 'YOU', 0, map.teamA[0]!.x, map.teamA[0]!.y, map.teamA[0]!.angle, sk),
    )
    for (let i = 0; i < TEAM_SIZE - 1; i++) {
      const sp = map.teamA[i + 1]!
      entities.push(
        this.makeEntity(i + 1, false, 'A' + (i + 2), 0, sp.x, sp.y, sp.angle, this.randomSkin()),
      )
    }
    // B 队（5 bot）
    for (let i = 0; i < TEAM_SIZE; i++) {
      const sp = map.teamB[i]!
      entities.push(
        this.makeEntity(i + 5, false, 'B' + (i + 1), 1, sp.x, sp.y, sp.angle, this.randomSkin()),
      )
    }
    this.entities = entities
    this.player = entities[0]!
    this.teamScores = [0, 0]
    this.winner = -1
    this.matchClock = 0
    this.timeLeft = LOADOUT_TIME
    this.matchState = 'loadout'
    this.phase = 'playing'
    this.playerAds = false
    this.firing = false
    this.inputX = 0
    this.inputY = 0
    this.events = []
  }

  private randomSkin(): SkinId {
    return SKINS[Math.floor(this.rng() * SKINS.length)]?.id ?? 'red'
  }

  /** 载入阶段选枪（0=主武器，1=副武器） */
  pickWeapon(slot: number, weaponId: WeaponId): void {
    if (this.matchState !== 'loadout') return
    const p = this.player
    p.weapons[slot] = weaponId
    p.ammo[slot] = WEAPON_INDEX[weaponId].magSize
    if (slot === p.slot) {
      p.fireCooldown = 0
      p.reloading = 0
    }
  }

  /** 载入锁定：若未选满两把，用默认补齐后开战 */
  confirmLoadout(): void {
    if (this.matchState !== 'loadout') return
    const p = this.player
    if (p.weapons[0] === p.weapons[1]) p.weapons[1] = 'pistol'
    p.ammo[0] = WEAPON_INDEX[p.weapons[0]!].magSize
    p.ammo[1] = WEAPON_INDEX[p.weapons[1]!].magSize
    p.slot = 0
    p.reloading = 0
    p.fireCooldown = 0
    this.matchState = 'combat'
    this.matchClock = 0
    this.timeLeft = WORLD_TIME_LIMIT
    this.events.push({ type: 'matchStart' })
  }

  private endMatch(): void {
    this.matchState = 'ended'
    this.winner =
      this.teamScores[0] > this.teamScores[1] ? 0 : this.teamScores[1] > this.teamScores[0] ? 1 : -1
    this.phase = 'over'
    this.playerAds = false
    this.firing = false
    this.events.push({ type: 'matchEnd', winner: this.winner })
  }

  toMenu(): void {
    this.phase = 'menu'
    this.matchState = 'combat'
    this.entities = [this.makeEntity(0, true, 'YOU', 0, 12.5, 12.5, 0, this.selectedSkin)]
    this.player = this.entities[0]!
    this.teamScores = [0, 0]
    this.playerAds = false
    this.firing = false
    this.events = []
  }

  pause(): void {
    if (this.phase === 'playing') this.phase = 'paused'
  }

  resume(): void {
    if (this.phase === 'paused') this.phase = 'playing'
  }

  restart(): void {
    this.beginMatch(this.selectedMap)
  }

  /* ================= 玩家输入 ================= */

  setMove(x: number, y: number): void {
    this.inputX = clamp(x, -1, 1)
    this.inputY = clamp(y, -1, 1)
  }

  setLook(angle: number, pitch: number): void {
    this.player.angle = normalizeAngle(angle)
    this.player.pitch = clamp(pitch, -0.9, 0.9)
  }

  setAds(ads: boolean): void {
    this.playerAds = ads
  }

  setTrigger(down: boolean): void {
    const wasFiring = this.firing
    this.firing = down
    const w = this.currentWeapon(this.player)
    if (down && !wasFiring && !w.auto) this.tryFire(this.player, 0)
  }

  reload(): void {
    this.startReload(this.player)
  }

  switchWeapon(slot: number): void {
    if (this.phase !== 'playing' || this.matchState !== 'combat') return
    const p = this.player
    if (slot !== 0 && slot !== 1) return
    if (p.slot === slot) return
    p.slot = slot
    p.reloading = 0
    p.fireCooldown = 0
  }

  cycleWeapon(): void {
    this.switchWeapon(this.player.slot === 0 ? 1 : 0)
  }

  /* ================= 战斗 ================= */

  private startReload(e: Entity): void {
    const w = this.currentWeapon(e)
    if (e.reloading > 0) return
    if (e.ammo[e.slot]! >= w.magSize) return
    e.reloading = w.reloadTime
  }

  private tryFire(e: Entity, extraSpread: number): void {
    if (!e.alive || e.reloading > 0 || e.fireCooldown > 0) return
    const w = this.currentWeapon(e)
    if (e.ammo[e.slot]! <= 0) {
      this.startReload(e)
      return
    }
    e.ammo[e.slot]!--
    e.fireCooldown = w.fireInterval
    this.shoot(e, w, extraSpread)
    if (e.isPlayer) this.events.push({ type: 'shot' })
  }

  private shoot(e: Entity, w: WeaponDef, extraSpread: number): void {
    const spread = (this.playerAds && e.isPlayer ? w.spreadAds : w.spreadHip) + extraSpread
    const angle = normalizeAngle(e.angle + (this.rng() * 2 - 1) * spread)
    const wall = castRay(e.x, e.y, angle, this.map.grid)

    let best: { ent: Entity; dist: number } | null = null
    for (const other of this.entities) {
      if (other.id === e.id || !other.alive || other.team === e.team) continue
      const dx = other.x - e.x
      const dy = other.y - e.y
      const dist = Math.hypot(dx, dy)
      if (dist > w.range) continue
      if (wall.hit && dist >= wall.dist) continue
      const rel = Math.abs(normalizeAngle(Math.atan2(dy, dx) - e.angle))
      const halfAng = Math.atan2(PLAYER_RADIUS + 0.16, dist) + spread
      if (rel > halfAng) continue
      if (!best || dist < best.dist) best = { ent: other, dist }
    }

    if (!best) return
    const vh = verticalHit(e.pitch, best.dist)
    if (vh === 'miss') return
    const headshot = vh === 'head'
    const amount = Math.max(1, Math.round(w.damage * (headshot ? w.headshotMult : 1)))
    this.applyDamage(best.ent, amount, e, headshot)
  }

  private applyDamage(target: Entity, amount: number, attacker: Entity, headshot: boolean): void {
    if (!target.alive) return
    target.hp -= amount
    target.damageHistory.push({ by: attacker.id, at: this.matchClock })
    if (target.damageHistory.length > 16) target.damageHistory.shift()
    this.events.push({ type: 'hit', x: target.x, y: target.y, amount, headshot, by: attacker.id })
    if (target.isPlayer) this.events.push({ type: 'damaged' })
    if (target.hp <= 0) this.kill(target, attacker, headshot)
  }

  private kill(victim: Entity, killer: Entity, headshot: boolean): void {
    victim.alive = false
    victim.hp = 0
    victim.deaths++
    victim.respawnTimer = RESPAWN_TIME
    killer.kills++
    this.teamScores[killer.team]++
    const cutoff = this.matchClock - ASSIST_WINDOW
    for (const entry of victim.damageHistory) {
      if (entry.by === killer.id) continue
      if (entry.at < cutoff) continue
      const a = this.byId(entry.by)
      if (a && a.alive) a.assists++
    }
    victim.damageHistory = []
    this.events.push({
      type: 'kill',
      killerId: killer.id,
      victimId: victim.id,
      headshot,
      weaponId: this.currentWeapon(killer).id,
    })
  }

  private respawn(e: Entity): void {
    const spawns = e.team === 0 ? this.map.teamA : this.map.teamB
    const sp = spawns[Math.floor(this.rng() * spawns.length)] ?? spawns[0]!
    e.x = sp.x
    e.y = sp.y
    e.angle = sp.angle
    e.pitch = 0
    e.hp = HP_MAX
    e.alive = true
    e.reloading = 0
    e.fireCooldown = 0
    const w0 = WEAPON_INDEX[e.weapons[0]!]
    const w1 = WEAPON_INDEX[e.weapons[1]!]
    e.ammo = [w0.magSize, w1.magSize]
    if (e.ai) {
      e.ai.state = 'idle'
      e.ai.targetId = null
      e.ai.reaction = 0
    }
  }

  /* ================= 机器人 ================= */

  private turnToward(e: Entity, desired: number, dt: number): void {
    const diff = normalizeAngle(desired - e.angle)
    const maxStep = BOT_TURN_SPEED * dt
    e.angle = normalizeAngle(e.angle + clamp(diff, -maxStep, maxStep))
  }

  private botVisibleTarget(bot: Entity): Entity | null {
    let best: Entity | null = null
    let bestDist = Infinity
    for (const other of this.entities) {
      if (other.id === bot.id || !other.alive || other.team === bot.team) continue
      const d = Math.hypot(other.x - bot.x, other.y - bot.y)
      if (d > BOT_AWARENESS) continue
      const ang = Math.atan2(other.y - bot.y, other.x - bot.x)
      const wall = castRay(bot.x, bot.y, ang, this.map.grid)
      if (wall.hit && wall.dist < d - 0.4) continue
      if (d < bestDist) {
        bestDist = d
        best = other
      }
    }
    return best
  }

  private updateBot(bot: Entity, dt: number): void {
    const ai = bot.ai!
    const w = this.currentWeapon(bot)

    if (ai.reaction > 0) ai.reaction -= dt
    ai.nextDecision -= dt

    const visible = this.botVisibleTarget(bot)
    if (visible) {
      if (ai.targetId !== visible.id) ai.reaction = 0.15 + this.rng() * 0.25
      ai.targetId = visible.id
      ai.lastKnownX = visible.x
      ai.lastKnownY = visible.y
      ai.state = 'attack'
    } else if (ai.targetId != null) {
      const t = this.byId(ai.targetId)
      if (!t || !t.alive) {
        ai.targetId = null
        ai.state = 'idle'
      } else {
        const d = Math.hypot(ai.lastKnownX - bot.x, ai.lastKnownY - bot.y)
        if (d < 0.8) {
          ai.targetId = null
          ai.state = 'idle'
        } else {
          ai.state = 'chase'
        }
      }
    } else {
      ai.state = 'idle'
    }

    if (bot.reloading > 0) return

    if (ai.state === 'attack') {
      const t = this.byId(ai.targetId ?? -1)
      if (!t) return
      const desired = Math.atan2(t.y - bot.y, t.x - bot.x)
      this.turnToward(bot, desired, dt)
      const dist = Math.hypot(t.x - bot.x, t.y - bot.y)
      // 俯仰对准躯干（带轻微误差，命中判定会给出爆头/落空）
      bot.pitch = (this.rng() - 0.5) * 0.08
      // 小幅度横移，避免站桩
      if (ai.nextDecision <= 0) {
        ai.strafeDir = this.rng() < 0.5 ? -1 : 1
        ai.nextDecision = 0.6 + this.rng() * 1.0
      }
      const strafeX = Math.cos(bot.angle + Math.PI / 2) * ai.strafeDir
      const strafeY = Math.sin(bot.angle + Math.PI / 2) * ai.strafeDir
      moveEntity(
        bot,
        strafeX * w.moveSpeedMult * MOVE_SPEED * 0.5 * dt,
        strafeY * w.moveSpeedMult * MOVE_SPEED * 0.5 * dt,
        this.map.grid,
      )
      if (dist < w.range && ai.reaction <= 0 && bot.fireCooldown <= 0) {
        const extra = clamp(0.03 + dist * 0.004, 0.03, 0.16)
        this.tryFire(bot, extra)
      }
      return
    }

    if (ai.state === 'chase') {
      const desired = Math.atan2(ai.lastKnownY - bot.y, ai.lastKnownX - bot.x)
      this.turnToward(bot, desired, dt)
      moveEntity(
        bot,
        Math.cos(bot.angle) * MOVE_SPEED * w.moveSpeedMult * dt,
        Math.sin(bot.angle) * MOVE_SPEED * w.moveSpeedMult * dt,
        this.map.grid,
      )
      return
    }

    // idle：巡逻
    const dPatrol = Math.hypot(ai.patrolX - bot.x, ai.patrolY - bot.y)
    if (dPatrol < 0.6 || ai.nextDecision <= 0) {
      this.pickPatrol(bot, ai)
      ai.nextDecision = 2 + this.rng() * 4
    }
    const desired = Math.atan2(ai.patrolY - bot.y, ai.patrolX - bot.x)
    this.turnToward(bot, desired, dt)
    moveEntity(
      bot,
      Math.cos(bot.angle) * MOVE_SPEED * w.moveSpeedMult * 0.6 * dt,
      Math.sin(bot.angle) * MOVE_SPEED * w.moveSpeedMult * 0.6 * dt,
      this.map.grid,
    )
  }

  private pickPatrol(bot: Entity, ai: BotAI): void {
    // 随机选取一个空地块中心作为巡逻点
    for (let i = 0; i < 20; i++) {
      const cx = 1 + Math.floor(this.rng() * (this.map.width - 2))
      const cy = 1 + Math.floor(this.rng() * (this.map.height - 2))
      if (this.map.grid[cy]![cx] === 0) {
        ai.patrolX = cx + 0.5
        ai.patrolY = cy + 0.5
        return
      }
    }
    ai.patrolX = bot.x
    ai.patrolY = bot.y
  }

  /* ================= 主更新 ================= */

  tick(dt: number): void {
    if (this.phase !== 'playing') return

    if (this.matchState === 'loadout') {
      this.timeLeft -= dt
      if (this.timeLeft <= 0) this.confirmLoadout()
      return
    }
    if (this.matchState !== 'combat') return

    this.matchClock += dt
    this.timeLeft = Math.max(0, WORLD_TIME_LIMIT - this.matchClock)

    // 复活
    for (const e of this.entities) {
      if (!e.alive) {
        e.respawnTimer -= dt
        if (e.respawnTimer <= 0) this.respawn(e)
      }
    }

    // 换弹 / 冷却计时
    for (const e of this.entities) {
      if (e.fireCooldown > 0) e.fireCooldown -= dt
      if (e.reloading > 0) {
        e.reloading -= dt
        if (e.reloading <= 0) {
          e.reloading = 0
          e.ammo[e.slot] = this.currentWeapon(e).magSize
        }
      }
    }

    // 玩家移动 + 全自动开火
    const p = this.player
    if (p.alive) {
      const w = this.currentWeapon(p)
      let mx = this.inputX
      let my = this.inputY
      const len = Math.hypot(mx, my)
      if (len > 1) {
        mx /= len
        my /= len
      }
      const speed = MOVE_SPEED * w.moveSpeedMult
      const forward = (mx * Math.cos(p.angle) + my * Math.sin(p.angle)) * speed * dt
      const strafe = (-mx * Math.sin(p.angle) + my * Math.cos(p.angle)) * speed * dt
      moveEntity(p, forward, strafe, this.map.grid)
      if (this.firing && w.auto) this.tryFire(p, 0)
    }

    // 机器人
    for (const e of this.entities) {
      if (e.isPlayer || !e.alive) continue
      this.updateBot(e, dt)
    }

    if (this.matchClock >= WORLD_TIME_LIMIT) this.endMatch()
  }

  drainEvents(): EngineEvent[] {
    const out = this.events
    this.events = []
    return out
  }

  /** 结算排名：按击杀 → 助攻 → 死亡少 排序，返回实体数组 */
  ranking(): Entity[] {
    return [...this.entities].sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills
      if (b.assists !== a.assists) return b.assists - a.assists
      return a.deaths - b.deaths
    })
  }
}
