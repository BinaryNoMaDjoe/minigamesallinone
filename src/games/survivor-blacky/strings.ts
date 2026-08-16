import type { LocalizedText } from '../shared/types'

// ============================================================
// 游戏内文案（双语，随界面语言；skills/skill-i18n.md）
// 唯一出处：同目录 DESIGN.md v1.0（§2.5/2.6/2.7/2.10、§5、§6）
// ============================================================

export type EnemyKindId = 'pig' | 'chicken' | 'dog' | 'pigeon'
export type WeaponId = 'hairball' | 'yarn' | 'boomerang' | 'laser' | 'fishgun' | 'litterbomb'
export type PassiveId = 'canned' | 'teaser' | 'fur' | 'claws' | 'coffee' | 'milk' | 'catnip' | 'box'

export const survivorbkStrings = {
  // —— 通用 ——
  title: { zh: '幸存者小黑', en: 'SURVIVOR BLACKY' } satisfies LocalizedText,
  tagline: {
    zh: '一只不想被做成表情包的小黑猫的求生之路',
    en: 'ONE LITTLE BLACK CAT. WAY TOO MANY ANIMALS.',
  } satisfies LocalizedText,
  start: { zh: '开始游戏', en: 'START' } satisfies LocalizedText,
  resume: { zh: '继续', en: 'RESUME' } satisfies LocalizedText,
  restart: { zh: '重新开始', en: 'RESTART' } satisfies LocalizedText,
  toMenu: { zh: '返回主菜单', en: 'MAIN MENU' } satisfies LocalizedText,
  playAgain: { zh: '再来一局', en: 'PLAY AGAIN' } satisfies LocalizedText,
  paused: { zh: '已暂停', en: 'PAUSED' } satisfies LocalizedText,
  best: { zh: '最高分', en: 'BEST' } satisfies LocalizedText,
  score: { zh: '得分', en: 'SCORE' } satisfies LocalizedText,
  time: { zh: '存活', en: 'TIME' } satisfies LocalizedText,
  wave: { zh: '波次', en: 'WAVE' } satisfies LocalizedText,
  kills: { zh: '击杀', en: 'KILLS' } satisfies LocalizedText,
  level: { zh: '等级', en: 'LV' } satisfies LocalizedText,
  menuHint: {
    zh: '回车 开始 · WASD/方向键 移动 · P 暂停 · 触屏拖动 = 虚拟摇杆',
    en: 'ENTER START · WASD/ARROWS MOVE · P PAUSE · DRAG ON TOUCH',
  } satisfies LocalizedText,

  // —— 升级浮层 ——
  levelUp: { zh: '升级！', en: 'LEVEL UP!' } satisfies LocalizedText,
  pickOne: { zh: '三选一', en: 'PICK ONE' } satisfies LocalizedText,
  upgradeWeapon: { zh: '武器', en: 'WEAPON' } satisfies LocalizedText,
  upgradePassive: { zh: '道具', en: 'ITEM' } satisfies LocalizedText,
  upgradeHeal: { zh: '补给', en: 'RELIEF' } satisfies LocalizedText,
  newWeapon: { zh: '新武器！', en: 'NEW!' } satisfies LocalizedText,
  upgradeTo: { zh: '升至', en: 'UP TO' } satisfies LocalizedText,
  maxLevel: { zh: '已满级', en: 'MAX' } satisfies LocalizedText,
  pressKey: { zh: '按 1 / 2 / 3 选择', en: 'PRESS 1 / 2 / 3' } satisfies LocalizedText,

  // —— 武器 ——
  weapon_hairball: { zh: '猫毛飞弹', en: 'HAIRBALL MISSILE' } satisfies LocalizedText,
  weapon_hairball_desc: {
    zh: '自动追踪最近敌人的猫毛导弹。',
    en: 'Homing hairballs that chase the nearest enemy.',
  } satisfies LocalizedText,
  weapon_yarn: { zh: '毛线球环', en: 'YARN ORBIT' } satisfies LocalizedText,
  weapon_yarn_desc: {
    zh: '绕着你转的毛线球，谁靠近就缠谁。',
    en: 'Yarn balls orbiting you - tangles anything that gets close.',
  } satisfies LocalizedText,
  weapon_boomerang: { zh: '鱼骨回旋镖', en: 'FISHBONE BOOMERANG' } satisfies LocalizedText,
  weapon_boomerang_desc: {
    zh: '穿透敌人的鱼骨镖，掷出去还会飞回来。',
    en: 'Piercing fishbones that fly out and come right back.',
  } satisfies LocalizedText,
  weapon_laser: { zh: '激光眼', en: 'LASER EYES' } satisfies LocalizedText,
  weapon_laser_desc: {
    zh: '猫的眼神攻击，瞬间扫射最近的敌人。',
    en: 'The legendary cat stare - instantly zaps the nearest foes.',
  } satisfies LocalizedText,
  weapon_fishgun: { zh: '小鱼干连弩', en: 'DRIED FISH GUN' } satisfies LocalizedText,
  weapon_fishgun_desc: {
    zh: '把库存小鱼干高速射出去的连弩。',
    en: 'Rapid-fire launcher that shoots your dried fish stash.',
  } satisfies LocalizedText,
  weapon_litterbomb: { zh: '猫砂炸弹', en: 'LITTER BOMB' } satisfies LocalizedText,
  weapon_litterbomb_desc: {
    zh: '在敌人脚下埋猫砂，延迟爆炸，满级附带臭气区。',
    en: 'Buries litter under enemies - delayed boom, max level leaves a stink zone.',
  } satisfies LocalizedText,

  // —— 被动道具 ——
  passive_canned: { zh: '猫罐头', en: 'CANNED CAT FOOD' } satisfies LocalizedText,
  passive_canned_desc: {
    zh: '+15 生命上限。满级后每秒回复 0.5 HP。',
    en: '+15 Max HP. Max level adds 0.5 HP regen per second.',
  } satisfies LocalizedText,
  passive_teaser: { zh: '逗猫棒', en: 'CAT TEASER' } satisfies LocalizedText,
  passive_teaser_desc: { zh: '+7% 移速。', en: '+7% move speed.' } satisfies LocalizedText,
  passive_fur: { zh: '猫毛加厚', en: 'THICKER FUR' } satisfies LocalizedText,
  passive_fur_desc: {
    zh: '+1 护甲，减少受到的接触伤害。',
    en: '+1 armor, reduces contact damage taken.',
  } satisfies LocalizedText,
  passive_claws: { zh: '爪磨器', en: 'CLAW SHARPENER' } satisfies LocalizedText,
  passive_claws_desc: { zh: '+8% 伤害。', en: '+8% damage.' } satisfies LocalizedText,
  passive_coffee: { zh: '咖啡', en: 'COFFEE' } satisfies LocalizedText,
  passive_coffee_desc: { zh: '+8% 攻击速度。', en: '+8% attack speed.' } satisfies LocalizedText,
  passive_milk: { zh: '牛奶', en: 'MILK' } satisfies LocalizedText,
  passive_milk_desc: {
    zh: '+22% 拾取半径，小鱼干吸得更远。',
    en: '+22% pickup radius - vacuum dried fish from further away.',
  } satisfies LocalizedText,
  passive_catnip: { zh: '猫薄荷', en: 'CATNIP' } satisfies LocalizedText,
  passive_catnip_desc: {
    zh: '+7% 暴击率（暴击 2 倍伤害）。',
    en: '+7% crit chance (crits deal 2x damage).',
  } satisfies LocalizedText,
  passive_box: { zh: '纸箱', en: 'CARDBOARD BOX' } satisfies LocalizedText,
  passive_box_desc: {
    zh: '+10% 经验获取。猫无法拒绝纸箱。',
    en: '+10% XP gain. No cat can refuse a cardboard box.',
  } satisfies LocalizedText,

  // —— 补给选项 ——
  heal_name: { zh: '小鱼干大餐', en: 'DRIED FISH FEAST' } satisfies LocalizedText,
  heal_desc: {
    zh: '立即回复 35% 最大生命。',
    en: 'Instantly restore 35% of your max HP.',
  } satisfies LocalizedText,

  // —— 敌人 ——
  enemy_pig: { zh: '猪猪', en: 'PIGGY' } satisfies LocalizedText,
  enemy_chicken: { zh: '鸡哥', en: 'CHICK' } satisfies LocalizedText,
  enemy_dog: { zh: '狗子', en: 'DOGGO' } satisfies LocalizedText,
  enemy_pigeon: { zh: '巨型鸽子', en: 'BIG PIGEON' } satisfies LocalizedText,
  enemy_minipigeon: { zh: '迷你鸽', en: 'MINI PIGEON' } satisfies LocalizedText,
  enemy_boss: { zh: '鸽子王', en: 'PIGEON KING' } satisfies LocalizedText,
  enemy_elite: { zh: '精英', en: 'ELITE' } satisfies LocalizedText,

  // —— 波次名（DESIGN.md §2.5） ——
  waveNames: [
    { zh: '猪突猛进', en: 'OINK RUSH' },
    { zh: '鸡飞狗跳', en: 'CHICKEN CHAOS' },
    { zh: '狗狗祟祟', en: 'DOGGONE IT' },
    { zh: '鸽子空袭', en: 'PIGEON AIRSTRIKE' },
    { zh: '家禽总动员', en: 'POULTRY PANDEMONIUM' },
    { zh: '猪朋狗友', en: 'PIG PALS' },
    { zh: '鸽斯拉', en: 'PIGEONZILLA' },
    { zh: '猫狗大战', en: 'CATS & DOGS' },
    { zh: '万物皆可拱', en: 'EVERYTHING CHARGES' },
    { zh: '鸽子王驾到', en: 'THE PIGEON KING' },
  ] as LocalizedText[],
  bossWarning: { zh: 'BOSS 来袭！', en: 'BOSS INCOMING!' } satisfies LocalizedText,
  victory: { zh: '胜利！', en: 'VICTORY!' } satisfies LocalizedText,
  defeated: { zh: '你没了。', en: 'YOU DIED.' } satisfies LocalizedText,
  causeOfDeath: { zh: '死因报告', en: 'CAUSE OF DEATH' } satisfies LocalizedText,

  // —— 死因 / 结算幽默（DESIGN.md §2.10） ——
  cause_pig: { zh: '被猪猪拱死了。', en: 'Pigged to death.' } satisfies LocalizedText,
  cause_chicken: {
    zh: '被鸡哥啄死了。',
    en: 'Pecked to death by a chick.',
  } satisfies LocalizedText,
  cause_dog: { zh: '被狗子追死了。', en: 'Chased to death by a doggo.' } satisfies LocalizedText,
  cause_pigeon: {
    zh: '被巨型鸽子踩扁了。',
    en: 'Flattened by a big pigeon.',
  } satisfies LocalizedText,
  cause_minipigeon: {
    zh: '被一群迷你鸽啄得怀疑猫生。',
    en: 'Pecked into existential crisis by mini pigeons.',
  } satisfies LocalizedText,
  cause_boss: { zh: '被鸽子王审判了。', en: 'Judged by the Pigeon King.' } satisfies LocalizedText,
  cause_unknown: {
    zh: '死于猫生无常。',
    en: 'Felled by the chaos of cat life.',
  } satisfies LocalizedText,
  winLine: {
    zh: '鸽子王也不过如此，晚饭加餐！',
    en: 'The Pigeon King was nothing. Extra dinner tonight!',
  } satisfies LocalizedText,
  newBest: { zh: '新纪录！', en: 'NEW RECORD!' } satisfies LocalizedText,

  // —— 主菜单 / 面板（像素版 UI，DESIGN.md v1.1 §6） ——
  menuStart: { zh: '开始游戏', en: 'START GAME' } satisfies LocalizedText,
  menuAchievements: { zh: '成就', en: 'ACHIEVEMENTS' } satisfies LocalizedText,
  menuBack: { zh: '返回', en: 'BACK' } satisfies LocalizedText,
  menuBest: { zh: '最高分', en: 'BEST SCORE' } satisfies LocalizedText,
  menuFooter: {
    zh: '一只小黑猫 VS 整个动物园',
    en: 'ONE LITTLE BLACK CAT VS THE WHOLE ZOO',
  } satisfies LocalizedText,
  achTitle: { zh: '成就', en: 'ACHIEVEMENTS' } satisfies LocalizedText,
  achUnlocked: { zh: '已解锁', en: 'UNLOCKED' } satisfies LocalizedText,
  achLocked: { zh: '未解锁', en: 'LOCKED' } satisfies LocalizedText,
  achTotal: { zh: '累计击杀', en: 'TOTAL KILLS' } satisfies LocalizedText,
  achToast: { zh: '成就解锁！', en: 'ACHIEVEMENT UNLOCKED!' } satisfies LocalizedText,
  howTitle: { zh: '玩法说明', en: 'HOW TO PLAY' } satisfies LocalizedText,
  howLines: [
    {
      zh: '自动战斗，走位生存！所有武器自动瞄准开火。',
      en: 'Weapons fire on their own - just move and survive!',
    },
    {
      zh: '吃小鱼干攒经验升级，三选一构筑武器与道具。',
      en: 'Collect dried fish to level up. Pick 1 of 3 upgrades.',
    },
    {
      zh: '活过 10 波并击败第 10 波的鸽子王即胜利。',
      en: 'Survive 10 waves and defeat the Pigeon King to win.',
    },
    {
      zh: '键盘：WASD/方向键移动 · P 暂停 · 1/2/3 选升级。',
      en: 'Keyboard: WASD/arrows move · P pause · 1/2/3 pick.',
    },
    {
      zh: '触屏：按住画面任意处拖动 = 虚拟摇杆。',
      en: 'Touch: press and drag anywhere for a virtual joystick.',
    },
  ] as LocalizedText[],

  // —— 成就（12 个，DESIGN.md v1.1 §7） ——
  ach_first_kill: { zh: '初出茅庐', en: 'FIRST BLOOD' } satisfies LocalizedText,
  ach_first_kill_desc: {
    zh: '首次击杀任意敌人。',
    en: 'Defeat your very first enemy.',
  } satisfies LocalizedText,
  ach_kill_100: { zh: '动物克星', en: 'ANIMAL BUSTER' } satisfies LocalizedText,
  ach_kill_100_desc: {
    zh: '累计击杀 100 只动物。',
    en: 'Reach 100 total kills.',
  } satisfies LocalizedText,
  ach_kill_1000: { zh: '动物园噩梦', en: 'ZOO NIGHTMARE' } satisfies LocalizedText,
  ach_kill_1000_desc: {
    zh: '累计击杀 1000 只动物。',
    en: 'Reach 1000 total kills.',
  } satisfies LocalizedText,
  ach_wave5: { zh: '小有所成', en: 'WARMED UP' } satisfies LocalizedText,
  ach_wave5_desc: {
    zh: '到达第 5 波。',
    en: 'Reach wave 5.',
  } satisfies LocalizedText,
  ach_wave10: { zh: '摸到王座', en: 'THE THRONE AWAITS' } satisfies LocalizedText,
  ach_wave10_desc: {
    zh: '到达第 10 波。',
    en: 'Reach wave 10.',
  } satisfies LocalizedText,
  ach_win: { zh: '鸽子王陨落', en: 'PIGEON KING DOWN' } satisfies LocalizedText,
  ach_win_desc: {
    zh: '击败鸽子王，通关本作。',
    en: 'Defeat the Pigeon King and win the game.',
  } satisfies LocalizedText,
  ach_gem500: { zh: '鱼干收藏家', en: 'FISH HOARDER' } satisfies LocalizedText,
  ach_gem500_desc: {
    zh: '单局收集 500 条小鱼干。',
    en: 'Collect 500 dried fish in one run.',
  } satisfies LocalizedText,
  ach_weapon_max: { zh: '神兵在手', en: 'MAXED OUT' } satisfies LocalizedText,
  ach_weapon_max_desc: {
    zh: '将任意一把武器升到满级。',
    en: 'Level any weapon to the max.',
  } satisfies LocalizedText,
  ach_all_weapons: { zh: '全副武装', en: 'FULL ARSENAL' } satisfies LocalizedText,
  ach_all_weapons_desc: {
    zh: '一局内集齐全部 6 把武器。',
    en: 'Own all 6 weapons in one run.',
  } satisfies LocalizedText,
  ach_level15: { zh: '满级猫', en: 'LEVEL 15 CAT' } satisfies LocalizedText,
  ach_level15_desc: {
    zh: '单局升到 15 级。',
    en: 'Reach level 15 in one run.',
  } satisfies LocalizedText,
  ach_pig_death: { zh: '被猪拱了', en: 'PIGGED' } satisfies LocalizedText,
  ach_pig_death_desc: {
    zh: '被猪猪拱死一局。恭喜？',
    en: 'Die to a piggy in a run. Congrats?',
  } satisfies LocalizedText,
  ach_perfect_wave1: { zh: '无伤开场', en: 'CLEAN START' } satisfies LocalizedText,
  ach_perfect_wave1_desc: {
    zh: '第 1 波全程无伤。',
    en: 'Take zero hits during wave 1.',
  } satisfies LocalizedText,

  // —— 主角台词（DESIGN.md §2.10） ——
  quoteStart: {
    zh: '今天也要努力活到吃晚饭喵！',
    en: 'Gotta survive until dinner, meow!',
  } satisfies LocalizedText,
  quoteBoss: {
    zh: '……这只鸽子为什么戴着王冠？',
    en: '...Why is that pigeon wearing a crown?',
  } satisfies LocalizedText,
  quoteLowHp: {
    zh: '喵命关天！',
    en: 'NINE LIVES, PEOPLE! ...I only have one left!',
  } satisfies LocalizedText,
  quoteLevelUp: { zh: '变强了喵！', en: 'Getting stronger, meow!' } satisfies LocalizedText,
  quoteVictory: {
    zh: '鸽子王也不过如此，晚饭加餐！',
    en: 'Pigeon King down. Dinner is served!',
  } satisfies LocalizedText,

  // —— 击杀拟声词池（DESIGN.md §2.10） ——
  onomatopoeia: [
    '喵!',
    'BONK!',
    'POW!',
    '呱!',
    '叽!',
    '汪!',
    '嗝!',
    'ZAP!',
    'BAM!',
    '咻!',
    '啪!',
    '咕!',
  ],

  // —— HUD ——
  hudHp: { zh: 'HP', en: 'HP' } satisfies LocalizedText,
  hudXp: { zh: '经验', en: 'XP' } satisfies LocalizedText,
  hudWave: { zh: '波次', en: 'WAVE' } satisfies LocalizedText,
  hudKills: { zh: '击杀', en: 'KILLS' } satisfies LocalizedText,
  hudTime: { zh: '时间', en: 'TIME' } satisfies LocalizedText,
  hudBossHp: { zh: '鸽子王', en: 'PIGEON KING' } satisfies LocalizedText,

  // —— 无障碍 aria ——
  ariaStart: { zh: '开始游戏', en: 'Start game' } satisfies LocalizedText,
  ariaResume: { zh: '继续游戏', en: 'Resume game' } satisfies LocalizedText,
  ariaRestart: { zh: '重新开始本局', en: 'Restart the run' } satisfies LocalizedText,
  ariaToMenu: { zh: '返回主菜单', en: 'Back to main menu' } satisfies LocalizedText,
  ariaPause: { zh: '暂停游戏', en: 'Pause game' } satisfies LocalizedText,
}

/** 仅文本键（排除数组池），供 pickLang 使用 */
export type SurvivorBkStringKey = {
  [K in keyof typeof survivorbkStrings]: (typeof survivorbkStrings)[K] extends LocalizedText
    ? K
    : never
}[keyof typeof survivorbkStrings]
