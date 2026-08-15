// ============================================================
// 连连看引擎冒烟测试（决策 #25）
// 运行方式：node src/games/lianliankan/engine.test.ts（手动触发，非 CI）
// 覆盖：生成偶数性、寻路（直线/一拐/二拐/阻断）、消除计分连击、提示、通关、超时
// ============================================================
import { LianliankanEngine, TOTAL_LEVELS } from './engine.ts'
import { findPath } from './engine.ts'

let passed = 0
let failed = 0

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
  } else {
    failed++
    console.error(`  ✗ FAIL: ${name}`)
  }
}

function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/** 空棋盘 + 两个相同图形的测试网格 */
function pairGrid(
  cols: number,
  rows: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const grid: (number | null)[][] = Array.from({ length: rows }, () =>
    Array<number | null>(cols).fill(null),
  )
  grid[a.y][a.x] = 5
  grid[b.y][b.x] = 5
  return grid
}

console.log('--- 棋盘生成偶数性 ---')
{
  const e = new LianliankanEngine({ random: lcg(1) })
  e.startRun()
  const counts = new Map<number, number>()
  e.grid.forEach((row) => row.forEach((v) => v !== null && counts.set(v, (counts.get(v) ?? 0) + 1)))
  let allEven = true
  counts.forEach((n) => {
    if (n % 2 !== 0) allEven = false
  })
  assert(allEven, '每种图形数量为偶数')
  let total = 0
  e.grid.forEach((row) => (total += row.length))
  assert(total === e.cols * e.rows, '棋盘铺满')
}

console.log('--- 寻路：直线/一拐/二拐/阻断 ---')
{
  const g1 = pairGrid(8, 6, { x: 0, y: 0 }, { x: 3, y: 0 })
  assert(findPath(g1, { x: 0, y: 0 }, { x: 3, y: 0 }, 8, 6) !== null, '直线可达')

  const g2 = pairGrid(8, 6, { x: 0, y: 0 }, { x: 1, y: 1 })
  assert(findPath(g2, { x: 0, y: 0 }, { x: 1, y: 1 }, 8, 6) !== null, '一拐可达')

  const g3 = pairGrid(8, 6, { x: 0, y: 0 }, { x: 2, y: 2 })
  g3[0][1] = 9 // (1,0) 封右行
  g3[0][2] = 9 // (2,0) 封 1 拐右-下
  g3[2][0] = 9 // (0,2) 封 1 拐下-右
  g3[1][2] = 9 // (2,1) 封 2 拐下-右-下
  // 仅剩 down-right-down-right（3 拐）→ 应判不可达
  assert(findPath(g3, { x: 0, y: 0 }, { x: 2, y: 2 }, 8, 6) === null, '需 3 拐 → 不可达')

  const g5 = pairGrid(8, 6, { x: 0, y: 0 }, { x: 0, y: 3 })
  g5[1][0] = 9 // 仅一处阻断：可 2 拐绕行
  assert(findPath(g5, { x: 0, y: 0 }, { x: 0, y: 3 }, 8, 6) !== null, '2 拐绕行可达')

  const g4 = pairGrid(8, 6, { x: 0, y: 0 }, { x: 2, y: 2 })
  g4[0][0] = 1
  g4[2][2] = 2
  assert(findPath(g4, { x: 0, y: 0 }, { x: 2, y: 2 }, 8, 6) === null, '不同图形不可连')
}

console.log('--- 消除/计分/连击 ---')
{
  const e = new LianliankanEngine({ random: lcg(2), cols: 4, rows: 2 })
  e.startRun()
  const first = e.findHint()
  assert(first !== null, '开局存在可消除对')
  if (first) {
    e.tap(first[0].x, first[0].y)
    const r = e.tap(first[1].x, first[1].y)
    assert(r?.kind === 'matched', '消除成功')
    assert(e.score === 100, `基础分 100（实际 ${e.score}）`)
    const second = e.findHint()
    if (second) {
      e.tap(second[0].x, second[0].y)
      e.tap(second[1].x, second[1].y)
      assert(e.score === 220, `连击加分 100+120（实际 ${e.score}）`)
    }
  }
  const hintBefore = e.hintsLeft
  e.useHint()
  assert(e.hintsLeft === hintBefore - 1, '提示次数递减')
}

console.log('--- 通关（2×2 连过 5 关）---')
{
  const e = new LianliankanEngine({ random: lcg(9), cols: 2, rows: 2 })
  e.startRun()
  for (let lv = 0; lv < TOTAL_LEVELS; lv++) {
    let guard = 0
    while (!e.isCleared() && guard < 20) {
      const hint = e.findHint()
      if (!hint) break
      e.tap(hint[0].x, hint[0].y)
      e.tap(hint[1].x, hint[1].y)
      guard++
    }
    if (lv < TOTAL_LEVELS - 1) {
      assert(e.frozen, `第 ${lv + 1} 关完成并冻结结算`)
      e.nextLevel()
    }
  }
  assert(e.victory, '5 关全清 → victory')
  assert(e.phase === 'over', '通关后进入 over 阶段')
  assert(e.score > 0, '总分大于 0')
}

console.log('--- 超时判负 ---')
{
  const e = new LianliankanEngine({ random: lcg(3) })
  e.startRun()
  e.tick(999)
  assert(e.phase === 'over', '时间耗尽 → over')
}

console.log(`\n结果：${passed} 通过，${failed} 失败`)
if (failed > 0) throw new Error(`${failed} 项冒烟测试失败`)
