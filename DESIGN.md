---
name: 合约交易复盘
description: 本地单用户的合约交易复盘工作台：青黑暗色、数字优先、层级只靠面色和细线
colors:
  canvas: "#0b1117"
  surface: "#111923"
  surface-2: "#172230"
  surface-3: "#1e2b3b"
  line: "#1c2735"
  line-strong: "#293647"
  ink: "#e4ebf3"
  ink-2: "#a7b4c3"
  ink-3: "#8290a0"
  accent: "#7db4ff"
  accent-ink: "#0b1117"
  profit: "#3fbf8f"
  loss: "#ef6b6b"
typography:
  figure:
    fontFamily: "IBM Plex Sans, -apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, Helvetica Neue, Arial, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0"
    fontFeature: "lnum pnum"
  figure-sm:
    fontFamily: "IBM Plex Sans, -apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, Helvetica Neue, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
    fontFeature: "lnum pnum"
  title:
    fontFamily: "IBM Plex Sans, -apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "24px"
  title-sm:
    fontFamily: "IBM Plex Sans, -apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  body:
    fontFamily: "IBM Plex Sans, -apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "IBM Plex Sans, -apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
  num:
    fontFamily: "IBM Plex Sans, -apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
    fontFeature: "tnum"
  label:
    fontFamily: "IBM Plex Sans, -apple-system, PingFang SC, Microsoft YaHei, Noto Sans SC, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0"
rounded:
  sm: "4px"
  md: "6px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  button-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  field:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 10px"
  segmented:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "2px"
  segmented-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  segmented-item-selected:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink}"
  nav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  nav-item-active:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "20px"
  table-row-hover:
    backgroundColor: "{colors.surface-2}"
  tag:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
---

# Design System: 合约交易复盘

## Overview

**Creative North Star: "复盘工作台"**

这是一张盘后复盘用的工作台，不是行情终端也不是营销页。整张界面是青黑色的桌面（canvas），上面摆着蓝灰色的面板（surface），数字是桌上最亮的东西。层级只靠面色深浅和 1px 细线表达，没有渐变、投影和光效；颜色只做两件事：盈亏（绿/红）和「当前选中/可点」（蓝）。

密度取「总览优先、低密度」：第一屏先回答本期赚没赚、风险怎样，细节放到二级视图（交易记录、分析页）；数据表格则密一些，行高 56px 以内，数字用表格数字对齐。界面默认中文，中文走系统字体，拉丁字母与数字用 IBM Plex Sans，整体气质参考 Binance 的克制。

**Key Characteristics:**
- 青黑底、蓝灰面板、一个蓝色强调色、一对盈亏色，再无其他色相。
- 大数字半粗比例数字，表格数字等宽对齐，不用等宽字体。
- 面板之间 16px 间距，面板内 20px 内边距，细线分区。
- 一种动效：120ms 的颜色过渡，加载用呼吸占位块，导航用 2px 进度条。
- 控件都是标准 web 控件（按钮、分段、下拉、输入框、链接），没有自造交互。

## Colors

青黑的底、一级蓝灰面板、一个浅蓝强调、一对盈亏色，所有颜色都带同一点青。

### Primary
- **浅天蓝 / accent** (#7db4ff)：当前选中的导航点、主按钮底色、链接悬停下划线、焦点环（70% 透明度）、进度条。强调色的用量不超过屏幕的 5%，它只回答「现在在哪、能点哪」。
- **主按钮字色 / accent-ink** (#0b1117)：只用在强调色底上。

### Secondary
- **盈利绿 / profit** (#3fbf8f)：正盈亏数字、盈利曲线段、多单标记、胜率计量条。
- **亏损红 / loss** (#ef6b6b)：负盈亏数字、亏损曲线段、空单标记、删除按钮字色。
- 月历格子用 10% 盈亏色混入面板色做底（`color-mix`），保持不透明。

### Neutral
- **青黑桌面 / canvas** (#0b1117)：页面底色、侧栏与顶栏底色、输入框底色。
- **面板 / surface** (#111923)：所有 Panel 的底色、次级按钮底色。
- **面板二级 / surface-2** (#172230)：选中的导航项、表格行悬停与展开、标签底色、提示框。
- **面板三级 / surface-3** (#1e2b3b)：分段控件选中项、加载占位块、滚动条滑块。
- **细线 / line** (#1c2735)：面板内的分隔线、表格行线、月历格线。
- **强线 / line-strong** (#293647)：面板外框、按钮和输入框边框、侧栏与顶栏的分界线。
- **正文 / ink** (#e4ebf3)：标题、主要数字、正文。
- **次级文字 / ink-2** (#a7b4c3)：次要数字、按钮默认字色、未选中导航。
- **弱化文字 / ink-3** (#8290a0)：标签、单位、说明、资金费与手续费这类弱化列。

### Named Rules
**The Two Jobs Rule.** 颜色只表达盈亏和当前选中。任何装饰性的用色（图标染色、标题上色、彩色边框）都不允许。

**The Opaque Tint Rule.** 盈亏底色一律用 `color-mix` 混进面板色得到不透明色，不用半透明叠加，叠在一起时不会变色。

## Typography

**Display Font:** IBM Plex Sans（自托管，拉丁与数字，OFL）
**Body Font:** IBM Plex Sans + 系统中文字体（PingFang SC / Microsoft YaHei / Noto Sans SC）
**Label/Mono Font:** 无；不用等宽字体，表格数字靠 `tabular-nums` 对齐

**Character:** 克制、工整、偏工具感。IBM Plex Sans 的数字开阔清楚，0 不带点；中文交给系统字体，不追求品牌字。

### Hierarchy
- **Figure** (600, 36px, line-height 1)：总盈亏这一个大数字，带正负号和 $。比例数字（`pnum`）。
- **Figure-sm** (600, 20px, 28px)：统计格里的数值（胜率、盈亏比、回撤、笔数），月历的月度盈亏。
- **Title** (600, 15px, 24px)：面板标题、顶栏页面标题、侧栏应用名。
- **Title-sm** (600, 14px, 20px)：分析页紧凑面板标题。
- **Body** (400, 14px, 1.5)：正文、导航项。
- **Control** (500, 13px, 20px)：按钮、分段控件、下拉、输入框。
- **Num** (400, 13px, 20px, `tnum`)：表格数字、坐标轴刻度，用 `.ui-num`。
- **Label** (400, 12px, 16px, 不全大写、无字距)：标签、单位、说明、副标题。最小 11px 只用于表格里的辅助说明，10px 只出现在 K 线图内的买卖标记。

### Named Rules
**The No Eyebrow Rule.** 标题上方不放全大写小标签；标签文字不全大写、不加字距。

**The Tabular Rule.** 任何会上下对齐比较的数字（表格列、坐标轴、统计行）必须用 `.ui-num`；只有孤立的大数字用比例数字。

## Layout

固定侧栏 232px（导航 + 数据源）+ 顶栏 56px（标题、区间分段、语言、刷新）+ 可滚动主区。主区内边距 24px/20px，内容最大宽 1560px 居中；面板之间 16px（分析页 12px），面板内边距 20px，面板表头 14px 上下、细线分隔；统计格用细线分格（`gap-px` + line 色）。

响应式只按 Tailwind 的命名断点：`lg` 1024、`xl` 1280、`2xl` 1536。总览在 1440 以上双栏（品种 TOP10 / 本期结论），以下单栏；统计格 2 列 → 4 列；月历统计 2 → 4 → 7 列；交易表在 `lg` 以下横向滚动，最小宽 1040px。移动端不做专门适配，但不允许横向溢出页面。

间距用 4px 基数：4 / 8 / 12 / 16 / 20。组内紧（4–8px），组间松（16–20px）；标题上方的留白比下方多。

## Elevation & Depth

没有投影，没有渐变，没有模糊。深度全靠色阶：桌面 canvas → 面板 surface → 面板内选中/悬停 surface-2 → 分段选中与占位块 surface-3；外框用 line-strong，内部分隔用 line。曲线下方 14% 透明度的盈亏色填充是唯一的「面积」效果，用来表示曲线与零轴之间的区域。

### Named Rules
**The Flat Desk Rule.** 任何元素的「浮起」都通过换一级面色或加 1px 线表达，禁止 `box-shadow`、`backdrop-filter` 和渐变。

## Shapes

小圆角：按钮、输入框、面板、导航项 6px；分段控件内项、标签、占位块 4px；状态点和滚动条滑块 999px 全圆。边框一律 1px，没有彩色左边框，没有大于 1px 的描边。图表柱子只在数据端圆 4px（正值圆上角、负值圆下角），线宽 2px。

## Components

### Buttons
- **Shape:** 6px 圆角，高 32px，左右 12px 内边距，图标与文字间距 6px。
- **Default（`.ui-button`）:** surface 底、line-strong 边、ink-2 字；悬停 surface-2 底、ink 字。
- **Primary（`.ui-button-primary`）:** accent 底、accent-ink 字、无边框；悬停向白混 12%。
- **Disabled:** 40% 透明度 + `not-allowed`。
- **Focus:** 2px 强调色（70%）外环，偏移 2px；颜色过渡 120ms。
- **Danger:** 不做红底，只把字色换成 loss（删除按钮）。

### Segmented（`.ui-segmented`）
- **Style:** surface 底、line-strong 边、6px 圆角、2px 内边距；项 4px 圆角、13px/500。
- **State:** 选中项 surface-3 底、ink 字（`aria-pressed="true"`）；未选中 ink-2，悬停 ink。

### Chips / Tags
- **Style:** surface-2 底、ink-2 字、12px、4px 圆角、2px 6px 内边距；多/空方向标记用 14% 盈亏色底 + 盈亏色字。

### Cards / Containers（`Panel`）
- **Corner Style:** 6px。
- **Background:** surface，外框 line-strong 1px。
- **Shadow Strategy:** 无（见 Elevation & Depth）。
- **Header:** `PanelHeader` 标题 15px/600 + 副标题 13px ink-3，下沿 line 细线；紧凑版 14px/600 + 12px。
- **Internal Padding:** 20px；紧凑版 16px/10px。
- **Empty:** `EmptyState` 居中 13px ink-3 一句话，不放插画。

### Inputs / Fields（`.ui-field` / `.ui-select`）
- **Style:** canvas 底、line-strong 边、6px 圆角、高 32px、13px 字；占位文字 ink-3。
- **Focus:** 边框变 accent，不另加外环。
- **Select:** 去掉系统外观，右侧 12px 的 ink-3 色小箭头；选项列表 surface 底。
- **Date / Month:** 原生控件，`color-scheme: dark`，日历图标 55% 透明度、悬停 90%。
- **Disabled:** 50% 透明度。

### Navigation
- **Sidebar:** 232px，canvas 底，右侧 line-strong 分界；项高 36px、14px 字、18px 线性图标（1.6 描边）；当前页 surface-2 底、ink 字、图标 accent，其余 ink-2，悬停 surface 底。数据源列表同样式，前置 6px 圆点（选中 accent，未选 line-strong），右侧 12px 交易数。
- **Top bar:** 56px，canvas 底、下沿 line-strong；左侧 h1 + 区间分段 + 12px 区间日期，右侧语言分段 + 刷新按钮。导航等待时下沿出现 2px accent 进度条。

### Tables（`TradeRow`）
- **Style:** CSS grid 固定列，表头 12px ink-3，行 `.ui-row` 下沿 line 细线，悬停与展开 surface-2。
- **Alignment:** 交易对左对齐；类型/时间/持仓时间居中；资金费/手续费/盈亏/盈亏率右对齐。资金费与手续费 ink-3 弱化，已实现盈亏与盈亏率加粗盈亏色。

### Charts（Recharts）
- 线 2px、面积填充 14%、网格实线 line 色、刻度 12px ink-3 `tnum`、柱宽 ≤ 24px、数据端 4px 圆角；提示框 surface-2 底、line-strong 边、6px 圆角。只画真实行情，没有数据显示一句「无真实行情」。

### Loading / Progress
- **Skeleton（`.ui-skeleton`）:** surface-3 色块，1.4s 透明度呼吸；用于流式返回的余额等局部位置。
- **Progress（`.ui-progress`）:** 顶栏下沿 2px accent 滑块，1s 循环；`prefers-reduced-motion` 时变成静态整条。
- 不用转圈，不用全屏遮罩。

## Do's and Don'ts

### Do:
- **Do** 用 `--ui-*` 令牌和 Tailwind 色名（`bg-surface`、`text-ink-2`、`text-profit`），不写裸色值。
- **Do** 给所有会对齐比较的数字加 `.ui-num`，大数字用 `.ui-figure`。
- **Do** 用标准 web 控件和 `.ui-button` / `.ui-field` / `.ui-select` / `.ui-segmented` 这几套现成样式。
- **Do** 数据取不到就显示 `--`，图表取不到行情就显示「无真实行情」。
- **Do** 颜色过渡 120ms，`prefers-reduced-motion` 下归零。

### Don't:
- **Don't** 用渐变、投影、模糊、光效，或大于 1px 的彩色边框。
- **Don't** 画模拟或随机行情；图表只用真实交易所数据。
- **Don't** 用等宽字体，也不用 0 中间带点的字形。
- **Don't** 加轴标题、重复金额、「无交易」占位这类冗余文字。
- **Don't** 全大写标签、字距、标题上方的小眉题。
- **Don't** 给颜色派第三个工作：除了盈亏和当前选中，其它都是中性色。
