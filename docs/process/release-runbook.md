# 发布与部署手册（Release Runbook）

> **版本**：v0.4
> **变更记录**：v0.1 初稿（2026-08-15，首发前建立，用户指令）→ v0.2 修正（2026-08-15，用户指令）：允许 Connect to Git 路径，但必须关闭自动部署 → v0.3 修正（2026-08-15，首发实操复盘，用户指令）：当前 Cloudflare 界面已无旧版 Pages（Connect to Git / Upload assets）入口，统一为 **Workers Builds（Git 集成）** 流程；关键教训——「Deploy command」是部署命令（wrangler），不是构建命令，填构建命令会导致只构建不上传（站点保持模板 Hello World）→ v0.4 修正（2026-08-15，首发实操复盘，用户指令）：wrangler 自动配置在非交互模式会生成缺 assets.directory 的坏配置导致部署失败——仓库必须提交 wrangler.jsonc（assets.directory=./dist），CI 的 wrangler deploy 直接读取它
> **性质**：操作性文档。纪律依据：docs/process/README.md §5（版本与发布）、决策 #16（CI/自动部署默认禁止）、决策 #17（版权声明）。Cloudflare 官方出处：[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)、[Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Wrangler 自动项目配置](https://developers.cloudflare.com/workers/framework-guides/automatic-configuration/)。

## 1. 铁律

1. **发布与部署默认禁止**，仅由用户人工命令发起（决策 #16）
2. **禁止自动部署**（决策 #16）：Workers Builds 默认推送即构建部署；上线后必须把 Deploy command 改为 `npx wrangler versions upload`（官方「关闭自动部署」方式：构建只生成版本，不 promote），上线 = 在 Dashboard 手动 promote 版本
3. 域名：minigamesallinone.binarynomad.io（决策 #4）；托管在子域根路径，Vite base 保持默认 /，无需改动
4. 版权：仅用于学习研究，禁止商用与传播（决策 #17）；站点 robots.txt 与 <meta name="robots"> 默认禁收录
5. 产物 = dist/（纯静态）；仓库已提交 wrangler.jsonc（assets.directory=./dist），CI 的 wrangler deploy 直接使用，不依赖自动识别；调整输出目录时必须同步修改 assets.directory
6. pnpm-workspace.yaml 必须保持「packages + onlyBuiltDependencies + allowBuilds」双键格式，兼容 Cloudflare 构建镜像的 pnpm 10 与本地 pnpm 11

## 2. 发布门（每次发布前，全部通过才可发布）

1. pnpm typecheck
2. pnpm build（含 tsc -b；构建警告必须为 0）
3. 冒烟测试（决策 #25，手动触发）：
   - node src/games/tetris/engine.test.ts
   - node src/games/lianliankan/engine.test.ts
4. pnpm preview 本地走查全链路

## 3. 版本动作

1. 手写整理 CHANGELOG.md（按 Conventional Commits 分组，中文）
2. git tag -a vX.Y.Z -m "发布 vX.Y.Z"（首版 v0.1.0）
3. git push 源码与标签到 GitHub（origin：BinaryNoMaDjoe/minigamesallinone）

## 4. 部署（Cloudflare Workers Builds · 当前界面）

### 首次上线

1. Workers & Pages → 创建 Worker（Git 集成）→ 连接仓库 BinaryNoMaDjoe/minigamesallinone
2. 项目 Settings → Builds：
   - **Build command**（构建命令）：`pnpm build`
   - **Deploy command**（部署命令，必填）：`npx wrangler deploy`
     - ⚠️ 该字段是部署命令而非构建命令；仓库已提交 wrangler.jsonc（assets.directory=./dist），wrangler deploy 直接读取它，不依赖自动识别
3. 手动触发一次构建（或 push 一个提交触发）→ 构建成功即上线（自定义域已绑定则直接生效）
4. **上线后立即**把 Deploy command 改为 `npx wrangler versions upload`——此后推送只生成版本不自动上线，符合决策 #16

### 绑定域名

- 项目 Settings → Domains & Routes → 添加 minigamesallinone.binarynomad.io（DNS 记录由 Cloudflare 自动创建并签发 HTTPS）

### 后续每次发布

1. 本地通过 §2 发布门 → §3 版本动作（push 触发构建生成版本）
2. Dashboard → 项目 → Versions → 手动 **Promote** 目标版本上线
3. 按 §5 验证；出问题把上一个版本重新 Promote 即回滚

## 5. 上线验证清单

- [ ] HTTPS 证书有效，无混合内容告警
- [ ] 欢迎页 → 大厅 → 各游戏弹窗（开始/暂停/重开/关闭/返回）全链路
- [ ] 最高分经 ScoreService 写入 localStorage 并回显（ADR-0005）
- [ ] 中英切换持久化；明暗主题跟随系统 + 手动开关（决策 #10）
- [ ] 移动端竖屏提示与横屏硬约束（决策 #18）
- [ ] /favicon.svg、/robots.txt、/og.png 可直访；社交卡片抓取正常（og:image 指向线上 URL）
- [ ] 浏览器控制台无报错；懒加载 chunk 正常加载
- [ ] 首页响应是 text/html 且包含 <div id="root">；任何路径都不再返回 Hello world

## 6. 回滚

- Dashboard → 项目 → Versions → 重新 Promote 上一个正常版本（秒级）
- 或本地 git checkout vX.Y.Z 重建后按 §4 重新部署

## 7. 故障速查（首发踩坑记录）

| 症状                                                                       | 原因                                                                       | 处理                                                                                                                         |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 构建日志 pnpm install 报 packages field missing or empty                   | pnpm-workspace.yaml 缺 packages 字段（Cloudflare 构建镜像用 pnpm 10 校验） | 已修复（双键配置），勿回退                                                                                                   |
| 全路径返回 Hello world（text/plain）                                       | Deploy command 填了构建命令，只构建未部署，Worker 仍是模板                 | Deploy command 改为 npx wrangler deploy 后重新构建                                                                           |
| 部署日志报 The assets property ... missing the required directory property | wrangler 非交互模式自动生成的配置缺 directory 字段                         | 仓库已提交 wrangler.jsonc（勿删）                                                                                            |
| 域名解析不存在 / 指向错误项目                                              | 域名未绑定到本项目                                                         | 项目 Settings → Domains & Routes 核对                                                                                        |
| 域名返回 525 SSL handshake failed                                          | DNS 记录存在但没有任何 Workers 域名绑定（绑定被删/未创建）                 | 添加绑定：项目 Settings → Domains & Routes；或 API PUT /accounts/:id/workers/domains（zone_id+hostname+service+environment） |
| robots.txt 出现 Cloudflare Managed content 段落                            | Cloudflare 边缘自动注入的托管内容                                          | 正常现象；本项目 User-agent: * Disallow: / 位于末尾仍生效                                                                    |
