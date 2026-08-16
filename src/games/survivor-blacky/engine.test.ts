// ============================================================
// 幸存者小黑引擎冒烟测试（决策 #25）
// 运行方式：node src/games/survivor-blacky/engine.test.ts（手动触发，非 CI）
// 覆盖：初始状态、开波刷怪、伤害击杀计分、经验升级三选一、被动叠加、
//       受伤无敌帧、失败路径、波次推进、第 10 波 BOSS 与胜利路径、
//       暂停/恢复、升级冻结、长时模拟无 NaN、随机源确定性
// 附：自动风筝平衡模拟（信息性输出，不做硬断言）
// ============================================================
import { SurvivorEngine } from './engine.ts'
import { WAVE_COUNT, WAVE_DURATION, WORLD_W, WORLD_H } from './engine.ts'

let passed = 0
let failed = 0

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
  } else {
    failed++
    console.error('  ✗ FAIL: ' + name)
  }
}

/** 可复现随机源（LCG） */
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const DT = 1 / 60

console.log('--- 初始状态与开局 ---')
{
  const e = new SurvivorEngine({ random: lcg(1) })
  assert(e.phase === 'menu', '初始阶段为 menu')
  assert(e.player.hp === 100 && e.player.maxHp === 100, '初始 HP 100/100')
  assert(e.weapons.length === 0, 'menu 阶段无武器')
  e.startRun()
  assert(e.phase === 'playing', 'startRun 后为 playing')
  assert(
    e.weapons.length === 1 && e.weapons[0]!.id === 'hairball',
    '开局持有猫毛飞弹（曾漏初始武器的教训）',
  )
  assert(e.kills === 0 && e.survived === 0 && e.score === 0, '开局分数/时间/击杀归零')
  const evts = e.drainEvents()
  assert(
    evts.some((x) => x.type === 'wave' && x.wave === 1),
    '开局发出第 1 波事件',
  )
  assert(
    evts.some((x) => x.type === 'quote' && x.key === 'start'),
    '开局台词事件',
  )
  // 事件流消费后清空
  assert(e.drainEvents().length === 0, 'drainEvents 消费后清空')
}

console.log('--- 开波刷怪 ---')
{
  const e = new SurvivorEngine({ random: lcg(2) })
  e.startRun()
  for (let i = 0; i < 60 * 2; i++) e.tick(DT)
  assert(e.enemies.length > 0, '2 秒内第 1 波已刷怪（曾漏 spawn 的教训）')
  assert(
    e.enemies.every((x) => x.kind === 'pig'),
    '第 1 波只出猪猪',
  )
  assert(
    e.enemies.every((x) => x.tier === 'normal'),
    '前 3 波无精英',
  )
}

console.log('--- 伤害/击杀/计分/掉小鱼干 ---')
{
  const e = new SurvivorEngine({ random: lcg(3) })
  e.startRun()
  // 快进到有怪，把怪血打到 1，等猫毛飞弹收割
  for (let i = 0; i < 60 * 3; i++) e.tick(DT)
  const pig = e.enemies[0]
  assert(pig !== undefined, '场上有猪猪可打')
  pig!.hp = 1
  let guard = 0
  while (e.kills === 0 && guard < 60 * 12) {
    e.tick(DT)
    guard++
  }
  assert(e.kills > 0, '猫毛飞弹能击杀敌人')
  assert(e.score >= 10, '击杀计入得分（10 分/只）')
  assert(e.gems.length > 0, '击杀掉落经验小鱼干')
  assert(
    e.drainEvents().some((x) => x.type === 'kill'),
    '击杀事件已发出',
  )
}

console.log('--- 经验/升级三选一 ---')
{
  const e = new SurvivorEngine({ random: lcg(4) })
  e.startRun()
  // 直接投喂小鱼干（30 经验 = 连升 3 级：6/10/14）
  const beforeLevel = e.currentLevel
  for (let i = 0; i < 30; i++) {
    e.gems.push({
      x: e.player.x + 5,
      y: e.player.y + 5,
      value: 1,
      vx: 0,
      vy: 0,
      magnet: true,
      t: 0,
    })
  }
  for (let i = 0; i < 60 * 2; i++) e.tick(DT)
  assert(e.pendingLevelUps > 0, '经验足够时触发升级')
  assert(e.pendingChoices.length >= 1, '升级生成待选三选一')
  const choices = e.pendingChoices[0]!
  assert(choices.length === 3, '三选一恰好 3 项')
  const keys = choices.map((c) => c.kind + ':' + ('id' in c ? c.id : 'heal'))
  assert(new Set(keys).size === 3, '三个选项互不重复')
  const survivedBefore = e.survived
  e.tick(DT)
  assert(e.survived === survivedBefore, '升级浮层打开时战场冻结')
  // 逐一选择完所有待选项
  const beforeWeaponCount = e.weapons.length
  while (e.pendingLevelUps > 0) e.chooseUpgrade(0)
  assert(e.pendingLevelUps === 0, '全部选择后升级处理完毕')
  assert(e.currentLevel > beforeLevel, '等级已提升')
  assert(
    e.weapons.length >= beforeWeaponCount && e.weapons.every((w) => w.level >= 1),
    '武器选项生效（新武器或升级）',
  )
}

console.log('--- 被动叠加与属性计算 ---')
{
  const e = new SurvivorEngine({ random: lcg(5) })
  e.startRun()
  e.passiveLevels.claws = 2
  e.passiveLevels.coffee = 1
  e.passiveLevels.milk = 3
  e.computeStats()
  assert(Math.abs(e.damageMult - 1.16) < 1e-9, '爪磨器 2 级 → 伤害 116%')
  assert(Math.abs(e.attackSpeedMult - 1.08) < 1e-9, '咖啡 1 级 → 攻速 108%')
  assert(Math.abs(e.pickupRadius - 90 * 1.66) < 1e-9, '牛奶 3 级 → 拾取半径 166%')
  e.passiveLevels.canned = 2
  e.computeStats()
  assert(e.player.maxHp === 130, '猫罐头 2 级 → 生命上限 130')
}

console.log('--- 受伤无敌帧 ---')
{
  const e = new SurvivorEngine({ random: lcg(6) })
  e.startRun()
  const pig =
    e.enemies[0] ??
    (() => {
      // 若未刷怪先快进
      for (let i = 0; i < 60 * 2; i++) e.tick(DT)
      return e.enemies[0]!
    })()
  pig.x = e.player.x + 5
  pig.y = e.player.y
  pig.speed = 0
  e.tick(DT)
  const afterFirst = e.player.hp
  assert(afterFirst < 100, '接触伤害生效')
  pig.x = e.player.x + 5
  pig.y = e.player.y
  for (let i = 0; i < 20; i++) e.tick(DT)
  assert(e.player.hp === afterFirst, '无敌帧 0.6s 内不再受伤')
  assert(
    e.drainEvents().some((x) => x.type === 'hurt'),
    '受伤事件已发出',
  )
}

console.log('--- 失败路径 ---')
{
  const e = new SurvivorEngine({ random: lcg(7) })
  e.startRun()
  e.player.hp = 1
  for (let i = 0; i < 60 * 2; i++) e.tick(DT)
  const pig = e.enemies[0]!
  pig.x = e.player.x + 5
  pig.y = e.player.y
  pig.speed = 0
  let guard = 0
  while (e.phase === 'playing' && guard < 60) {
    pig.x = e.player.x + 5
    pig.y = e.player.y
    e.tick(DT)
    guard++
  }
  assert(e.phase === 'over', 'HP 归零 → 结束')
  assert(e.outcome === 'lose', '失败结算')
  assert(e.deathCause === 'pig', '死因记录为猪猪')
  assert(
    e.drainEvents().some((x) => x.type === 'over' && x.outcome === 'lose'),
    '失败事件已发出',
  )
}

console.log('--- 波次推进 ---')
{
  const e = new SurvivorEngine({ random: lcg(8) })
  e.startRun()
  for (let i = 0; i < 60 * (WAVE_DURATION + 1); i++) e.tick(DT)
  assert(e.wave === 2, '25 秒后进入第 2 波')
  assert(e.waveCompleted === 1, '已完成波次计数 1')
  assert(e.score >= 50, '完成波次得分 50')
  assert(
    e.drainEvents().some((x) => x.type === 'wave' && x.wave === 2),
    '波次事件已发出',
  )
  assert(
    e.enemies.some((x) => x.kind === 'chicken' || x.kind === 'dog'),
    '第 2 波出现鸡/狗',
  )
}

console.log('--- 第 10 波 BOSS 与胜利路径 ---')
{
  const e = new SurvivorEngine({ random: lcg(9) })
  e.startRun()
  // 直接跳到第 9 波末尾
  e.wave = WAVE_COUNT - 1
  e.waveTime = WAVE_DURATION - 0.2
  e.spawnBudget = 0
  e.enemies = []
  for (let i = 0; i < 30; i++) e.tick(DT)
  assert(e.wave === WAVE_COUNT, '进入第 10 波')
  const boss = e.boss
  assert(boss !== null, '第 10 波 BOSS 鸽子王入场')
  assert(
    e.drainEvents().some((x) => x.type === 'boss'),
    'BOSS 事件已发出',
  )
  assert(boss!.hp === 2800 && boss!.maxHp === 2800, 'BOSS 基础 HP 2800（不参与波次缩放）')
  // 拉开距离，把 BOSS 打到 1 血，让武器收割
  e.player.x = WORLD_W / 2
  e.player.y = 60
  boss!.x = WORLD_W / 2 + 500
  boss!.y = 500
  boss!.hp = 1
  boss!.speed = 0
  let guard = 0
  while (e.phase === 'playing' && guard < 60 * 20) {
    boss!.hp = Math.min(boss!.hp, 1)
    boss!.x = WORLD_W / 2 + 400
    boss!.y = 400
    e.tick(DT)
    guard++
  }
  assert(e.phase === 'over', 'BOSS 死亡 → 结束')
  assert(e.outcome === 'win', '胜利结算')
  assert(e.bossKilled === 1, 'BOSS 击杀计数')
  assert(e.score >= 500, 'BOSS 击杀得分 500')
}

console.log('--- 暂停/恢复与升级冻结 ---')
{
  const e = new SurvivorEngine({ random: lcg(10) })
  e.startRun()
  e.pause()
  assert(e.phase === 'paused', '暂停生效')
  const s1 = e.survived
  for (let i = 0; i < 30; i++) e.tick(DT)
  assert(e.survived === s1, '暂停时时间冻结')
  e.resume()
  assert(e.phase === 'playing', '恢复生效')
  e.tick(DT)
  assert(e.survived > s1, '恢复后时间推进')
}

console.log('--- 确定性（同种子同世界） ---')
{
  const a = new SurvivorEngine({ random: lcg(42) })
  const b = new SurvivorEngine({ random: lcg(42) })
  a.startRun()
  b.startRun()
  for (let i = 0; i < 60 * 5; i++) {
    a.tick(DT)
    b.tick(DT)
  }
  assert(a.enemies.length === b.enemies.length, '同种子刷怪数量一致')
  assert(
    a.enemies[0] &&
      b.enemies[0] &&
      a.enemies[0]!.x === b.enemies[0]!.x &&
      a.enemies[0]!.y === b.enemies[0]!.y,
    '同种子首个敌人位置一致',
  )
}

// 拾取优先的简单走位：附近有鱼干 → 吃；否则远离最近敌人（靠边时折回场地中心）
function autopilotMove(e: SurvivorEngine): void {
  let gx = 0
  let gy = 0
  let gemCount = 0
  for (const g of e.gems) {
    const d = Math.hypot(g.x - e.player.x, g.y - e.player.y)
    if (d < 170) {
      gx += g.x
      gy += g.y
      gemCount++
    }
  }
  if (gemCount > 0) {
    const dx = gx / gemCount - e.player.x
    const dy = gy / gemCount - e.player.y
    const len = Math.hypot(dx, dy) || 1
    e.setMove(dx / len, dy / len)
    return
  }
  let nx = 0
  let ny = 0
  let nd = Infinity
  for (const em of e.enemies) {
    const d = Math.hypot(em.x - e.player.x, em.y - e.player.y)
    if (d < nd) {
      nd = d
      nx = em.x
      ny = em.y
    }
  }
  let dx = 0
  let dy = 0
  if (nd < Infinity) {
    dx = e.player.x - nx
    dy = e.player.y - ny
  }
  const edge = 170
  if (e.player.x < edge) dx += (WORLD_W / 2 - e.player.x) / 600
  if (e.player.x > WORLD_W - edge) dx += (WORLD_W / 2 - e.player.x) / 600
  if (e.player.y < edge) dy += (WORLD_H / 2 - e.player.y) / 600
  if (e.player.y > WORLD_H - edge) dy += (WORLD_H / 2 - e.player.y) / 600
  const len = Math.hypot(dx, dy)
  if (len > 0.01) {
    e.setMove(dx / len, dy / len)
  } else {
    e.setMove(0, 0)
  }
}

console.log('--- 长时模拟无 NaN（自动选升级 + 拾取走位） ---')
{
  const e = new SurvivorEngine({ random: lcg(11) })
  e.startRun()
  // 本组验证时间轴与数值稳定，主角设为不可死（免走位干扰）
  e.player.hp = 99999
  e.player.maxHp = 99999
  e.armor = 9999
  const simSeconds = 120
  for (let i = 0; i < 60 * simSeconds; i++) {
    while (e.pendingLevelUps > 0) e.chooseUpgrade(0)
    autopilotMove(e)
    e.tick(DT)
  }
  const nums: number[] = [e.player.x, e.player.y, e.player.hp, e.survived, e.score]
  for (const em of e.enemies.slice(0, 50)) nums.push(em.x, em.y, em.hp)
  assert(
    nums.every((n) => Number.isFinite(n)),
    '120 秒模拟全部数值有限（无 NaN/Infinity）',
  )
  assert(e.survived > simSeconds - 1 && e.survived < simSeconds + 1, '时间轴精确推进')
  assert(e.currentLevel > 1, '长时模拟中多次升级')
}

// ============================================================
// 平衡模拟（信息性）：自动风筝策略，5 个种子
// 策略：远离敌人质心；HP < 50% 时优先选治疗
// ============================================================
console.log('--- 平衡模拟（自动风筝 × 5 种子，信息性） ---')
{
  let wins = 0
  for (let seed = 1; seed <= 5; seed++) {
    const e = new SurvivorEngine({ random: lcg(seed * 997 + 13) })
    e.startRun()
    let guard = 0
    while (e.phase === 'playing' && guard < 60 * (WAVE_COUNT * WAVE_DURATION + 60)) {
      // 升级决策（"合理玩家"基准）：低血量治疗 > 新武器 > 武器升级 > 其他
      while (e.pendingLevelUps > 0) {
        const choices = e.pendingChoices[0]!
        let pick = 0
        if (e.player.hp < 0.5 * e.player.maxHp) {
          const healIdx = choices.findIndex((c) => c.kind === 'heal')
          if (healIdx >= 0) pick = healIdx
        } else {
          const newIdx = choices.findIndex((c) => c.kind === 'weapon' && c.nextLevel === 1)
          const upIdx = choices.findIndex((c) => c.kind === 'weapon')
          if (newIdx >= 0) pick = newIdx
          else if (upIdx >= 0) pick = upIdx
        }
        e.chooseUpgrade(pick)
      }
      autopilotMove(e)
      e.tick(DT)
      guard++
    }
    if (e.outcome === 'win') wins++
    console.log(
      '  种子 ' +
        seed +
        ': ' +
        (e.outcome === 'win' ? '胜利' : '失败') +
        ' · 波次 ' +
        e.wave +
        '/' +
        WAVE_COUNT +
        ' · 存活 ' +
        Math.floor(e.survived) +
        's' +
        ' · 击杀 ' +
        e.kills +
        ' · 等级 ' +
        e.currentLevel +
        ' · 得分 ' +
        e.score +
        ' · 武器 ' +
        e.weapons.map((w) => w.id + 'L' + w.level).join('+'),
    )
  }
  console.log('  自动风筝胜率: ' + wins + '/5（无人工操作基准，仅供参考，非断言）')
}

console.log('')
console.log('结果: ' + passed + ' 通过, ' + failed + ' 失败')
if (failed > 0) throw new Error('冒烟测试未全部通过')
