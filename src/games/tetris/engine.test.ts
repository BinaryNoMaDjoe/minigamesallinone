// ============================================================
// 俄罗斯方块引擎冒烟测试（决策 #25）
// 运行方式：node src/games/tetris/engine.test.ts（手动触发，非 CI）
// 覆盖：首块生成、移动/旋转边界、硬降锁定、消行计分、顶出判负、7-bag、状态机
// ============================================================
import { TetrisEngine } from './engine.ts'
import { COLS, ROWS } from './engine.ts'
import type { PieceType } from './pieces.ts'

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

/** 可复现随机源（LCG） */
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

console.log('--- 首块生成与状态机 ---')
{
  const e = new TetrisEngine({ random: lcg(1) })
  assert(e.phase === 'menu', '初始阶段为 menu')
  e.startRun()
  assert(e.phase === 'playing', 'startRun 后为 playing')
  assert(e.current !== null, '启动后首块已生成（曾漏 spawn 的教训）')
  assert(e.score === 0 && e.lines === 0 && e.level === 1, '开局分数/行数/等级归零')
  assert(
    e.current!.x >= 0 && e.current!.x + e.current!.matrix[0].length <= COLS,
    '首块在棋盘宽度内',
  )
}

console.log('--- 移动与旋转边界 ---')
{
  const e = new TetrisEngine({ random: lcg(2) })
  e.startRun()
  for (let i = 0; i < COLS; i++) e.move(-1)
  assert(e.current!.x >= 0, '左移被边界挡住')
  e.rotate()
  assert(e.current !== null, '旋转不抛异常')
}

console.log('--- 硬降锁定与消行计分 ---')
{
  const e = new TetrisEngine({ random: lcg(3) })
  e.startRun()
  // 底部 9 行已满、上方 11 行留空：方块落在空区锁定后，应消除底部全部 9 行
  const rows: (PieceType | null)[][] = []
  for (let r = 0; r < 11; r++) rows.push(Array<PieceType | null>(COLS).fill(null))
  for (let r = 11; r < ROWS; r++) rows.push(Array<PieceType | null>(COLS).fill(1))
  e.loadBoard(rows)
  const before = e.score
  e.hardDrop()
  assert(e.lines === 9, `一次消除 9 行（实际 ${e.lines}）`)
  assert(e.score > before, '消行得分增加')
  assert(e.current !== null, '锁定后生成下一块')
}

console.log('--- 顶出判负 ---')
{
  const e = new TetrisEngine({ random: lcg(4) })
  e.startRun()
  const full = Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(1))
  e.loadBoard(full)
  let guard = 0
  while (e.phase === 'playing' && guard < 30) {
    e.hardDrop()
    guard++
  }
  assert(e.phase === 'over', '顶部锁死判负')
}

console.log('--- 7-bag 分布 ---')
{
  const e = new TetrisEngine({ random: lcg(5) })
  e.startRun()
  const seen: PieceType[] = []
  for (let i = 0; i < 7; i++) {
    seen.push(e.current!.type)
    e.hardDrop()
  }
  assert(new Set(seen).size === 7, `开局 7 块覆盖全部 7 种（实际 ${new Set(seen).size} 种）`)
}

console.log('--- 暂停/结束/返回主菜单 ---')
{
  const e = new TetrisEngine({ random: lcg(6) })
  e.startRun()
  e.pause()
  assert(e.phase === 'paused', 'pause 生效')
  e.resume()
  assert(e.phase === 'playing', 'resume 生效')
  e.endRun()
  assert(e.phase === 'over', 'endRun 进入 over')
  e.toMenu()
  assert(e.phase === 'menu' && e.score === 0 && e.current === null, 'toMenu 清空棋盘与成绩')
}

console.log(`\n结果：${passed} 通过，${failed} 失败`)
if (failed > 0) throw new Error(`${failed} 项冒烟测试失败`)
