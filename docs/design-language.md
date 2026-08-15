# 美术设计语言规范 · Inked Kinetic（网页级）

> **版本**：v0.7（响应式细化：§4.3 弹窗公式 dvh 化与窄窗紧凑，决策 #27）
> **来源素材**：`docs/design-reference/DESIGN.md`（设计令牌与组件说明）、`docs/design-reference/code.html`（GAMEVERSE UNLEASHED 落地实现）、`docs/design-reference/screen.png`（视觉参考截图）
> **适用范围**：本项目（minigamesallinone.binarynomad.io，多小游戏合集 Web）的**网页级视觉规范**——大厅首页、游戏弹窗窗框、导航、气泡、排行榜等一切公共 UI。参考页的文字内容一律忽略，仅取其视觉语言。
> **不在本规范内**：单个小游戏内部的视觉规范。游戏级视觉规范在对应游戏的 `manifest.ts` 中单独声明，允许与网页级风格不同。**游戏以弹窗形式运行：窗外与窗框遵循本规范，窗内遵循游戏级规范（见 §15）。**
> **变更记录**：v0.1 初稿 → v0.2 依据评审决议生长（暗色主题 §2.5、中文字体选型 §3.4、品牌字标 §8.3、弹窗运行模式 §15）；§13 落地映射对齐脚手架决策（Tailwind v4、字体自托管）→ v0.3 依据用户指令生长（2026-08-15）：响应式扩写 §4.3（横竖屏硬约束）、新增欢迎页 §8.10、动效 §9 新增滚动入场与欢迎页两行 → v0.4 依据用户指令（2026-08-15）：字标内容定案（§8.3/§8.10/§14，决策 #22）→ v0.5（2026-08-15）：§15 控制条随游戏阶段适配（ADR-0007、决策 #24）→ v0.6（2026-08-15）：§8.2 图区封面机制（决策 #26）→ v0.7（2026-08-15，用户指令）：§4.3 响应式细化——弹窗公式 dvh 化（回退 vh、负值失效回退全宽）、触控目标 ≥40px 落地细则（含窄窗宽度收窄例外）、游戏内窄窗容器查询紧凑布局（决策 #27）。

---

## 1. 风格定位

**Inked Kinetic（墨动）**：一个面向游戏玩家的"高级现代漫画"美学，桥接经典图像小说（graphic novel）的艺术性与高端数字 UI 的工艺感。

- 它是**现代粗野主义（Modern Brutalism）× 高对比编辑排版（High-Contrast Editorial）**的精致化变体
- 拒绝普通插画的"扁平感"：用**变化的线宽**和**破格出框的图层**制造深度
- 整个界面应该像**一页活着的漫画书**——有动能（kinetic）、有分寸（deliberate）、有权威感（authoritative）
- 目标受众：既怀念经典又欣赏现代数字工艺的游戏玩家

### 设计原则（Design Principles）

1. **墨线至上**：任何"浮起来"的元素必须有可见的墨黑描边；描边粗细即纵深（2px → 3px → 4px）
2. **阴影不许模糊**：禁用柔和模糊阴影，一律使用 100% 不透明的硬边错位色块，模拟"纸层叠纸"
3. **动感来自错位与倾斜**：容器错位堆叠（stack-offset 6px）、元素微倾斜（1~~1.5°）、面板大角度旋转（±6~~12°）、hover 时斜切（skew）
4. **高对比叙事**：大面积留白/纸白 + 纯色高饱和强调块，黑白灰承担骨架，红/蓝/黄只出现在"该被注意的地方"
5. **纹理代替渐变**：半调网点与速度线承担"中间调"，不用软渐变填充（光晕 blur 仅作为极克制的氛围点缀）
6. **文字即插画**：标题是全大写 + 斜体 + 超粗 + 硬投影，本身就是视觉元素，不只是信息载体

---

## 2. 色彩系统

### 2.1 品牌强调色（Brand Accent Colors）

| 角色   | 名称                | 色值      | 用途                                        |
| ------ | ------------------- | --------- | ------------------------------------------- |
| 主色   | **Action Red**      | `#E62429` | 主要 CTA、"Hero 时刻"、主按钮、焦点高亮     |
| 次色   | **Power Blue**      | `#0074E4` | 次级操作、信息状态、能量感元素              |
| 强调   | **Hero Yellow**     | `#FFD700` | 成就、特殊货币/状态、排行榜第一名、装饰标签 |
| 墨色   | **Ink Plate Black** | `#1C1B1B` | 所有描边、硬阴影、正文主色（模拟物理油墨）  |
| 纸色   | **Paper White**     | `#FFFFFF` | 基础背景，提供极致对比                      |
| 网点灰 | **Halftone Gray**   | `#E0E0E0` | Ben-Day 半调网点（次级背景区域）            |

### 2.2 语义化色板（Material 3 令牌体系）

完整令牌见附录 A。实际开发中**只允许通过语义令牌引用颜色**，不直接写死品牌色值。常用角色速查：

| 令牌                                     | 值                    | 直觉含义                                |
| ---------------------------------------- | --------------------- | --------------------------------------- |
| `background` / `surface`                 | `#FCF9F8`             | 页面底色（近白的暖纸色）                |
| `surface-container-lowest`               | `#FFFFFF`             | 纯白卡片面                              |
| `surface-container-low`                  | `#F6F3F2`             | 次级面板底                              |
| `surface-container`                      | `#F0EDEC`             | 一般容器                                |
| `surface-container-high` / `-highest`    | `#EBE7E7` / `#E5E2E1` | 更深容器 / 顶栏                         |
| `surface-dim`                            | `#DCD9D9`             | 半调网点圆点色                          |
| `on-surface`                             | `#1C1B1B`             | 正文、描边、墨黑                        |
| `on-surface-variant`                     | `#5D3F3C`             | 次级文字（暖棕灰）                      |
| `outline` / `outline-variant`            | `#926F6B` / `#E7BDB8` | 非墨线描边                              |
| `primary` / `primary-container`          | `#BF0016` / `#E62429` | 主色及其"容器"亮色                      |
| `on-primary`                             | `#FFFFFF`             | 主色之上的文字                          |
| `secondary` / `secondary-container`      | `#005AB4` / `#0072E1` | 次色及其容器                            |
| `tertiary` / `tertiary-container`        | `#705D00` / `#C9A900` | 黄色深色版（黄底配 `on-tertiary` 白字） |
| `error` / `error-container`              | `#BA1A1A` / `#FFDAD6` | 错误                                    |
| `inverse-surface` / `inverse-on-surface` | `#313030` / `#F3F0EF` | 暗色主题关键令牌（见 §2.4/2.5）         |

### 2.3 用色规则

- **红**：每屏最多一个"红主角"（主 CTA 或焦点卡片），不滥用
- **蓝**：次级按钮的**阴影**（不是按钮本体）、信息提示、次强调
- **黄**：只奖励给"赢家"——排行榜第 1 名、成就、HOT 标签
- **墨黑**：骨架色。描边、阴影、分隔线、正文
- **纸白 + 网点灰**：占画面 70% 以上，保证"漫画分镜"的呼吸感

### 2.4 明暗主题

- 默认**亮色主题**（Paper White 底）；暗色主题为本规范"生长"出来的完整规范（§2.5），与亮色**共用同一套令牌键名，仅值不同**
- 架构上必须支持 `class` 策略切换（给 `<html>` 加 `dark` 类）；组件一律通过语义令牌取色，不得写死浅色值
- 切换形式（跟随系统 / 手动开关 / 默认暗色）见 §14 遗留待定

### 2.5 暗色主题（Dark Theme · 生长规范）

**生长原则：不发明任何新色相。** 暗色板完全由现有亮色令牌按 M3 明暗映射规则推导，来源可追溯：

- 主/次/强调色的暗色版 = 亮色板中**已预置**的 `*-fixed-dim` 令牌
- 容器/文字的暗色版 = `inverse-*` 令牌与中性色按 M3 惯例调换
- 表面层级从"纸白渐深"翻转为"墨板渐亮"

| 角色                                            | 亮色值    | 暗色值    | 来源                                              |
| ----------------------------------------------- | --------- | --------- | ------------------------------------------------- |
| `background` / `surface`                        | `#FCF9F8` | `#141313` | 中性色 8 档推导                                   |
| `surface-dim`                                   | `#DCD9D9` | `#141313` | 同 surface                                        |
| `surface-bright`                                | `#FCF9F8` | `#3A3939` | 中性色 24 档推导                                  |
| `surface-container-lowest`                      | `#FFFFFF` | `#0F0E0E` | 中性色 4 档推导                                   |
| `surface-container-low`                         | `#F6F3F2` | `#1C1B1B` | 中性色 10 档推导                                  |
| `surface-container`                             | `#F0EDEC` | `#201F1F` | 中性色 13 档推导                                  |
| `surface-container-high`                        | `#EBE7E7` | `#2A2929` | 中性色 17 档推导                                  |
| `surface-container-highest` / `surface-variant` | `#E5E2E1` | `#353434` | 中性色 22 档（含 `inverse-surface #313030` 区间） |
| `on-surface` / `on-background`                  | `#1C1B1B` | `#E5E2E1` | 亮色 surface-container-highest                    |
| `on-surface-variant`                            | `#5D3F3C` | `#D8C2BF` | 同色相提亮至 80 档                                |
| `outline`                                       | `#926F6B` | `#A08C89` | 同色相提亮一档                                    |
| `outline-variant`                               | `#E7BDB8` | `#534342` | 同色相压暗至 28 档                                |
| `primary`                                       | `#BF0016` | `#FFB4AC` | = `primary-fixed-dim` / `inverse-primary`         |
| `on-primary`                                    | `#FFFFFF` | `#410003` | = `on-primary-fixed`                              |
| `primary-container`                             | `#E62429` | `#93000E` | = `on-primary-fixed-variant`                      |
| `on-primary-container`                          | `#FFFFFF` | `#FFDAD6` | = `primary-fixed`                                 |
| `secondary`                                     | `#005AB4` | `#AAC7FF` | = `secondary-fixed-dim`                           |
| `on-secondary`                                  | `#FFFFFF` | `#001B3E` | = `on-secondary-fixed`                            |
| `secondary-container`                           | `#0072E1` | `#00458D` | = `on-secondary-fixed-variant`                    |
| `on-secondary-container`                        | `#FEFCFF` | `#D6E3FF` | = `secondary-fixed`                               |
| `tertiary`                                      | `#705D00` | `#E9C400` | = `tertiary-fixed-dim`                            |
| `on-tertiary`                                   | `#FFFFFF` | `#221B00` | = `on-tertiary-fixed`                             |
| `tertiary-container`                            | `#C9A900` | `#544600` | = `on-tertiary-fixed-variant`                     |
| `on-tertiary-container`                         | `#4C3F00` | `#FFE16D` | = `tertiary-fixed`                                |
| `error`                                         | `#BA1A1A` | `#FFB4AB` | M3 惯例推导                                       |
| `on-error`                                      | `#FFFFFF` | `#690005` | M3 惯例推导                                       |
| `error-container`                               | `#FFDAD6` | `#93000A` | = 亮色 `on-error-container`                       |
| `on-error-container`                            | `#93000A` | `#FFDAD6` | = 亮色 `error-container`                          |
| `inverse-surface`                               | `#313030` | `#E5E2E1` | 翻转                                              |
| `inverse-on-surface`                            | `#F3F0EF` | `#313030` | 翻转                                              |
| `inverse-primary`                               | `#FFB4AC` | `#BF0016` | 翻转                                              |

**暗色下的漫画语言转译**（关键规则，配套 CSS 配方见附录 B）：

1. **墨线变白墨**：描边/分节线用暗色 `on-surface`（`#E5E2E1`），如同黑纸上的白色墨线
2. **硬阴影**：普通阴影用更深黑 `#0F0E0E`（= surface-container-lowest）；若对比不足可降至纯黑 `#000`；彩色阴影（红 `#BF0016` / 蓝 `#005AB4` / 黄）**保持品牌色不变**——暗底上对比反而更强
3. **半调网点**：网点色用 `surface-container-high #2A2929`（比底亮一档），禁用亮色网点以免刺眼
4. **速度线**：线色用 `surface-container #201F1F` 一档
5. **光晕**：红/蓝光晕保留，opacity 降至 0.15
6. **文字硬投影**：大标题投影切换为品牌红 `#BF0016` 或墨黑 `#0F0E0E`，保证暗底可见
7. **纸白卡片**：暗色下"纸"= 从 `surface-container-low #1C1B1B` 起步的墨板层级，最高层级卡片用 `surface-container-highest #353434`
8. **强调块**：黄底第 1 名、红底 CTA 等按上表整体换值（黄底 `#E9C400` 配深棕字 `#221B00`），保留"高亮块"语义
9. CSS 配方结构不变，颜色全部令牌化（附录 B 给出 `.dark` 覆盖写法）

---

## 3. 字体系统

### 3.1 三字体分工

| 字体               | 角色                            | 特征                                                 |
| ------------------ | ------------------------------- | ---------------------------------------------------- |
| **Anybody**        | 标题/展示（display & headline） | 窄体（condensed）+ 超粗（800/900），自带"印刷运动感" |
| **Hanken Grotesk** | 正文（body）                    | 干净现代，保证长文可读性，与激进标题形成对比         |
| **Space Grotesk**  | 技术/标签（label）              | UI 元数据、按钮标签、导航，强化"高级/技术"漫画感     |

加载：**自托管**（`@fontsource` 包，规避 Google Fonts 网络不稳定的问题）。字重区间：Anybody 100–900 含 italic；Hanken Grotesk 100–900 含 italic；Space Grotesk 300–700。

### 3.2 字阶表（Type Scale）

| 令牌                 | 字体           | 字号/行高 | 字重 | 字距    | 用途               |
| -------------------- | -------------- | --------- | ---- | ------- | ------------------ |
| `display-lg`         | Anybody        | 72 / 68   | 900  | -0.04em | Hero 大标题        |
| `headline-lg`        | Anybody        | 40 / 44   | 800  | -0.02em | 区块标题           |
| `headline-lg-mobile` | Anybody        | 32 / 36   | 800  | —       | 移动端区块标题     |
| `headline-md`        | Anybody        | 24 / 28   | 800  | —       | 卡片标题、面板题字 |
| `body-lg`            | Hanken Grotesk | 18 / 28   | 500  | —       | 引导段落           |
| `body-md`            | Hanken Grotesk | 16 / 24   | 400  | —       | 正文、描述         |
| `label-bold`         | Space Grotesk  | 14 / 16   | 700  | —       | 按钮、导航、榜单项 |
| `label-sm`           | Space Grotesk  | 12 / 14   | 500  | —       | 页脚、次要元数据   |

### 3.3 排版规则（Typography Rules）

1. **标题默认全大写 + 斜体**（italic，约 2° 前倾模拟动势）；主要大标题加 `-0.02em ~ -0.04em` 负字距收紧
2. **展示文字硬投影**：大标题使用 4px×4px 的纯色错位投影（如 `4px 4px 0 rgba(191,0,22,1)` 红影），或 3px 墨线描边，用于从纹理背景中分离
3. **标签一律大写**：按钮、导航、页脚、表单标签均大写 + 适度 `tracking-wide/widest`
4. **数字与排名**：用 headline/display 字重 + 斜体呈现，数字是"漫画里的拟声词"
5. **斜切点缀**：导航 hover 时 `skewX(-2deg)`，破坏"数字完美感"

### 3.4 中文字体适配（本项目为双语界面，必须处理）

三款英文字体**不含 CJK 字形**。本项目**非商用、仅学习研究**，无版权顾虑，直接选用开源免费字体：

| 用途                 | 首选                                                | 备选                                         | 说明                                      |
| -------------------- | --------------------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| 中文标题/展示        | **思源黑体 / Noto Sans SC**（Black 900 / Bold 700） | 阿里巴巴普惠体 3.0（Heavy）、MiSans（Heavy） | 以 900 字重保证与 Anybody 同等的分量感    |
| 中文正文             | 思源黑体 / Noto Sans SC（Regular 400 / Medium 500） | MiSans（Regular）                            | 保证长文可读                              |
| 中文标签             | MiSans（Medium）                                    | 思源黑体 Medium                              | MiSans 几何感更强，气质接近 Space Grotesk |
| 装饰性拟声字（可选） | 站酷庆科黄油体                                      | —                                            | 仅用于爆裂徽章/拟声词装饰，禁止用于正文   |

- 通过 jsDelivr CDN 加载（与 Google Fonts 并存，`font-display: swap`），字重按需引入控制体积
- **中文无真斜体** → 用 `transform: skewX(-2deg)` 模拟前倾动势（与英文 italic 视觉呼应）
- **"全大写"规则不适用于中文**：以字重 + 字距替代强调；同一令牌下中英文混排时，英文大写、中文正常
- **文案膨胀**：中文比英文紧凑，UI 宽度不得依赖英文大写宽度；按钮、卡片标题需按中文最长情形验收
- **数字**：排行榜分数、倒计时等保持西文数字与 tabular-nums

---

## 4. 间距与布局（Layout & Spacing）

### 4.1 基础尺度

| 令牌             | 值       | 含义                                   |
| ---------------- | -------- | -------------------------------------- |
| `unit`           | **4px**  | 一切间距的最小单位（4 的倍数）         |
| `gutter`         | **20px** | 栅格列间距——模仿漫画分镜之间的留白     |
| `margin-mobile`  | 16px     | 移动端页面左右边距                     |
| `margin-desktop` | 40px     | 桌面端页面左右边距                     |
| `stack-offset`   | **6px**  | 错位堆叠偏移量（背景复制层向右下偏移） |

### 4.2 栅格与破格

- 底层为 **12 栏栅格**，内容区 `max-width: 7xl`（1280px）居中
- **Rigid Grid with Breakout Elements（刚性栅格 + 破格元素）**：栅格是秩序，但个体元素被鼓励"违规"：
  - 主容器带一个向右下偏移 6px 的复制背景层（Ink Black 或网点填充）→ **Offset Stacking 错位堆叠**
  - 图片/装饰元素可倾斜 1~1.5°
  - Hero 面板组可大角度旋转（-12° / +6° / +12°）并互相叠压（z-index 10/30/20），形成"漫画分镜拼贴"
- **分节线**：区块之间用 4px 墨线 `border-b-4` 分隔，像漫画的格子线

### 4.3 响应式（全分辨率适配：手机横竖屏 → 桌面）

- 断点沿用 Tailwind 默认（sm 640 / md 768 / lg 1024 / xl 1280）
- 移动端：边距 16px，标题降级（Hero 大标题 `headline-lg-mobile` 32px → sm `headline-lg` 40px → lg `display-lg` 72px），多栏网格折叠为单栏
- 顶栏：主 CTA 在 sm 以下隐藏（Hero 区保留 CTA）；语言/主题切换始终保留为方形图标钮（内容压缩：如「中/EN」单字）
- Hero 面板拼贴：md 以下隐藏多面板组，改为居中展示单张倾斜小面板（约 `w-40 h-52`，`rotate-3`，红色硬阴影）
- 游戏弹窗（GameWindow）横竖屏硬约束：窗口宽 = `min(92vw, 860px, (92dvh − 170px) × 画布比例)`（动态视口单位，不支持 dvh 的浏览器回退 92vh；算式结果 ≤0 时声明失效回退全宽——仅视口高 <185px 的极端矮视口触发，无真实设备），保证横屏手机（如 740×360）下「标题栏 + 游戏区 + 控制条」完整可见、不溢出；遮罩内边距移动端 8px、桌面 16px；控制条 flex-wrap 允许换行
- 横向布局卡片（左图右文）在 sm 以下改为上下结构，描边从 `border-r-4` 切换为 `border-b-4`
- 触屏：游戏画布 `touch-action: none`（指针事件统一处理鼠标/触摸）；可点击目标 ≥ 40px（触屏/道具/浮层按钮统一 min-height 40px；极端窄窗下允许按钮宽度收窄——高度恒 ≥40px，tetris ≤200px 档最小宽 32px、连连看 ≤240px 档最小宽 64px）；游戏内浮层面板与工具条随窗口宽度以容器查询紧凑化，任何窗口宽度下不得裁切出界

---

## 5. 形状语言（Shapes）

- **主形状：锐利几何（Sharp & Geometric）**，默认 **0px 圆角**——"剪纸"质感
- **例外一**：头像、图标容器允许 `rounded-full`（圆形头像框内仍保留墨线描边）
- **例外二**：氛围光晕用 `rounded-full` + `blur`，仅作背景层
- **对话气泡（Speech Bubble）**：提示/通知用**尖角尾巴**指向来源，不用圆角气泡（配方见 §8.7）
- **爆裂形（Impact/Burst）**：多尖角星形，用于徽章、成就、升级通知，强调能量
- 标签盒（表单标签）为**小直角盒子**，压住输入框左上角边框

---

## 6. 纵深与立体感（Elevation & Depth）

本系统**禁用软阴影**。纵深由三级手段表达：

| 层级                   | 手段                       | 规格                                                                                                                      |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1. 硬阴影 Hard Shadow  | 100% 不透明纯色错位块      | 默认 `6px 6px 0` 墨黑；可用主色（红 `rgba(191,0,22,1)`）或次色（蓝 `rgba(0,90,180,1)`）作彩色阴影；hover 抬升时可增至 8px |
| 2. 半调网点 Halftone   | Ben-Day 圆点纹理作中间层级 | 见 §7.1；用于卡片下半部、排行榜列表底                                                                                     |
| 3. 墨线描边 Ink Stroke | 描边粗细 = 靠近程度        | 按钮/输入框 2px；气泡 3px；卡片/弹窗/顶栏分节 4px                                                                         |

> **交互即纵深**：按压（active）时元素向阴影方向位移 1px×1px 并**移除阴影**，模拟"真的按下去贴到纸上"。

---

## 7. 纹理库（Textures）

### 7.1 半调网点（Halftone / Ben-Day Dots）

```css
.halftone-bg {
  background-image: radial-gradient(circle, #dcd9d9 2px, transparent 2.5px);
  background-size: 10px 10px;
}
```

- 圆点直径 2px、网格 10px，颜色用 `surface-dim #DCD9D9`
- 用途：卡片文字区底、排行榜列表底、页脚底纹、错位堆叠的复制层
- 暗色下网点色换 `surface-container-high #2A2929`（见 §2.5 与附录 B）

### 7.2 速度线（Speed Lines）

```css
.speed-lines {
  background: repeating-linear-gradient(45deg, transparent 0 10px, #e5e2e1 10px 11px);
}
```

- 45° 斜纹、周期 11px、线宽 1px，颜色 `surface-container-highest #E5E2E1`
- 用途：Hero 区背景（opacity 50%）、空状态背景
- 暗色下线色换 `surface-container #201F1F`（见附录 B）

### 7.3 氛围光晕（Glow）——仅此一处允许"软"

```html
<div class="absolute -right-20 -top-20 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20" />
```

- 大红/大蓝圆 + `blur-3xl` + `opacity-20`，只放在 Hero 区角落做氛围（暗色 0.15），**禁止**用于表达纵深

### 7.4 纹理使用纪律

- 纹理层必须 `pointer-events: none`（或放 z-0 底层），不可影响交互
- 同一可视区域内半调与速度线**二选一**，不叠加混用
- 纹理色只用灰度系（网点灰/容器灰），不染色

---

## 8. 组件规范（Components）

### 8.1 按钮

| 变体      | 背景/文字       | 描边     | 阴影           | 说明                                                                     |
| --------- | --------------- | -------- | -------------- | ------------------------------------------------------------------------ |
| Primary   | Action Red / 白 | 2px 墨黑 | 4px 墨黑错位   | 主 CTA；hover 抬升 1px 且阴影增至 8px；active 按压（位移 1×1、阴影消失） |
| Secondary | 纸白 / 墨黑     | 2px 墨黑 | 4px **蓝**错位 | 次级操作；hover 变 Power Blue 底白字                                     |
| Icon      | 容器色 / 图标   | 4px 墨黑 | 4px 墨黑错位   | 40×40px 方形图标钮（搜索、菜单等）                                       |
| Text      | 无底 / 主色文字 | 无       | 无             | 排行页脚"查看全部"类；hover 下划线                                       |

- 文字：`label-bold`（14/700）全大写；大号 CTA 可升级 `headline-md`
- 内边距：常规 `px-6 py-2`；大 CTA `px-10 py-4`
- hover 过渡：`transition-transform duration-100`，可加 `skewX(-2deg) scale(1.05)`（导航/顶栏按钮）
- 焦点态（无障碍）：保留 2px 蓝色 outline，不得因描边设计移除 focus 可见性

### 8.2 卡片（Pop-out Card / Category Card）

- 整体：`comic-border`（4px 墨线）+ 纸白底 + 6px 墨黑影 + hover 上浮 2px（duration-300）
- **图区封面**（决策 #26）：由游戏 manifest.cover（游戏目录内 `cover.svg` 等资源 URL）渲染，`object-cover` 铺满图区；未提供封面时回退为半调网点 + 游戏名首字占位。Hero 面板同样优先使用 cover
- 文字区：`p-6` + 半调网点底
- 标题：`headline-md` 大写斜体；描述：`body-md` 次级文字色，可置于带 2px 墨线的纸白小框内（`p-2`）
- 图片 hover：`scale(1.1)`、duration-500/700，容器 `overflow-hidden`
- **装饰标签**：绝对定位 `-top-3 -left-3`，Hero Yellow 底 + 墨线 + `label-bold` 大写 + `-rotate-12`（例：HOT / NEW）
- 大通栏卡（占两列）：图左文右（`border-r-4`），sm 以下图上文下（`border-b-4`）

### 8.3 顶部导航（Header）

- 粘性置顶（sticky, z-50），纸色底，**底部 4px 墨线**，整体带**红色**硬阴影（6px 6px 0 `primary`）
- 左：品牌字标——`headline-lg` 大写斜体 900 字重，**主色红**，`tracking-tighter`；移动端降 `headline-lg-mobile`
- **字标内容（本项站点专属，已定 #22）**：主标 **`MINIGAMESALLINONE`**（与域名连写一致、无空格；视觉拆行 MINIGAMES / ALLINONE，display/headline 大写斜体），机构副标 `BINARY NOMAD` 用 `label-bold` 置于字标旁或页脚；欢迎页出品方行为 `by@BinaryNomad.io`（大小写保真，不应用大写变换）
- 中：导航链接——`label-bold` 大写，hover 变红 + `skewX(-2deg) scale(1.05)`
- 右：图标按钮 + 主 CTA 式按钮；移动端折叠为菜单图标
- 内边距：桌面 `px-margin-desktop py-4`，移动 `px-margin-mobile`

### 8.4 Hero 区（Splash）

- `min-h-[80vh]`，速度线背景（50% 透明度）+ 红蓝两角光晕，底部 4px 墨线分节
- 文案列（5/12）：警示气泡（红字 `label-bold`，-2° 旋转）→ `display-lg` 大标题（部分词用主色红，红色硬投影）→ 引导段（`body-lg`，左侧 4px 红边条 + `surface-container-low` 底）→ 大 CTA
- 面板列（7/12）：三张游戏面板错位旋转堆叠（见 §4.2），面板底有题字条（图名，大写斜体，主卡题字条为红底白字）

### 8.5 排行榜（Leaderboard）

- 容器：4px 墨线 + 6px 墨黑影 + `p-1`（内部再垫一层）
- 表头：**红底白字**，`headline-md` 大写斜体 + 徽章图标（32px），底部 4px 墨线
- 列表：`surface-container-low` + 半调网点，`gap-3`；背后可放大号斜体「#1」灰字做装饰（opacity-20，`pointer-events: none`）
- **第 1 名**：Hero Yellow 底 + 白字 + 红色硬阴影 + 上移 1px；含圆形墨线头像（40px，`rounded-full`）
- 第 2、3 名：纸白卡片行，排名用 `headline-md` 斜体灰字
- 第 4 名起：`body-md` 字重，透明度递减（0.9 / 0.8）
- 玩家名：`label-bold` 大写；分数：`headline-md`

### 8.6 输入框

- 2px 墨线描边
- 标签：`label-bold` 大写，放在一个**压住输入框左上角边框**的小标签盒里（叠加定位）

### 8.7 气泡提示 / 通知（Speech Bubble）

```css
.comic-bubble {
  position: relative;
  background: #ffffff;
  border: 3px solid #1c1b1b;
  padding: 8px 16px;
  font-weight: 900;
  text-transform: uppercase;
}
.comic-bubble::after {
  /* 外尾（墨线） */
  content: '';
  position: absolute;
  bottom: -10px;
  left: 20px;
  border-width: 10px 10px 0 0;
  border-style: solid;
  border-color: #1c1b1b transparent transparent transparent;
}
.comic-bubble::before {
  /* 内尾（纸白覆盖） */
  content: '';
  position: absolute;
  bottom: -6px;
  left: 22px;
  border-width: 8px 8px 0 0;
  border-style: solid;
  border-color: #ffffff transparent transparent transparent;
  z-index: 1;
}
```

- 白底 + 3px 墨线 + 尖角尾巴指向来源（如 Hero 区「WARNING」式气泡）
- 尾巴方向可翻转（气泡在来源上方/下方/左右均可），逻辑一致：双三角叠出 3px 描边尾巴

### 8.8 进度条

- 高对比分段式：**禁止平滑渐变填充**
- 填充用**斜线排线（diagonal hatching）**或 Action Red 实心块，底色纸白 + 2px 墨线框

### 8.9 页脚

- 底：`surface-container-highest` + 半调底纹 + 顶部 4px 墨线
- 品牌字标：`headline-md` 900 大写斜体
- 链接：`label-sm` 大写 + `tracking-widest`，hover 变红 + 斜切
- 版权行：`label-sm` 大写，可用一句漫画腔文案（如 "PRINTED IN DIGITAL SPACE"）；站名域名放于此

### 8.10 欢迎页（Welcome Splash）

- 全屏首屏（层级高于顶栏），纸色底 + 速度线（40% 透明）+ 红/蓝角光晕（§7 纹理纪律）
- 字标两行（内容已定 #22）：
  - 第一行 站名主标：**`MINIGAMESALLINONE`**（与域名连写一致，无空格），拆两视觉行 MINIGAMES / ALLINONE；`display-lg` 大写斜体 900，墨色 + 红色硬投影；移动端降 `headline-lg-mobile` → sm `headline-lg` → lg `display-lg`
  - 第二行 出品方行：**`by@BinaryNomad.io`**，`label-bold` + `tracking-widest`（**大小写保真，不应用大写变换**）
- 动效（§9）：
  - 主标：自下而上 28px 入场（≤400ms，ease-out）+ 红色硬投影随落定同步生成（0 → 4px，≤300ms）——"墨迹砸纸"
  - 出品方行：微缩放（0.9→1）+ 轻微旋转回正（≤300ms）
  - ENTER 主按钮：延迟淡入（≤300ms）；动画结束后获得焦点（无障碍）
  - 点击任意处或 ENTER 按钮进入大厅：整页淡出 ≤200ms
  - `prefers-reduced-motion`：全部元素直接呈现，无动画
- 每次页面加载展示；进入后不再拦截（游戏弹窗期间欢迎页不出现）

---

## 9. 动效规范（Motion）

| 交互                    | 效果                                                                                     | 时长                   |
| ----------------------- | ---------------------------------------------------------------------------------------- | ---------------------- |
| 按钮/导航 hover         | `skewX(-2deg) scale(1.05)` 或上移 1px、阴影 6→8px                                        | 100ms                  |
| 按钮 active（按压）     | 位移 1px×1px（向阴影方向）+ 阴影消失                                                     | 即时                   |
| 卡片 hover              | 上浮 2px（translate-y -2）                                                               | 300ms                  |
| 面板 hover              | 旋转归零（±12°→0°）或上移 4px                                                            | 500ms                  |
| 图片 hover              | 放大 1.1                                                                                 | 500–700ms              |
| 游戏弹窗打开            | 微放大出现 + 硬阴影同步，**≤200ms**，禁弹性动画                                          | 150–200ms              |
| 颜色切换                | 背景/文字颜色过渡                                                                        | 默认 transition-colors |
| 滚动入场（生长 v0.3）   | 进入视口时淡入 + 上移 24px，一次性；卡片级联延迟 ≤80ms/张；动效结束摘除类交还 hover 过渡 | 300ms                  |
| 欢迎页动效（生长 v0.3） | 主标上移 28px + 红色硬投影"落定"（0→4px）；出品行微缩放回正；ENTER 淡入；退出整页淡出    | 300–400ms              |

- 原则：**快、脆、干脆**——动效模拟"物理按压"，不出现弹性缓动、弹簧、漂浮循环动画
- 尊重 `prefers-reduced-motion`：减弱/关闭位移与旋转，保留颜色变化

---

## 10. 图标（Iconography）

- 使用 **Material Symbols Outlined**（`FILL` 可调 0/1），线形为主
- 常规 18px（内联）、按钮内 24px、表头装饰 32px
- 图标与文字同色（继承 currentColor），不做彩色图标

---

## 11. 插画 / 游戏美术方向

（本规范只管"标准"，具体游戏封面由游戏级规范产出）

- **高对比漫画封面风**：重墨线描边、戏剧化打光、高饱和、动态构图、速度线/网点阴影
- 封面图用于：Hero 面板、游戏卡片头图、头像
- 一律配 `data-alt` 风格描述文案，便于生成与无障碍
- 图片比例：卡片头图约 4:3；Hero 面板竖版约 2:3

---

## 12. 无障碍与质量底线

- 正文对比度 ≥ 4.5:1（`on-surface-variant` 仅用于大号文字/装饰，小字正文用 `on-surface`）
- 所有交互元素必须有可见 focus 态（蓝 outline）
- 装饰性倾斜/旋转不影响可点击区域与键盘导航顺序
- 纹理、光晕层 `pointer-events: none`
- 弹窗需满足 §15 的无障碍要求

---

## 13. 落地映射（如何进入本项目代码）

待项目脚手架搭建后，本规范按下述方式落地（**当前阶段不实施**，仅约定）：

- 设计令牌 → `src/theme/tokens.css`（CSS 自定义属性，亮暗两套）+ **Tailwind v4 CSS-first `@theme`** 映射（colors / spacing / fontFamily / fontSize 键名与 §2、§3 令牌一致）
- 纹理与阴影配方 → `src/theme/textures.css` / Tailwind utility 类（`halftone-bg`、`speed-lines`、`comic-border`、`comic-shadow`、`comic-shadow-red`、`comic-shadow-blue`、`comic-bubble`），亮暗两套
- 三款字体 → **@fontsource 自托管**（Anybody / Hanken Grotesk / Space Grotesk）+ 中文字体回退栈（§3.4）
- 组件 → `src/components/ui/`（Button、GameCard、Leaderboard、SpeechBubble、ProgressBar、**GameWindow 弹窗框架**…），组件内部只允许引用令牌与配方类
- 游戏级规范 → 游戏目录 `manifest.ts` 中声明 `theme` 字段（主色、背景、纹理开关等）与画布比例；游戏接入形态为弹窗（§15），窗口框架由网页级 `GameWindow` 提供，游戏画布由框架挂载
- 明暗主题 → `html.dark` class 策略，`tokens.css` 内亮暗两套变量覆盖

---

## 14. 决策记录（Decision Log）

| #   | 议题         | 决议                                                                                                                  | 状态            |
| --- | ------------ | --------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | 墨黑取值     | `#1C1B1B`（令牌/代码实际值）                                                                                          | ✅ 已定         |
| 2   | 暗色主题     | 由本规范生长（§2.5），与亮色共用令牌键名，仅值不同                                                                    | ✅ 已定         |
| 3   | 字体版权     | 无顾虑（非商用/仅学习研究），中文选用开源字体（§3.4）                                                                 | ✅ 已定         |
| 4   | 站名         | `minigamesallinone.binarynomad.io`；参考页文字内容一律忽略                                                            | ✅ 已定         |
| 5   | 游戏接入方式 | 网页弹窗运行：窗外/窗框遵循网页规范，窗内遵循游戏级规范（§15）                                                        | ✅ 已定         |
| 18  | 响应式       | 手机横竖屏到桌面全分辨率适配；GameWindow 横屏硬约束（§4.3）                                                           | ✅ 已定（主表） |
| 19  | 滚动动效     | 上下滑动加入入场动效：淡入+上移 24px，一次性，reduced-motion 直显（§9）                                               | ✅ 已定（主表） |
| 20  | 欢迎页       | 站名 + 出品方两行字标 + 简单动效，点击进入大厅（§8.10）                                                               | ✅ 已定（主表） |
| 21  | 暗色主题     | 现行严格令牌映射效果不佳，**暂停调整**；待用户提供新规范后按生长流程重做（教训：严格映射 ≠ 好暗色，需重新设计）       | ⏸ 待用户规范    |
| 22  | 字标内容     | 主标 `MINIGAMESALLINONE`（与域名连写一致，视觉拆行 MINIGAMES / ALLINONE）；出品方行 `by@BinaryNomad.io`（大小写保真） | ✅ 已定（主表） |
| 27  | 响应式优化   | 弹窗公式 dvh 化（回退 vh、负值失效回退全宽）；触控目标 ≥40px（窄窗宽度收窄例外）；游戏内窄窗容器查询紧凑布局（§4.3）  | ✅ 已定（主表） |

> 本表为决策主表（docs/process/README.md §8）的子集快照，以主表为准。

**遗留待定**：

- 暗色主题新规范（用户提供中，到达后按生长流程重做 §2.5）
- 游戏级视觉规范模板（是否需要我起草）

---

## 15. 游戏接入：弹窗运行模式（Game Window）

- **交互模式**：游戏不在独立路由全屏运行，而是在大厅之上以**弹窗**运行；同一时间只允许一个游戏窗口
- **分区规则**：
  - **窗外**（遮罩层 + 弹窗背后可见的大厅）= 网页级规范
  - **窗框**（窗口容器、标题栏、控制条、关闭按钮、边框阴影）= 网页级规范
  - **窗内**（游戏画面区域）= 游戏级规范，游戏自由发挥；建议复用令牌取色以保持和谐

### 窗口结构（自上而下）

1. **遮罩层**：`rgba(28,27,27,0.6)` 墨黑半透明 + 低透明速度线纹理；点击遮罩关闭（可配置）；暗色下加深至 `rgba(0,0,0,0.7)`
2. **窗口容器**：纸白卡片（暗色下为 `surface-container-low` 墨板层级）、**4px 墨线描边**（弹窗为最高层级，按 §6 用 4px；暗色下白墨线）、**6px 硬阴影**（墨黑，暗色下 `#0F0E0E`）、0 圆角；尺寸按 manifest 声明的画布比例自适应，最大 ≤ `90vw × 80vh`，画布 letterbox 居中
3. **标题栏**：游戏名（`headline-md` 大写斜体，双语取当前语言）+ 玩法说明按钮（点击弹出 §8.7 气泡）；可用红底白字标题条（同排行榜表头样式）
4. **游戏区**：唯一属于游戏级规范的区域；框架只提供挂载点与固定容器
5. **控制条**：当前分/最高分（`label-bold`）、暂停/继续、重新开始（§8.1 Icon 变体，40px 方形）、关闭（窗口右上角 40px 方形图标钮）。按钮随游戏阶段适配（ADR-0007、决策 #24）：`menu` 隐藏暂停与重开（游戏主菜单自带"开始游戏"），`playing/paused` 显示暂停/继续，`over` 隐藏暂停保留重开（"再来一局"）

### 行为与无障碍

- 动效：出现 ≤200ms（微放大 + 硬阴影同步），禁弹性动画；关闭即时
- 无障碍：`role="dialog"` + `aria-modal="true"`、焦点陷阱、ESC 关闭、关闭后焦点归还触发按钮
- 打开时锁定背景滚动（body scroll lock）；遮罩与窗口层级高于 Header（z-50）
- 语言：窗框所有文案（分数、暂停、说明按钮等）走网页级 i18n；窗内文案由游戏自管

---

## 附录 A · 设计令牌全表（亮色，源自 DESIGN.md）

```yaml
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5d3f3c'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#926f6b'
  outline-variant: '#e7bdb8'
  surface-tint: '#c00016'
  primary: '#bf0016'
  on-primary: '#ffffff'
  primary-container: '#e62429'
  on-primary-container: '#ffffff'
  inverse-primary: '#ffb4ac'
  secondary: '#005ab4'
  on-secondary: '#ffffff'
  secondary-container: '#0072e1'
  on-secondary-container: '#fefcff'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a900'
  on-tertiary-container: '#4c3f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#93000e'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aac7ff'
  on-secondary-fixed: '#001b3e'
  on-secondary-fixed-variant: '#00458d'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    {
      fontFamily: Anybody,
      fontSize: 72px,
      fontWeight: 900,
      lineHeight: 68px,
      letterSpacing: -0.04em,
    }
  headline-lg:
    {
      fontFamily: Anybody,
      fontSize: 40px,
      fontWeight: 800,
      lineHeight: 44px,
      letterSpacing: -0.02em,
    }
  headline-lg-mobile: { fontFamily: Anybody, fontSize: 32px, fontWeight: 800, lineHeight: 36px }
  headline-md: { fontFamily: Anybody, fontSize: 24px, fontWeight: 800, lineHeight: 28px }
  body-lg: { fontFamily: Hanken Grotesk, fontSize: 18px, fontWeight: 500, lineHeight: 28px }
  body-md: { fontFamily: Hanken Grotesk, fontSize: 16px, fontWeight: 400, lineHeight: 24px }
  label-bold: { fontFamily: Space Grotesk, fontSize: 14px, fontWeight: 700, lineHeight: 16px }
  label-sm: { fontFamily: Space Grotesk, fontSize: 12px, fontWeight: 500, lineHeight: 14px }
spacing:
  unit: 4px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-offset: 6px
```

## 附录 B · 核心 CSS 配方（源自 code.html，已核实）

```css
.halftone-bg {
  background-image: radial-gradient(circle, #dcd9d9 2px, transparent 2.5px);
  background-size: 10px 10px;
}
.speed-lines {
  background: repeating-linear-gradient(45deg, transparent 0 10px, #e5e2e1 10px 11px);
}
.comic-border {
  border: 4px solid #1c1b1b;
}
.comic-shadow {
  box-shadow: 6px 6px 0 0 rgba(28, 27, 27, 1);
}
.comic-shadow-red {
  box-shadow: 6px 6px 0 0 rgba(191, 0, 22, 1);
}
.comic-shadow-blue {
  box-shadow: 6px 6px 0 0 rgba(0, 90, 180, 1);
}
/* 按钮按压态 */
.active-press {
  transform: translate(1px, 1px);
  box-shadow: none;
}
```

**暗色覆盖（配合 `html.dark`，颜色全部令牌化后由变量接管）**：

```css
.dark .halftone-bg {
  background-image: radial-gradient(circle, #2a2929 2px, transparent 2.5px);
}
.dark .speed-lines {
  background: repeating-linear-gradient(45deg, transparent 0 10px, #201f1f 10px 11px);
}
.dark .comic-border {
  border-color: #e5e2e1;
} /* 白墨 */
.dark .comic-shadow {
  box-shadow: 6px 6px 0 0 rgba(15, 14, 14, 1);
}
.dark .comic-shadow-red {
  box-shadow: 6px 6px 0 0 rgba(191, 0, 22, 1);
} /* 品牌色不变 */
.dark .comic-shadow-blue {
  box-shadow: 6px 6px 0 0 rgba(0, 90, 180, 1);
} /* 品牌色不变 */
```

> 附注：实现中"分节线/单侧描边"通过只保留部分边的 4px 描边实现（如 `border-b-4 border-on-surface` + 其余边 0），实际工程中建议封装为 `comic-divider` 工具类，避免逐边覆盖。

## 附录 C · 暗色令牌全表（生长版，推导规则见 §2.5）

```yaml
colors:
  background: '#141313'
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0f0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2929'
  surface-container-highest: '#353434'
  surface-variant: '#353434'
  on-surface: '#e5e2e1'
  on-background: '#e5e2e1'
  on-surface-variant: '#d8c2bf'
  outline: '#a08c89'
  outline-variant: '#534342'
  primary: '#ffb4ac'
  on-primary: '#410003'
  primary-container: '#93000e'
  on-primary-container: '#ffdad6'
  secondary: '#aac7ff'
  on-secondary: '#001b3e'
  secondary-container: '#00458d'
  on-secondary-container: '#d6e3ff'
  tertiary: '#e9c400'
  on-tertiary: '#221b00'
  tertiary-container: '#544600'
  on-tertiary-container: '#ffe16d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  inverse-primary: '#bf0016'
```
