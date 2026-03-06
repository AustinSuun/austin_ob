---
日期: 2026-03-05
作者:
  - Austin
tags:
  - ClaudeCode
  - AI工具
draft: false
---

Claude Code 是 Anthropic 推出的命令行 AI 编程助手。本指南涵盖了从安装到深度配置及实战技巧的全过程（已适配 Linux 与 Windows 系统）。

## 1. 安装指南

### 官方安装命令
- **Linux (推荐)**:
  ```bash
  curl -fsSL https://claude.ai/install.sh | bash
  ```
- **Windows (推荐)**: 在 PowerShell 中运行：
  ```powershell
  irm https://claude.ai/install.ps1 | iex
  ```
- **Node.js (替代方案)**: 需 v18+：
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```

### 验证安装
```bash
claude --version
```

---

## 2. 配置第三方 API (如 codeflow.asia)

```
https://codeflow.asia/register?aff=rPGm
```

如果你需要使用第三方中转服务，请按照以下步骤手动配置：

### ① 配置文件 settings.json
在相应路径新建或编辑 `settings.json`：
- **Linux**: `~/.claude/settings.json`
- **Windows**: `C:\Users\<用户名>\.claude\settings.json`

内容如下：
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://codeflow.asia",
    "ANTHROPIC_AUTH_TOKEN": "您的密钥(sk-...)"
  }
}
```

### ② 绕过初始化 (.claude.json)
在用户目录下找到 `.claude.json`，在 `userID` 字段下方添加：
```json
"hasCompletedOnboarding": true,
```
- **Linux 路径**: `~/.claude.json`
- **Windows 路径**: `C:\Users\<用户名>\.claude.json`

---

## 3. 增强工具：cc-switch (推荐)

如果你需要在官方 API 与不同中转商之间快速切换，推荐使用 **cc-switch**。它能自动完成上述配置文件修改。

- **GitHub**: [farion1231/cc-switch](https://github.com/farion1231/cc-switch)
- **下载**: 前往 [Releases](https://github.com/farion1231/cc-switch/releases) 页面下载 Windows 的 `.exe` 或 Linux 的 `.AppImage`。

---

## 4. 高效使用技巧

### 多会话并行操作
Claude Code 支持基于终端窗口的并行会话：
- **并行会话**：在不同终端标签页输入 `claude` 即可开启独立上下文。
- **持久化**：在 Linux 中结合 `tmux` 使用，即使关闭终端，会话也会在后台保持。

### 核心指令与参数
- **`/compact`**：总结对话并清除冗余 Token，降低成本并提高响应速度。
- **启动参数**：
  - `claude --model haiku`：使用低成本模型启动。
  - `claude --read-only`：只读模式，防止 AI 修改代码。
- **学术审计**：针对 3D 点云等复杂任务，写完算子后使用 `/review`，要求其检查 Tensor 维度变化。
- **跨 Agent 引用**：使用 `@path/to/file` 引用文件，或通过 `@AgentName` 进行协作。

---

## 5. 团队与研究场景建议
结合多窗口运行不同模型以平衡成本与性能：
- **窗口 1 (Haiku)**：运行 `@Project-Lead` 负责全局把控。
- **窗口 2 (Sonnet)**：运行 `@Coder` 负责调试代码。
- **窗口 3 (Opus)**：运行 `@Paper-Architect` 专门撰写论文章节。
