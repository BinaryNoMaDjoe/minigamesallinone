// ============================================================
// 星露谷连连看像素精灵冒烟测试（决策 #25）
// 运行方式：node src/games/lianliankan/pixel.test.ts
// 覆盖：36 个精灵尺寸/字符集/非空/面部像素存在（DESIGN.md v0.6 §4.2）
// ============================================================
import { getSprite, SPRITE_COUNT, SPRITE_SIZE } from './pixel.ts'

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

const CHARS = new Set(['.', 'K', 'M', 'H', 'S', 'E', 'B', 'A', 'L'])

for (let id = 0; id < SPRITE_COUNT; id++) {
  const sprite = getSprite(id)
  assert(sprite.length === SPRITE_SIZE, `精灵 ${id}：行数 = ${SPRITE_SIZE}`)
  let allColsOk = true
  let charsOk = true
  let filled = 0
  let eyes = 0
  let blush = 0
  for (const row of sprite) {
    if (row.length !== SPRITE_SIZE) allColsOk = false
    for (const ch of row) {
      if (!CHARS.has(ch)) charsOk = false
      if (ch !== '.') filled++
      if (ch === 'E') eyes++
      if (ch === 'B') blush++
    }
  }
  assert(allColsOk, `精灵 ${id}：列数 = ${SPRITE_SIZE}`)
  assert(charsOk, `精灵 ${id}：字符集合法`)
  assert(filled > 30, `精灵 ${id}：非空像素 > 30（实际 ${filled}）`)
  assert(eyes >= 1, `精灵 ${id}：含眼睛像素`)
  assert(blush >= 1, `精灵 ${id}：含腮红像素`)
}

console.log(`\n结果：${passed} 通过，${failed} 失败`)
if (failed > 0) throw new Error(`${failed} 项精灵测试失败`)
