# Skill：skill-add-game（新增一个小游戏）

> **版本**：v0.3
> **变更记录**：v0.1 初稿（2026-08-15）→ v0.2 生长（2026-08-15，用户确认，决策 #23）：步骤与检查清单纳入**游戏级规范 DESIGN.md**（随俄罗斯方块建立的模式）→ v0.3 生长（2026-08-15，用户指令，决策 #25）：纳入引擎纯逻辑抽取与冒烟测试

## 触发条件

用户要求新增/开发一个小游戏（"加个XX游戏"、"实现XX"）。

## 前置阅读（按序）

1. `AGENTS.md`（红线与工作流）
2. `docs/design-language.md` §15（弹窗运行模式与分区规则）
3. `docs/architecture/README.md` §3（分层依赖规则）
4. `src/games/` 现有实现与类型定义（`games/shared/` 类型、任一现有游戏目录的 `DESIGN.md` 范例）——**以代码为准**，不得凭空假设接口

## 核心纪律

- **玩法必须来自用户**：用户描述缺细节时，列出问题清单问用户；禁止自行脑补规则、数值、名称
- 未确认的设计点一律标注「待定」并汇报，不静默决策

## 步骤

1. 读前置材料；整理用户未交代的信息 → 问用户
2. 创建 `src/games/<game-id>/`（id 用 kebab-case，如 `snake`、`match-3`）
3. 写**游戏级规范 `DESIGN.md`**（决策 #23，参考 `tetris/DESIGN.md` 结构）：
   - 玩法规则逐条列出——**本文件即实现依据**；未实现项明确标注，禁止脑补
   - 布局、控件说明
   - 色板表：**每个色值给出出处**（网页令牌 / 本文件定义），禁止无出处色值
   - 数值表（速度、计分等）与无障碍、生命周期约定
4. 写 `manifest.ts`：
   - 双语 `name` / `description`（zh、en 都写，缺一不可）
   - `category`、`theme`（accent 色必须来自 design-language.md 令牌或用户确认值）
   - 画布比例、是否支持暂停/重开、控制方式说明
5. 写 `Game.tsx`，实现 `GameInstance` 接口（以 `games/shared` 类型定义为准）：挂载、启动、暂停、恢复、重启、销毁
6. 引擎逻辑抽为纯逻辑模块 `engine.ts`（无 DOM、可注入随机源），并写 `engine.test.ts` 冒烟测试（`node` 直跑，手动触发，决策 #25）：覆盖首块生成、计分、胜负路径
7. 若实现阶段状态机（menu/playing/paused/over，ADR-0007）：mount 后主动上报一次当前阶段（`onPhase`）
8. 分数/进度统一走 `ScoreService`，禁止游戏直写 localStorage
9. 注册表自动汇总，**不得手工改 registry.ts**；如需自定义入口信息，只改 manifest
10. 自测：`typecheck` + `build` + 冒烟测试；大厅打开游戏弹窗手动玩一遍
11. 按 `skill-code-review.md` 自检
12. 按规范拆分提交：`feat(games): 新增<游戏名>`（涉及文档更新时 docs 单独提交）

## 检查清单

- [ ] 游戏级 DESIGN.md 齐全（规则逐条、色板有出处、未实现项明确）
- [ ] 启动首帧即有可玩内容（首块/首目标生成，教训：曾漏 spawn 导致空棋盘）
- [ ] 计分路径不得触发壳层重挂载（教训：effect 依赖 score 曾销毁游戏实例）
- [ ] manifest 双语齐全（zh/en）
- [ ] theme 色值有出处（令牌/用户确认），无自造 hex
- [ ] 只 import 白名单：theme、i18n、services、games/shared；无对其他游戏/壳层/pages 的 import
- [ ] 分数走 ScoreService；无直写 localStorage
- [ ] 暂停/重启正常；销毁时 rAF/定时器/事件监听全部清理（防内存泄漏）
- [ ] 引擎冒烟测试通过（node 直跑，若已抽取 engine.ts）
- [ ] 亮色/暗色下均清晰可读
- [ ] 键盘可达、focus 可见（无障碍底线）
- [ ] typecheck + build 通过
- [ ] 提交信息符合规范（中文、feat(games) 作用域）

## 输出

实现 + 自检报告（清单勾选结果 + 验证命令结果 + 「待定」问题列表）。

## 红线

- 不得编造游戏设计
- 不得修改 `docs/design-language.md`、`AGENTS.md`、process 规范（可提提案）
- 不得改动大厅/弹窗壳层来迁就单个游戏（壳层需求走 ui 变更流程）
