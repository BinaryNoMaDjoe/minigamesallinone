# 架构约定（Architecture）

> **版本**：v0.2
> **变更记录**：v0.1 初稿（2026-08-15，初始化阶段，对应 ADR-0001 ~ ADR-0006）→ v0.2 生长（2026-08-15，用户确认，决策 #23）：目录结构纳入游戏级 DESIGN.md；示例游戏移除

## 1. 架构原则

1. **游戏零耦合**：游戏之间禁止互相 import；新增游戏不触碰任何现有文件（注册表自动汇总）
2. **分层单向依赖**：依赖只能向下，不能向上、不能跨层（见 §3）
3. **壳层稳定**：大厅/弹窗壳层与具体游戏解耦，不因单个游戏改壳层接口
4. **服务可替换**：本地实现藏在接口后（ScoreService），未来接后端时游戏零改动
5. **规范即代码**：设计令牌、纹理配方以代码落地，与 design-language.md 键名一一对应

## 2. 目录结构（规划，脚手架阶段落地）

```
minigamesallinone/
├── AGENTS.md                  # AI 协作手册（所有 AI 会话第一入口）
├── docs/
│   ├── design-language.md     # 美术设计语言规范（宪法级，v0.2）
│   ├── design-reference/      # 规范溯源素材（只读，禁止修改）
│   ├── process/               # 流程规范 + 生长机制
│   └── architecture/          # 本目录 + ADR
├── skills/                    # 可复用工作技能（AI 按触发条件使用）
├── agents/                    # 角色化代理定义（开子代理时套用）
├── src/
│   ├── theme/                 # 设计令牌 tokens.css（亮暗两套）+ 纹理配方 + Tailwind @theme
│   ├── i18n/                  # 双语文案表（zh/en 同步）
│   ├── services/              # ScoreService 等（localStorage 实现，接口可替换）
│   ├── components/ui/         # 公共 UI（Button / GameCard / GameWindow / SpeechBubble / Leaderboard / ProgressBar…）
│   ├── games/
│   │   ├── registry.ts        # 由 manifest 自动汇总，禁止手改
│   │   ├── shared/            # 游戏基础设施（GameInstance 类型、useGameLoop 等）
│   │   └── <game-id>/         # 每个游戏一个目录
│   │       ├── manifest.ts    # 元数据 + 双语 + 主题 + 画布比例（唯一契约）
│   │       ├── DESIGN.md      # 游戏级规范（规则逐条/色板出处/控件/未实现项，决策 #23）
│   │       └── Game.tsx       # 游戏本体
│   ├── pages/                 # 大厅等路由页面
│   └── App.tsx                # 入口
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 3. 分层依赖规则（违反 = 审查阻断级问题）

| 层           | 目录                | 允许 import                                            | 禁止 import              |
| ------------ | ------------------- | ------------------------------------------------------ | ------------------------ |
| 令牌/主题    | `src/theme`         | 无                                                     | 一切业务                 |
| 服务         | `src/services`      | 无（必要时 theme 类型）                                | games / pages / ui       |
| i18n         | `src/i18n`          | 无                                                     | 业务                     |
| 公共 UI      | `src/components/ui` | theme（必要时 i18n）                                   | games / pages / services |
| 游戏基础设施 | `src/games/shared`  | theme、i18n、services                                  | games/*、ui、pages       |
| 游戏         | `src/games/<id>`    | theme、i18n、services、games/shared                    | 其他游戏、ui、pages      |
| 页面（大厅） | `src/pages`         | ui、games（仅 registry/manifest 类型）、services、i18n | 无                       |
| 入口         | `src/App.tsx` 等    | 以上全部                                               | 无                       |

**要点**：游戏永远不依赖壳层；壳层通过接口消费游戏；`registry.ts` 由工具/约定自动生成，人工不得维护。

## 4. 关键机制速览

| 机制            | 说明                                                                                              | 出处                             |
| --------------- | ------------------------------------------------------------------------------------------------- | -------------------------------- |
| 游戏注册表      | `import.meta.glob` 汇总各游戏 manifest；大厅卡片墙、弹窗入口全由注册表驱动；`React.lazy` 按需加载 | ADR-0001                         |
| GameWindow 弹窗 | 游戏以弹窗运行；窗外/窗框网页规范，窗内游戏规范；单窗口互斥                                       | ADR-0002、design-language.md §15 |
| ScoreService    | 分数/最高分/最近游玩统一经接口写入；首版 localStorage 实现                                        | ADR-0005                         |
| 设计令牌        | `tokens.css` 亮暗两套 CSS 变量 + Tailwind v4 `@theme`；键名与 design-language.md 附录一致         | ADR-0003                         |
| i18n            | typed key 文案表 + localStorage 语言记忆；游戏元数据 manifest 双语                                | ADR-0004                         |

## 5. 边界与待定

- 包管理器待定（pnpm 推荐），见 process/README.md §8 遗留待定 #1
- 首版无自动化测试与 CI（决策记录 #12）
- 示例占位游戏已完成验证使命并移除（决策 #11/#23）；注册表/弹窗/计分链路由首个正式游戏（俄罗斯方块）持续验证
