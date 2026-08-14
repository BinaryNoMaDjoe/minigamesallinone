# AGENTS.md — AI 协作手册

> 本文件是**任何 AI 会话**（主会话、子代理、未来的新会话）进入本仓库后的第一入口。
> **先完整阅读本文件，再阅读与任务相关的规范文档，然后才能动手。**
> 本文件本身受生长机制约束（docs/process/evolution.md），修订需提案并获用户确认。
>
> **版本**：v0.2 | **变更记录**：v0.1 初稿（2026-08-15）→ v0.2（2026-08-15，用户指令）新增红线 8（CI/自动部署默认禁止）与版权声明。

---

## 0. 项目是什么

- **名称**：minigamesallinone.binarynomad.io
- **定位**：多小游戏合集 Web——大厅集中展示与进入各小游戏，游戏以**弹窗**运行
- **技术**：Vite + React 19 + TypeScript（严格模式）+ Tailwind v4；纯本地数据（经 ScoreService 抽象，预留后端）；界面中英双语
- **当前阶段**：规范文档已建立；代码骨架待搭建
- **版权**：开发者 @BinaryNomadjoe；所有权归 BinaryNomad.io；**仅用于学习研究，禁止商用与传播**（详见根目录 LICENSE）

## 1. 硬性红线（违反即失败）

1. **杜绝幻觉与意淫**：一切事实必须有出处——仓库文档、用户明确指令，或**明确标注**的"推断/待确认"。禁止把猜测当事实写进代码、文档或回复。
2. **文档即真相源**：设计规范、流程规范、架构约定以 `docs/` 为准。代码与文档冲突时**以文档为准**回查；确需变更走生长流程（docs/process/evolution.md），禁止只改代码不改文档。
3. **设计令牌不得自造**：任何色值、字体、间距必须来自 `docs/design-language.md` 令牌表；需要新值 → 提案走确认，不得随手加色。
4. **未确认 = 待定**：用户未拍板的选项只能记为「待定/提案」，不得当作已决定执行。
5. **验证优先**：宣称"完成"前必须跑 `typecheck` 与 `build`（或等价验证）通过。禁止说"应该没问题"。
6. **范围纪律**：只做用户要求的事。新增文件/依赖/功能超出任务范围的，先问。
7. **提交纪律**：commit message 用**中文**、遵循 Conventional Commits、按逻辑拆分（docs/process/README.md §3）。
8. **CI/自动部署默认禁止**：不得主动搭建 CI 流水线或自动部署；仅在用户明确人工命令时才能进行（docs/process/README.md 决策记录 #16）。

## 2. 真相源链（文档地图）

| 文档 | 内容 | 地位 |
|---|---|---|
| `AGENTS.md` | 本手册 | 宪法级 |
| `docs/design-language.md` | 美术设计语言规范（Inked Kinetic，亮暗双主题） | 宪法级 |
| `docs/process/README.md` | 流程规范（git/commit/质量门/版本/决策主表） | 强制 |
| `docs/process/evolution.md` | 规范生长与迭代机制 | 强制 |
| `docs/architecture/README.md` | 架构约定、目录结构、分层依赖规则 | 强制 |
| `docs/architecture/adr/` | 架构决策记录（ADR） | 强制 |
| `docs/design-reference/` | 规范溯源素材 | 只读，禁止修改 |
| `skills/` | 可复用工作技能（按触发条件使用） | 按需 |
| `agents/` | 角色化代理定义（开子代理时套用） | 按需 |

## 3. 标准工作流

1. 读本文件 → 2. 读相关规范章节 → 3. 列出任务清单 → 4. 实施 → 5. 按对应 skill 的检查清单自检 → 6. 验证（typecheck/build）→ 7. 按规范拆分提交 → 8. 汇报（含验证结果与文档一致性说明）

## 4. 关键约定速查

- 游戏 = `src/games/<id>/`（manifest.ts + Game.tsx）；注册表自动汇总、懒加载；新增游戏按 `skills/skill-add-game.md`
- 游戏**弹窗运行**：窗外/窗框网页规范，窗内游戏规范（design-language.md §15、ADR-0002）
- 双语：公共文案 `src/i18n/`，游戏元数据 manifest 双语；流程见 `skills/skill-i18n.md`
- 取色/纹理/组件：只允许引用 design-language.md 令牌与附录配方；流程见 `skills/skill-design-system.md`
- 数据：本地 localStorage，统一经 `ScoreService`，游戏不得直写（ADR-0005）
- 明暗：`html.dark` class 策略，默认跟随系统 + 手动开关；暗色规则见 design-language.md §2.5
- 依赖方向：theme ← ui ← pages ← games 单向（architecture/README.md §3）；游戏之间零 import

## 5. 何时停下询问

- 用户未给足信息、且该信息无法从仓库文档获得（如游戏玩法细节、包管理器选择）
- 需要修改宪法级文档（design-language.md、本文件、影响全仓库的 process 条款）
- 发现文档与实现冲突，且无法判断哪边正确
- 任务超出已确认范围

## 6. 禁止事项清单

- 禁止编造：游戏玩法、数值、用户偏好、色值、字体、依赖版本、API、统计数据
- 禁止未经确认修改 design-language.md、本文件、process/ 规范
- 禁止在代码中写死与令牌表不符的颜色/字号/间距
- 禁止跳过验证宣称完成
- 禁止把「待定」当「已定」执行
- 禁止游戏之间互相 import、游戏 import 壳层组件
- 禁止绕过 ScoreService 直写 localStorage
- 禁止无出处地输出"审查结论/数据/事实"
- 禁止未经用户命令搭建 CI / 自动部署 / 执行发布
