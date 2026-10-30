# 项目技能（.claude/skills）

Claude Code 会自动加载本目录下的技能，本地与云端会话都生效。全部为 Anthropic 公开技能的原样副本，各目录内附 Apache-2.0 许可证。

| 技能 | 用途 | 来源 |
|---|---|---|
| `frontend-design` | 视觉方向、字体与版式决策，避免模板化界面 | anthropics/skills → `skills/frontend-design` |
| `design-critique` | 对截图或页面做结构化设计评审 | anthropics/knowledge-work-plugins → `design/skills` |
| `design-system` | 审计令牌一致性、记录组件、扩展新模式 | 同上 |
| `accessibility-review` | WCAG 2.1 AA 对比度、键盘、读屏检查 | 同上 |
| `ux-copy` | 微文案、空状态、错误提示 | 同上 |
| `design-handoff` | 从设计稿生成开发交接规范 | 同上 |

`../CONNECTORS.md` 是 design 插件技能引用的占位符说明，一并保留。

`dataviz`（图表配色、坐标轴、提示框规范）随 Claude Code 2.1.x 内置，无需复制；改 Recharts 图表前先调用它。

若想安装完整的 design 插件（含 `/critique` 等斜杠命令与 Figma 连接器）：

```bash
claude plugin marketplace add anthropics/knowledge-work-plugins
claude plugin install design@knowledge-work-plugins
```
