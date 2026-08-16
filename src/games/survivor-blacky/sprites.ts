// ============================================================
// 幸存者小黑：像素精灵资产库（唯一出处 DESIGN.md v1.1 §4）
// Q 版原型参考：罗小黑战记（黑猫）· 卡通粉猪 · 卡通小鸡 · 柴犬 · 广场肥鸽
// 全部为代码手绘像素网格：'.'=透明，其余字符见 PIXEL_PALETTE
// 精灵在 Game.tsx 中预渲染为离屏 canvas 缓存后 drawImage（性能）
// ============================================================

export const PIXEL_PALETTE: Record<string, string> = {
  K: '#1c1b1b', // 墨线/描边
  X: '#0f0e0e', // 深影
  B: '#2b2b33', // 猫身黑
  b: '#3d3d49', // 猫身亮面
  W: '#ffffff', // 纯白
  w: '#f3f0ef', // 奶白（肚皮）
  Y: '#ffd700', // 英雄黄（猫眼/王冠）
  y: '#c9a900', // 黄暗
  O: '#ffb300', // 喙橙
  R: '#e62429', // 动作红（鸡冠/披风/激光）
  r: '#a31217', // 红暗
  P: '#ff9db1', // 猪粉
  p: '#e5849a', // 猪粉暗
  N: '#c98a4b', // 狗棕
  n: '#a56b33', // 狗棕暗
  C: '#fff6e8', // 鸡白
  c: '#e8d9c0', // 鸡白暗
  A: '#b9c2cf', // 鸽灰
  a: '#98a1af', // 鸽灰暗
  E: '#e8edf4', // 鸽胸白
  M: '#f0d9b8', // 口鼻
  T: '#ff7a8a', // 舌头
  U: '#a200ff', // 精英紫
  G: '#7ec850', // 草绿
  g: '#5f9a44', // 草绿暗
  S: '#9aa6b5', // 鸽尾羽
  F: '#e8d59c', // 沙土路
  L: '#b9c0c8', // 石头
  V: '#8a5a2b', // 树干
}

export type Sprite = string[]

// ================= 主角：小黑猫（16×16，朝右，罗小黑 Q 版） =================
export const SPR_CAT_IDLE: Sprite = [
  '..KK......KK..',
  '.KBBK....KBBK.',
  'KBBBBK..KBBBBK',
  'KBBBBBBBBBBBBK',
  'KbBBBBBBBBBBbK',
  'KBBBYYBBBYYBBK',
  'KBBBYKBBBKYBBK',
  'KbBBBBBBBBBBbK',
  'KBBwwBBBBwwBBK',
  '.KBBBBBBBBBBK.',
  '..KBBBBBBBBK..',
  '..KBBwwBBBBK..',
  '..KBwwwwBBBK..',
  '..KwwwwwwwwK..',
  '..KwKwwwwKwK..',
  '...KK....KK...',
]
export const SPR_CAT_WALK1: Sprite = [
  '..KK......KK..',
  '.KBBK....KBBK.',
  'KBBBBK..KBBBBK',
  'KBBBBBBBBBBBBK',
  'KbBBBBBBBBBBbK',
  'KBBBYYBBBYYBBK',
  'KBBBYKBBBKYBBK',
  'KbBBBBBBBBBBbK',
  'KBBwwBBBBwwBBK',
  '.KBBBBBBBBBBK.',
  '..KBBBBBBBBK..',
  '..KBBwwBBBBK..',
  '..KBwwwwBBBK..',
  '..KwwwwwwwwK..',
  '...KK..KK.K...',
  '......K..K....',
]
export const SPR_CAT_WALK2: Sprite = [
  '..KK......KK..',
  '.KBBK....KBBK.',
  'KBBBBK..KBBBBK',
  'KBBBBBBBBBBBBK',
  'KbBBBBBBBBBBbK',
  'KBBBYYBBBYYBBK',
  'KBBBYKBBBKYBBK',
  'KbBBBBBBBBBBbK',
  'KBBwwBBBBwwBBK',
  '.KBBBBBBBBBBK.',
  '..KBBBBBBBBK..',
  '..KBBwwBBBBK..',
  '..KBwwwwBBBK..',
  '..KwwwwwwwwK..',
  '...K..KK..K...',
  '......K...K...',
]

// ================= 敌人 =================
// 猪猪（14×14，粉圆身 + 猪鼻 + 卷尾）
export const SPR_PIG_1: Sprite = [
  '....KK..KK...',
  '...KPPK.KPPK.',
  '...KPPPPPPPK.',
  '..KPPPPPPPK..',
  '..KPPPPPPPK..',
  '.KPPPPPPPPK..',
  '.KPPKPPPPKPK.',
  '.KPPPPPPPPP..',
  '.KPPppppppPK.',
  '.KPPpKKKKpPK.',
  '..KpppppppK..',
  '...KPPPPPK...',
  '..KPP...PPK..',
  '..KK.....KK..',
]
export const SPR_PIG_2: Sprite = [
  '....KK..KK...',
  '...KPPK.KPPK.',
  '...KPPPPPPPK.',
  '..KPPPPPPPK..',
  '..KPPPPPPPK..',
  '.KPPPPPPPPK..',
  '.KPPKPPPPKPK.',
  '.KPPPPPPPPP..',
  '.KPPppppppPK.',
  '.KPPpKKKKpPK.',
  '..KpppppppK..',
  '...KPPPPPK...',
  '...KPP..PPK..',
  '...KK....KK..',
]

// 鸡哥（12×12，白圆身 + 红鸡冠 + 橙喙）
export const SPR_CHICK_1: Sprite = [
  '...KK........',
  '...KRRK......',
  '..KRRRRK.....',
  '.KCCCCCCK....',
  'KCCCCCCCCK...',
  'KCCCcCCCCCK..',
  'KCCCCCCCCCOK.',
  'KCCCKCCCCCOK.',
  'KCCCCCCCCCK..',
  '.KCCCCCCCK...',
  '..KKCCCKK....',
  '...KO.OK.....',
]
export const SPR_CHICK_2: Sprite = [
  '...KK........',
  '...KRRK......',
  '..KRRRRK.....',
  '.KCCCCCCK....',
  'KCCCCCCCCK...',
  'KCCCcCCCCCK..',
  'KCCCCCCCCCOK.',
  'KCCCKCCCCCOK.',
  'KCCCCCCCCCK..',
  '.KCCCCCCCK...',
  '..KKCCCKK....',
  '....KOOK.....',
]

// 狗子（12×12，棕身 + 垂耳 + 卷尾）
export const SPR_DOG_1: Sprite = [
  '..KK....KK...',
  '.KNNK..KNNK..',
  'KNNNNKKNNNNK.',
  'KNNNNNNNNNNK.',
  'KNNnNNNNNNnK.',
  'KNNNKNNNNNNK.',
  'KNNNNNNNNNMK.',
  'KNNNNNNNNNMK.',
  '.KNNNNNNNNK..',
  '..KNNNNNNK...',
  '...KNNNNK....',
  '....KKKK.....',
]
export const SPR_DOG_2: Sprite = [
  '..KK....KK...',
  '.KNNK..KNNK..',
  'KNNNNKKNNNNK.',
  'KNNNNNNNNNNK.',
  'KNNnNNNNNNnK.',
  'KNNNKNNNNNNK.',
  'KNNNNNNNNNMK.',
  'KNNNNNNNNNMK.',
  '.KNNNNNNNNK..',
  '..KNNNNNNK...',
  '....KNNK.....',
  '....KNNK.....',
]

// 巨型鸽子（16×16，肥灰身 + 白胸 + 橙喙）
export const SPR_PIGEON_1: Sprite = [
  '..........KK...',
  '.........KAAK..',
  '........KAAAAAK.',
  '.......KAAAKAAK.',
  '.......KAACAAAK.',
  '......KAAAAAAOOK',
  '..KK..KAAAAAAAAK',
  '.KAAKKAAAEAAAAAK',
  'KAAAAAAEEEAAAAAK',
  'KAAaAAAKEAAAAAK.',
  'KAAAAAAAEEEEAAK.',
  '.KAAaAAAAAAAAK..',
  '.KAAAAAASSSAK...',
  '..KAAAAAASSAK...',
  '...KRRRRRRRRK...',
  '....KKKKKKKK....',
]
export const SPR_PIGEON_2: Sprite = [
  '..........KK...',
  '.........KAAK..',
  '........KAAAAAK.',
  '.......KAAAKAAK.',
  '.......KAACAAAK.',
  '......KAAAAAAOOK',
  '..KK..KAAAAAAAAK',
  '.KAAKKAAAEAAAAAK',
  'KAAAAAAEEEAAAAAK',
  'KAAaAAAAEAAAAAK.',
  'KAAAAAAAEEEEAAK.',
  '.KAAaAAAAAAAAK..',
  '..KAAAAAAASAK...',
  '...KAAAAAASAK...',
  '...KRRRRRRRRK...',
  '....KKKKKKKK....',
]

// 迷你鸽（10×10）
export const SPR_MINIPIGEON: Sprite = [
  '....KK....',
  '...KAAK...',
  '..KAAAAAK.',
  '.KAAEAAOK.',
  'KAAAAAAAK.',
  'KAAEEAAAK.',
  'KAEEEEAAK.',
  '.KAAAAAK..',
  '..KKKKK...',
  '..........',
]

// 鸽子王 BOSS（30×30：肥鸽 + 王冠 + 红披风 + 愤怒眼）
export const SPR_BOSS: Sprite = [
  '...........KK.......KK...........',
  '..........KYYK.....KYYK..........',
  '.........KYYYYK...KYYYYK.........',
  '.........KYYYYYK.KYYYYYK.........',
  '........KYYYYYYYYYYYYYYYK........',
  '........KYYYYYKRYKYYYYYK.........',
  '.........KYYYYKYYKYYYYK..........',
  '..........KKKKKKKKKKK............',
  '..............KK.................',
  '.............KAAK................',
  '............KAAAAAK..............',
  '...........KAAAAAAAK.............',
  '....KK....KAAAAAAAOOK...........',
  '...KRRK..KAAAAAAAAAAK...........',
  '..KRRRRK.KWAAWWAAAAAAK..........',
  '.KRRRRRRKKWAKWAAAAAAK...........',
  'KRRRRRRRRKAAAAAAAAAAAK..........',
  'KRRRRRRRRKAAEEAAAEEAAK..........',
  '.KRRRRRRKAAEEAAAEEAAAK..........',
  '..KRRRRKAAAAAAAAAAAAAK..........',
  '...KRRKKAAAEEEEEEEEAAK..........',
  '....KKKAAAAAAAAAAAAAAK..........',
  '.......KAAaAAAAAAAAAAK..........',
  '.......KAAAAAAAASSSAAK..........',
  '.......KAAAAAAAASSSAAK..........',
  '........KAAaAAAAASSSAK..........',
  '........KAAAAAAAAAAAAK..........',
  '.........KAAAAAAAAAAK...........',
  '..........KRRRRRRRRK............',
  '...........KKKKKKKK.............',
]

// ================= 掉落物与弹体 =================
// 经验小鱼干（7×7）
export const SPR_GEM: Sprite = [
  '..OO...',
  '.OOOO..',
  'OOOOOO.',
  'OOwOOO.',
  'OOOOOO.',
  '.OOOO..',
  '..OO...',
]
// 猫毛飞弹（6×6）
export const SPR_HAIRBALL: Sprite = ['..KK..', '.KBBK.', 'KBBBBK', 'KBBBbK', '.KBBK.', '..KK..']
// 毛线球（6×6，红）
export const SPR_YARN: Sprite = ['..KK..', '.KRRK.', 'KRRWRK', 'KRWRRK', '.KRRK.', '..KK..']
// 鱼骨回旋镖（8×5）
export const SPR_BOOMERANG: Sprite = ['KK...KK.', '.KK.KK..', '..KKK...', '.KK.KK..', 'KK...KK.']
// 小鱼干弹药（7×5）
export const SPR_FISH: Sprite = ['..OO..K', '.OOOOK.', 'OOOOOOK', '.OOOOK.', '..OO..K']
// 猫砂炸弹（6×7）
export const SPR_BOMB: Sprite = [
  '..KK..',
  '.KXXK.',
  'KXXXXK',
  'KXWXXK',
  '.KXXK.',
  '..KK..',
  '...K..',
]
// 爆炸帧（12×12 ×2）
export const SPR_BOOM_1: Sprite = [
  '.....KK.....',
  '...KYYYYK...',
  '....KYYK....',
  '..KYKYYKYK..',
  '.KYYKKKKYYK.',
  '..KYYYYYYK..',
  '...KYYYYK...',
  '..KYYYYYYK..',
  '.KYYKKKKYYK.',
  '..KYKYYKYK..',
  '....KYYK....',
  '.....KK.....',
]
export const SPR_BOOM_2: Sprite = [
  '.....KK.....',
  '...KRRRK....',
  '...KYYK.....',
  '..KYYKYYK...',
  '..KYYKYYK...',
  '...KYYK.....',
  '....KK......',
  '..KRRRRK....',
  '...KRRK.....',
  '....KK......',
  '............',
  '............',
]

// ================= HUD 小图标 =================
export const SPR_HEART: Sprite = [
  '.KK.KK.',
  'KRRKRRK',
  'KRRRRRK',
  'KRRRRRK',
  '.KRRRK.',
  '..KRK..',
  '...K...',
]
export const SPR_SKULL: Sprite = [
  '..KKKK..',
  '.KWWWWK.',
  'KWWWWWWK',
  'KWWKWWK.',
  '.KKKKKK.',
  '..K..K..',
]
export const SPR_CROWN: Sprite = [
  'K...K...K',
  'KY.KY.KYK',
  'KYYYYYYYK',
  '.KYYYYYK.',
  '..KYYYK..',
  '...KKK...',
]

// ================= 武器图标（12×12） =================
export const SPR_ICON_WEAPON: Record<string, Sprite> = {
  hairball: [
    '....KK....',
    '..KBBBBK..',
    '.KBBBBBBK.',
    'KBBBBBBBBK',
    'KBBBbbBBBK',
    'KBBBBBBBBK',
    '.KBBBBBBK.',
    '..KBBBBK..',
    '....KK....',
    '..........',
    '..........',
    '..........',
  ],
  yarn: [
    '....KK....',
    '..KRRRRK..',
    '.KRRWWRRK.',
    'KRRWWRRRRK',
    'KRRWRRWWRK',
    'KRRWWRRRRK',
    '.KRRRRRRK.',
    '..KRRRRK..',
    '....KK....',
    '..........',
    '..........',
    '..........',
  ],
  boomerang: [
    'KK......KK',
    '.KK....KK.',
    '..KK..KK..',
    '...KKKK...',
    '..KK..KK..',
    '.KK....KK.',
    'KK......KK',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  laser: [
    '..KKKKKK..',
    '.KWWWWWWK.',
    'KWWKWWKWWK',
    'KWWWKKWWWK',
    'KWWKWWKWWK',
    '.KWWWWWWK.',
    '..KKKKKK..',
    '..........',
    '...KRK....',
    '...KYK....',
    '....K.....',
    '..........',
  ],
  fishgun: [
    '...OO...K.',
    '..OOOO.KK.',
    '.OOOOOOK..',
    '.OOOOOOK..',
    '.OOOOOOK..',
    '..OOOO.KK.',
    '...OO...K.',
    '..........',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  litterbomb: [
    '....KK....',
    '...KXXK...',
    '..KXXXXK..',
    '.KXXWWXXK.',
    '.KXXXXXXK.',
    '..KXXXXK..',
    '...KXXK...',
    '....KK....',
    '.....K....',
    '....KYK...',
    '..........',
    '..........',
  ],
}

// ================= 被动图标（12×12） =================
export const SPR_ICON_PASSIVE: Record<string, Sprite> = {
  canned: [
    '...KKKK...',
    '..KNNNNK..',
    '.KNNNNNNK.',
    'KNNWWWWNNK',
    'KNWWNNWWNK',
    'KNWWNNWWNK',
    'KNNWWWWNNK',
    'KNNNNNNNNK',
    '.KNNNNNNK.',
    '..KNNNNK..',
    '...KKKK...',
    '..........',
  ],
  teaser: [
    '..........',
    '..........',
    '....KKK...',
    '....KYK...',
    '....KRK...',
    '....KYK...',
    '....KYK...',
    '.....KK...',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  fur: [
    '..........',
    '.KK....KK.',
    'KNNK..KNNK',
    'KNNNNKNNNK',
    '.KNNNNNNK.',
    '..KNNNNK..',
    '...KNNK...',
    '....KK....',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  claws: [
    '..K...K...',
    '.KK...KK..',
    'KKK...KKK.',
    'KKK...KKK.',
    'KKKKK.KKK.',
    '.KKKKKKK..',
    '..KKKKK...',
    '...KKK....',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  coffee: [
    '...KKKK...',
    '...KWWK...',
    '..KWWWWK..',
    '..KWWWWK..',
    '..KWWWWK..',
    '..KWWWWK..',
    '..KWWWWK..',
    '...KWWK...',
    '....KK....',
    '..........',
    '..........',
    '..........',
  ],
  milk: [
    '...KK....',
    '...KWWK..',
    '...KWWK..',
    '...KWWK..',
    '..KWWWWK.',
    '..KWWWWK.',
    '..KWWWWK.',
    '...KKKK..',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  catnip: [
    '..........',
    '.KK......K',
    'KGGK....KK',
    'KGGGKK.KGKK',
    'KGGGGGKGGK',
    '.KGGGGGGK.',
    '..KGGGGK..',
    '...KGGK...',
    '....KK....',
    '..........',
    '..........',
    '..........',
  ],
  box: [
    'KKKKKKKKKK',
    'KNNNNNNNNK',
    'KNNNNNNNNK',
    'KNNNNNNNNK',
    'KNNNNNNNNK',
    'KKKKKKKKKK',
    'KNNNNNNNNK',
    'KNNNNNNNNK',
    'KNNNNNNNNK',
    'KNNNNNNNNK',
    'KKKKKKKKKK',
    '..........',
  ],
}

// ================= 成就图标（12×12，按成就 id） =================
export const SPR_ICON_ACHIEVEMENT: Record<string, Sprite> = {
  first_kill: [
    '....KK....',
    '...KRRK...',
    '..KRRRRK..',
    '.KRRRRRRK.',
    'KRRRRRRRRK',
    'KRRRWWRRRK',
    'KRRRRRRRRK',
    '.KRRRRRRK.',
    '..KRRRRK..',
    '...KRRK...',
    '....KK....',
    '..........',
  ],
  kill_100: [
    '...KKKK...',
    '..KWWWWK..',
    '.KWWWWWWK.',
    'KWWKWWWWWK',
    'KWWWWKWWWK',
    '.KWWWWWWK.',
    '..KWWWWK..',
    '...KKKK...',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  kill_1000: [
    '...KKKK...',
    '..KWWWWK..',
    '.KWWWWWWK.',
    'KWWKWWWWWK',
    'KWWWWKWWWK',
    '.KWWWWWWK.',
    '..KWWWWK..',
    '...KKKK...',
    '...KYYK...',
    '..KYYYYK..',
    '...KYYK...',
    '....KK....',
  ],
  wave5: [
    '..........',
    '...KKKK...',
    '...KWWK...',
    '..KWWWWK..',
    '..KWWWWK..',
    '..KWWWWK..',
    '...KWWK...',
    '...KKKK...',
    '..........',
    '..........',
    '..........',
    '..........',
  ],
  wave10: [
    '..........',
    '...KKKK...',
    '...KWWK...',
    '..KWWWWK..',
    '..KWWWWK..',
    '..KWWWWK..',
    '...KWWK...',
    '...KKKK...',
    '...KYYK...',
    '..KYYYYK..',
    '...KYYK...',
    '....KK....',
  ],
  win: [
    '..........',
    '...KYYK...',
    '..KYYYYK..',
    '.KYYYYYYK.',
    'KYKYYYYKYK',
    'KYYYYYYYYK',
    'KYKYYYYKYK',
    '.KYYYYYYK.',
    '..KYYYYK..',
    '...KYYK...',
    '....KK....',
    '..........',
  ],
  gem500: [
    '....OO....',
    '...OOOO...',
    '..OOOOOO..',
    '.OOOOOOOO.',
    'OOOOOOOOOO',
    '.OOOOOOOO.',
    '..OOOOOO..',
    '...OOOO...',
    '....OO....',
    '..........',
    '..........',
    '..........',
  ],
  weapon_max: [
    '..........',
    '..K....K..',
    '.KK....KK.',
    'KKKKKKKKKK',
    'KKKKKKKKKK',
    '.KKKKKKKK.',
    '..KKKKKK..',
    '...KKKK...',
    '....KK....',
    '..........',
    '..........',
    '..........',
  ],
  all_weapons: [
    '..........',
    '...KKKK...',
    '..KYYYYK..',
    '.KYYYYYYK.',
    'KYYYYYYYYK',
    'KYYYYYYYYK',
    '.KYYYYYYK.',
    '..KYYYYK..',
    '...KKKK...',
    '..........',
    '..........',
    '..........',
  ],
  level15: [
    '...KKKK...',
    '..KWWWWK..',
    '.KWWWWWWK.',
    'KWWWWWWWWK',
    'KWWWWWWWWK',
    '.KWWWWWWK.',
    '..KWWWWK..',
    '...KKKK...',
    '....KK....',
    '...KYYK...',
    '..KYYYYK..',
    '...KYYK...',
  ],
  pig_death: [
    '..........',
    '....KK....',
    '...KPPK...',
    '..KPPPPK..',
    '.KPPPPPPK.',
    'KPPPPPPPPK',
    'KPPPKKPPPK',
    '.KPPKpKPPK',
    '..KpppppK.',
    '...KpppK..',
    '....KKK...',
    '..........',
  ],
  perfect_wave1: [
    '..........',
    '..........',
    '.KWWK.....',
    'KWWWWK....',
    'KWWWWK....',
    'KWWWWK....',
    'KWWWWK....',
    'KWWWWK....',
    '.KWWK.....',
    '.KK.......',
    '..........',
    '..........',
  ],
}
