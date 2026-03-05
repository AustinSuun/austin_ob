---
日期: 2026-03-05T18:48:00
作者:
  - Austin
tags:
  - ClaudeCode
draft: false
---

Claude Code 是 Anthropic 推出的命令行 AI 编程助手。目前官方推荐使用原生安装脚本。

## 1. 安装命令

### Linux & macOS (推荐)
使用官方一键安装脚本：
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows (推荐)
在 PowerShell 中运行：
```powershell
irm https://claude.ai/install.ps1 | iex
```

### Node.js (替代方案)
如果你已经安装了 Node.js (v18+)，也可以通过 npm 安装（但不推荐作为首选）：
```bash
npm install -g @anthropic-ai/claude-code
```

---

## 2. 验证安装
安装完成后，在终端运行以下命令检查是否成功：
```bash
claude --version
```


---

## 5. 增强工具：cc-switch (推荐)
如果你需要在官方 API、第三方中转 (如 codeflow) 或不同模型 (DeepSeek/Gemini) 之间快速切换，推荐使用 **cc-switch**。

### 简介
cc-switch 是一个跨平台的 GUI/CLI 工具，用于管理 Claude Code 的配置：
- **多供应商切换**: 一键切换官方 API 与第三方 API 中转（如 codeflow）。
- **自动化配置**: 自动修改 `settings.json` 和 `.claude.json`。
- **跨平台支持**: 提供 Windows、macOS 和 Linux 客户端。

### 安装与下载
- **GitHub 主页**: [farion1231/cc-switch](https://github.com/farion1231/cc-switch)
- **macOS (Homebrew)**: 
  ```bash
  brew tap farion1231/ccswitch && brew install --cask cc-switch
  ```
- **Windows / Linux**: 前往 [Releases](https://github.com/farion1231/cc-switch/releases) 下载 `.exe` 或 `.AppImage`。

使用中转 api配置参考一下连接

[[ClaudeCode配置指南]]