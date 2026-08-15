// ============================================================
// 连连看像素精灵冒烟测试（决策 #25）
// 运行方式：node src/games/lianliankan/pixel.test.ts
// 覆盖：7 个精灵尺寸/字符集/非空/面部像素存在
// ============================================================
import { getSprite, SPRITE_SIZE } from './pixel.ts'

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

const CHARS = new Set(['.', 'K', 'M', 'H', 'S', 'E', 'B'])

for (let shape = 0; shape < 7; shape++) {
  const sprite = getSprite(shape as 0 | 1 | 2 | 3 | 4 | 5 | 6)
  assert(sprite.length === SPRITE_SIZE, `图形 ${shape}：行数 = ${SPRITE_SIZE}`)
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
  assert(allColsOk, `图形 ${shape}：列数 = ${SPRITE_SIZE}`)
  assert(charsOk, `图形 ${shape}：字符集合法`)
  assert(filled > 30, `图形 ${shape}：非空像素 > 30（实际 ${filled}）`)
  assert(eyes >= 1, `图形 ${shape}：含眼睛像素`)
  assert(blush >= 1, `图形 ${shape}：含腮红像素`)
}

console.log(`\n结果：${passed} 通过，${failed} 失败`)
if (failed > 0) throw new Error(`${failed} 项精灵测试失败`)
