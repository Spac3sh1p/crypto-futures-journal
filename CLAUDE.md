@AGENTS.md

## 来自 Codex 会话的历史上下文（2026-10-30）

> 提炼自 Codex 主会话 14 个、子代理会话 36 个，2026-05-11 ~ 2026-09-05，只取用户消息与助手最终回复。历史是线索，不是当前状态证据：动手前先核对文件与 git 状态。原始记录在 `C:\Users\admin\.codex\sessions`（只读，勿改）。

### 项目目标
- 本地单用户的加密货币合约交易复盘网页：Next.js 16.2.6 + Prisma 7/SQLite（根目录 `dev.db`）+ ccxt + Recharts 3，用只读 API key 同步 Binance/Bybit/Hyperliquid 交易，做统计与 K 线复盘。最初由 Claude Code 开发，2026-05 至 09 由 Codex 维护；目前自用，用户提过以后想公开给别人用。
- 主要路由：`/dashboard/performance`（总览；`?view=trades` 为完整交易表，`&range=all&tradeId=` 定位并展开单笔）、`/dashboard/analytics`、`/dashboard/calendar`（月度复盘）、`/dashboard/settings`（交易所增删 + Sync）；接口 `/api/exchanges/[id]/sync`、`/api/market/klines`。
### 关键决策及理由
- 一笔“交易”按仓位算（同一合约从开仓到归零），不按 fill 或订单算：用户明确指出分批平仓被拆成多笔是错的。Binance 在 `src/lib/exchange/binance.ts` 聚合成交，Bybit 在 `bybit.ts` 用 close-pnl 仓位历史。
- 盈亏对齐币安口径：净盈亏 = `REALIZED_PNL + COMMISSION + FUNDING_FEE`，在查询/展示层换算，不改写库里的交易记录（流水归属逻辑在 `src/lib/dashboard/trade-accounting.ts`）。
- 收益率 = 交易收益 / 净入金（`AccountFlow` 表存 Binance income 流水，充值和划转不算收益）；没有流水时显示 `--`，不假定本金。
- Size 列显示 U 本位仓位面值（entryPrice × entryQty），不是币数量；资金曲线先按天汇总再累计，收益率放在累计曲线右轴，不加轴标题。
- MFE/MAE 按相对开仓价的百分比显示（价格放 hover），只用实际持仓区间计算。K 线复盘是折线 + 持仓区间底色 + B/S 标记，窗口自动前后扩展（短交易前后至少各 30 分钟，见 `src/lib/market/klines.ts`）。
- 夏普比 = 日收益率均值 / 标准差 × √365（无风险利率取 0，日收益 = 当日交易 PnL / 净入金，样本不足或波动为 0 时显示 `--`）；TOP10 收益率 = 品种净盈亏 / 品种总开仓价值。
- 余额卡（替换了“今日盈亏”）实时读交易所 USDT 余额，不落库。左侧“数据源”用 `exchangeId` URL 参数切换交易所，各页之间保留该参数。
- 鉴权与加密：API 路由走 `src/lib/auth.ts` 的 `requireAuth()`（HMAC 会话 cookie），apiSecret 用 AES-256-GCM 加密（`src/lib/crypto.ts`，`ENCRYPTION_KEY`，其余变量名见 `.env.local.example`）。生产环境缺变量时 fail closed，开发环境缺 key 会退回 `plain:` 明文存储。
- 界面默认中文，顶栏有“中/EN”切换（`src/lib/i18n.ts`）。字体本地自托管 MiSans（界面）+ JetBrains Mono（数字），用 `@font-face` 写、不依赖 Google Fonts（以前没网时 build 会失败）；MiSans 要求署名，见 `src/app/fonts/MiSans-README.md`。
- 视觉走“复盘工作台”式高级暗色，不要 cyberpunk 光效。总览优先、低密度，细节放二级视图，Mini K 线留在交易行展开里；用户主要用 PC，移动端优先级低。
- 交易表对齐：交易对左对齐，类型/时间/持仓时间居中，资金费/手续费/盈亏/盈亏率右对齐，时间只显示到分钟。资金费和手续费字色弱化，已实现盈亏和盈亏率加粗突出。
- 月度复盘只用月份选择器，不做最佳/最差周；“最佳一笔/最差一笔”可点击跳到对应交易；没有交易的日期留白。
- 2026-06-06 按用户要求取消 V1–V4 版本区分，合并成单一主线。
- `package.json` 的 overrides 把 `ws` 固定在 8.20.1；不要跑 `npm audit fix --force`（npm 给的方案是降级 Next/Prisma）。
- 验证：`npm.cmd test`（Vitest）、`npm.cmd run lint`、`npx.cmd tsc --noEmit`、`npm.cmd run build`。UI 改动再跑 `npm.cmd run visual:check -- http://localhost:3000/dashboard/performance`（Playwright，需先起 dev server，截图写到 `output/playwright/`）；改 schema 时跑 `npx.cmd prisma migrate status`。
### 踩过的坑与修复
- Binance `fetchMyTrades` 必须带 symbol（传 undefined 会报 `reading 'linear'`）→ 先从 income 历史找出有活动的合约再逐个拉；income 回填按 89 天分段。
- 增量同步只从 `lastSync` 开始拉，会把“开仓在上次同步前、平仓在之后”的仓位导成方向错误、持仓 0 秒的假交易 → Binance 回看 90 天成交重建仓位，Bybit 用 execution 修正开仓时间；`lastSync` 只在完全成功时推进。
- Bybit execution 查询跨度不能超过 7 天（retCode 10001）→ 按 7 天分段，并按 execution id 去重。close-pnl 不带手续费，要从 execution 汇总；Bybit K 线要单独接它的公共接口（返回倒序）。
- 同步接口曾在 partial/error 时仍返回 `success: true`，设置页因此误报成功 → 已改为返回 `success:false` 并带上 status/errors。
- 交易表有两套组件：总览“最近交易”用 `src/components/overview/OverviewRecentTrades.tsx`，`?view=trades` 用 `src/components/dashboard/TradeHistoryTable.tsx`；改列或样式要两处一起改。
- ccxt 打包报 protobufjs 错 → `next.config.ts` 加 `serverExternalPackages: ["ccxt"]`；lint 扫到 Prisma 生成代码 → eslint 忽略 `src/generated/prisma/**`（2026-05 初建时）。
- Recharts `ResponsiveContainer height="100%"` 在 SSR 时报 width/height -1 → 改成固定数值高度（`OverviewCurveChart.tsx`，有 `tests/recharts-container.test.tsx` 覆盖）。
- “资金费率”列实际显示的是 fundingFee 金额，不是费率百分比；要显示费率得另定口径。
- 命令用 `npm.cmd`/`npx.cmd`（本机 PowerShell 执行策略会拦 .ps1 shim，Codex 会话一直这么用）。Bitdefender ATD 会直接拦 `-EncodedCommand`、`-ExecutionPolicy Bypass` 和大段 `powershell -Command` 写文件这类命令；给 powershell.exe 加白名单风险高，之前已建议不要这么做。
### 当前状态与未完成项（截至 2026-09-05）
- 最后一次会话按评审做完第 1、2 优先级：统一统计口径，修复流水重复归账和 Binance 双向持仓/反手导入，调整 PC 指标布局、筛选和跨页定位。116 项测试 + tsc/lint/build + 桌面验收通过，但没有 commit、没跑真实同步；历史交易没有重算，需要另外核对。
- 交接文档在 `PRIORITY_1_2_HANDOFF.md`，评审报告在 `output/playwright/audit-20260904/项目评审.md`。远端只剩 `master`（停在 2026-06-07 的 `675678d`），之后的本地改动（包括 06-19 的 Recharts 修复）都没提交；当前 git 状态未验证。
- 评审的第 3 优先级没做：待复盘列表、策略/失误分类等（09-05 已补部分月历/分析跳转，细节以 HANDOFF 为准）。“本期结论”仍是静态占位，规则引擎要先和用户讨论（此前方案是先用可测试的规则引擎；接外部 AI 润色涉及隐私，不能默认做）。
- 安全遗留（2026-06-08 Codex Security）：dashboard 页面不经 `requireAuth()` 直接读库，未登录也能看数据；`.env` 没有 `ENCRYPTION_KEY`，库里的 apiSecret 是 `plain:` 明文；dev server 监听全部网卡。
  - 2026-10-30 已在分支 `fix/dashboard-auth-and-secrets` 修复：`dashboard/layout.tsx` 统一调 `isAuthenticated()` 未登录跳 `/login`（新增登录页 `src/app/login` + `components/auth/LoginForm.tsx`）；`.env` 补了 `APP_PASSWORD`/`AUTH_SECRET`/`ENCRYPTION_KEY`，并用 `scripts/reencrypt-secrets.ts` 把 2 条 apiSecret 重新加密为 `enc:`（之后 VACUUM 清掉了旧页）；`npm run dev` 改为 `-H 127.0.0.1`。注意 `isAuthenticated()` 在开发模式下若 `APP_PASSWORD`/`AUTH_SECRET` 缺失仍会放行，所以 `.env` 里这两项不能删。交易所 key 是否轮换由用户决定，未做。
- 总览每次渲染都实时请求余额（每个交易所 4 秒超时），可能拖慢页面；曾建议加缓存，是否已改未验证。
- 登录自启动：Windows 启动文件夹里的 `Crypto Futures Journal Dev.vbs` 调 `scripts/start-hidden-dev.ps1`，隐藏运行 `npm run dev`（端口 3000，`.next-dev.pid` 防重复启动，日志 `persistent-dev*.log`）。2026-06-04 遇到过 pid 文件指向残留进程的情况，没处理。
- GitHub 仓库截至 2026-07-20 仍为私有：用户想公开，Codex 平台拒绝执行。当时扫了全部提交历史，没发现密钥（本机没装 Gitleaks/TruffleHog）。
- Hyperliquid 同步从没用真实账户验证过，可能还是 fill 级导入。顶栏“刷新”最初只做 `router.refresh()`（拉交易所数据要去 Settings 点 Sync），之后是否改过未验证。
### 禁止事项
- 不准画模拟或随机行情（用户指出过 K 线是“乱画的”）。图表只用真实交易所数据，取不到就显示“无真实行情”。
- 删除、重导入、修正交易记录或回拨 `lastSync` 之前，先征得用户确认并备份 `dev.db`（命名 `dev.db.<原因>-<时间>.bak`，已在 .gitignore 里）；注意删除交易所会级联删除它的 trades 和 SyncLog。
- 不提交 `.env`、`dev.db` 及其备份、日志、`output/`、`_demo/`（忽略目录，现在放的是与项目无关的 Codex 线程恢复脚本）、`.next`、`node_modules`。
- 较大的 UI 改动先做预览（风格类改动给几种 demo 让用户挑），并保留能并排对比的原版，用户确认后才替换正式页面；用户说"放大"指容器尺寸不变、放大内部元素。2026-06-03 用户表示暂不大改 UI，要改先讨论、再定计划、最后执行。
- 不加冗余文字（轴标题、重复金额、“无交易”占位之类），用户为此明确表达过不满。
