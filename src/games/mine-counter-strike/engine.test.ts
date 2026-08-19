// ============================================================
// MineCounter-Strike 引擎冒烟测试（决策 #25）
// 运行方式：node src/games/mine-counter-strike/engine.test.ts（手动触发，非 CI）
// 覆盖：地图解析、角色初始化（1 真人 9 bot 5V5）、枪械/皮肤完整、
//       DDA 射线遮挡、载入选枪、命中/击杀/助攻/死亡链路、换弹/切枪、
//       计时胜负、排名、确定性随机源
// ============================================================
import { McsEngine, castRay } from './engine.ts'
import { MAPS, mapIssues } from './maps.ts'
import { WEAPONS, SKINS } from './weapons.ts'

let passed = 0
let failed = 0

function assert(cond: boolean, name: string): void {
  if (cond) {
    passed++
  } else {
    failed++
    console.error('  ✗ FAIL: ' + name)
  }
}

function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const DT = 1 / 60

/** 让除 keep 之外的角色退场（避免 5V5 混战干扰单点断言） */
function neutralize(e: McsEngine, keep: number[]): void {
  for (const ent of e.entities) {
    if (!keep.includes(ent.id)) {
      ent.alive = false
      ent.respawnTimer = 9999
    }
  }
}

console.log('--- 地图解析 ---')
{
  assert(MAPS.length === 4, '共 4 张地图')
  for (const m of MAPS) {
    const issues = mapIssues(m)
    assert(
      issues.length === 0,
      `${m.id} 无结构问题` + (issues.length ? '：' + issues.join(';') : ''),
    )
    assert(m.teamA.length === 5 && m.teamB.length === 5, `${m.id} 出生点 5+5`)
    assert(m.grid.length === m.height && m.grid[0]!.length === m.width, `${m.id} 尺寸正确`)
  }
}

console.log('--- 枪械与皮肤 ---')
{
  assert(WEAPONS.length === 5, '5 类枪械')
  for (const w of WEAPONS) {
    assert(w.damage > 0 && w.magSize > 0 && w.fireInterval > 0, `${w.id} 数值完整`)
  }
  assert(SKINS.length >= 5, '皮肤至少 5 组（实际 ' + SKINS.length + '）')
}

console.log('--- 初始状态与开局 ---')
{
  const e = new McsEngine({ random: lcg(1) })
  assert(e.phase === 'menu', '初始阶段为 menu')
  e.beginMatch('shipment')
  assert(e.phase === 'playing' && e.matchState === 'loadout', '开局进入 loadout')
  assert(e.entities.length === 10, '共 10 名玩家')
  assert(e.player.isPlayer && e.player.team === 0, '真人位于 A 队')
  const team0 = e.entities.filter((x) => x.team === 0).length
  const team1 = e.entities.filter((x) => x.team === 1).length
  assert(team0 === 5 && team1 === 5, '5V5 分队')
}

console.log('--- DDA 射线 ---')
{
  const grid = MAPS[0]!.grid
  const hit = castRay(1.5, 1.5, 0, grid)
  assert(hit.hit && hit.dist > 0 && hit.dist < 40, '射线命中边界墙')
  assert(hit.wallX >= 0 && hit.wallX <= 1, 'wallX 在 [0,1]')
  const hit2 = castRay(12.5, 12.5, Math.PI / 4, grid)
  assert(hit2.hit, '对角射线命中')
}

console.log('--- 载入选枪与开战 ---')
{
  const e = new McsEngine({ random: lcg(2) })
  e.beginMatch('dust')
  e.pickWeapon(0, 'sniper')
  e.pickWeapon(1, 'smg')
  assert(e.player.weapons[0] === 'sniper' && e.player.weapons[1] === 'smg', '选满两把枪')
  assert(e.timeLeft <= 30 && e.timeLeft > 0, '载入倒计时开始')
  e.confirmLoadout()
  assert(e.matchState === 'combat', '确认后进入战斗')
  assert(e.timeLeft === 300, '战斗计时 5 分钟')
  // 切换武器
  e.switchWeapon(1)
  assert(e.player.slot === 1, '切到副武器')
  // 换弹（smg 1.6s）
  e.player.ammo[1] = 0
  e.reload()
  assert(e.player.reloading > 0, '开始换弹')
  neutralize(e, [0])
  for (let i = 0; i < 130; i++) e.tick(DT)
  assert(e.player.reloading === 0 && e.player.ammo[1]! === 30, '换弹完成回满弹匣')
}

console.log('--- 单发命中伤害 ---')
{
  const e = new McsEngine({ random: lcg(3) })
  e.beginMatch('shipment')
  e.confirmLoadout()
  neutralize(e, [0, 5])
  const player = e.entities[0]!
  const victim = e.entities[5]!
  player.x = 4.5
  player.y = 2.5
  player.angle = 0
  player.pitch = 0
  player.weapons = ['pistol', 'pistol']
  player.ammo = [12, 12]
  victim.x = 8.0
  victim.y = 2.5
  victim.hp = 100
  e.setTrigger(true)
  e.setTrigger(false)
  assert(victim.hp === 75, '手枪命中扣 25')
}

console.log('--- 击杀/死亡/得分链路 ---')
{
  const e = new McsEngine({ random: lcg(3) })
  e.beginMatch('shipment')
  e.confirmLoadout()
  neutralize(e, [0, 5])
  const player = e.entities[0]!
  const victim = e.entities[5]!
  player.x = 4.5
  player.y = 2.5
  player.angle = 0
  player.pitch = 0
  player.weapons = ['sniper', 'pistol']
  player.ammo = [5, 12]
  victim.x = 8.0
  victim.y = 2.5
  victim.hp = 90 // 预受伤，狙击一枪致命
  e.setTrigger(true)
  e.setTrigger(false)
  assert(victim.alive === false && victim.deaths === 1, '受害者死亡计数')
  assert(player.kills === 1, '玩家击杀计数')
  assert(e.teamScores[0] === 1, 'A 队得分 +1')
  // 复活
  victim.respawnTimer = 0
  e.tick(DT)
  assert(victim.alive && victim.hp === 100, '复活回满')
}

console.log('--- 助攻链路（队友补刀） ---')
{
  const e = new McsEngine({ random: lcg(4) })
  e.beginMatch('shipment')
  e.confirmLoadout()
  neutralize(e, [0, 1, 5])
  const player = e.entities[0]!
  const mate = e.entities[1]!
  const victim = e.entities[5]!
  player.x = 4.5
  player.y = 2.5
  player.angle = 0
  player.pitch = 0
  player.weapons = ['pistol', 'pistol']
  player.ammo = [12, 12]
  victim.x = 8.0
  victim.y = 2.5
  victim.weapons = ['pistol', 'pistol']
  victim.ammo = [12, 12]
  victim.hp = 100
  mate.x = 8.0
  mate.y = 3.5
  mate.angle = -Math.PI / 2
  mate.weapons = ['sniper', 'pistol']
  mate.ammo = [5, 12]
  mate.slot = 0
  // 玩家先造成 25 伤害
  e.setTrigger(true)
  e.setTrigger(false)
  assert(victim.hp === 75, '玩家先手命中')
  // 队友 AI 在数秒内补刀
  for (let i = 0; i < 120; i++) e.tick(DT)
  assert(victim.alive === false, '队友完成击杀')
  assert(mate.kills >= 1, '队友击杀计数')
  assert(player.assists >= 1, '玩家获得助攻')
}

console.log('--- 计时胜负与排名 ---')
{
  const e = new McsEngine({ random: lcg(5) })
  e.beginMatch('court')
  e.confirmLoadout()
  e.tick(301)
  assert(e.phase === 'over' && e.matchState === 'ended', '5 分钟后结算')
  assert(e.winner === -1 || e.winner === 0 || e.winner === 1, '胜负结果合法')
  const rank = e.ranking()
  assert(rank.length === 10, '排名含 10 名玩家')
  const sorted = rank.every((a, i) => i === 0 || a.kills <= rank[i - 1]!.kills)
  assert(sorted, '按击杀降序')
}

console.log('--- 确定性随机源 ---')
{
  const a = new McsEngine({ random: lcg(9) })
  const b = new McsEngine({ random: lcg(9) })
  a.beginMatch('snow')
  b.beginMatch('snow')
  const skinsA = a.entities.map((x) => x.skin).join(',')
  const skinsB = b.entities.map((x) => x.skin).join(',')
  assert(skinsA === skinsB, '同种子皮肤分配一致')
}

console.log(`\n结果：${passed} 通过 / ${failed} 失败`)
if (failed > 0) throw new Error('冒烟测试未全部通过')
