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

下载好了，配置一下第三方 api 的信息，就可以使用了，工程目录在终端使用命令 `claude`

配置选项参考
[[ClaudeCode配置指南]]


# 使用
在使用 Claude Code 时，它是支持**多会话并行**的
以下是关于开启多对话的操作方法及高效使用技巧：
### 1. 开启多对话的方法
Claude Code 的会话（Session）是基于终端窗口的。
- **并行会话**：你可以直接在 Ubuntu 中打开**多个终端标签页或窗口**，在每个窗口中分别输入 `claude`。
    
    - **独立性**：每个窗口都是一个独立的 Context（上下文）。例如，你可以让窗口 A 专门运行 `@Coder` 写代码，窗口 B 运行 `@Researcher` 读论文。
        
    - **共享配置**：虽然会话独立，但它们共享 `~/.claude` 下的配置、API Key 和你自定义的 Agent。
        
- **持久化会话**：如果你使用 `tmux` 或 `screen`，即使关闭终端，Claude Code 的会话也会在后台保持运行。

---
### 2. Claude Code 高效使用技巧
为了帮你发表高标准的 3D 点云论文并控制成本，建议掌握以下高级技巧：
#### **A. 巧用 `/compact` 节省 Token**

由于你的研究涉及长篇学术论文和复杂代码，上下文（Context）会迅速堆积。
- **技巧**：每当完成一个阶段性任务（如调研结束），输入 `/compact`。
- **效果**：它会总结之前的对话并清除冗余的 Token 占用，防止后续对话变得昂贵且响应变慢。
#### **B. 善用指令参数启动**
不要每次都进交互界面再切换，直接在启动时指定任务：
- **快速模式**：`claude --model haiku`（直接用最便宜的模型启动，适合 `@Project-Lead` 调度）。
- **只读模式**：如果你担心 Agent 乱改你的 HybridMamba 核心代码，可以用 `claude --read-only` 启动。
#### **C. 结合 `@` 机制进行“跨智能体”引用**
在对话中，你可以通过 `@` 符号直接提及你的 Agent 或文件：
- **文件引用**：`@path/to/mamba_block.py 这个算子的复杂度是多少？
- **Agent 协作**：`@Project-Lead，请让 @Researcher 总结一下这篇 PDF 的创新点`。
#### **D. 使用 `/review` 进行学术代码审计**
针对 3D 点云这种对维度极其敏感的任务：
- **技巧**：写完算子后，输入 `/review`。
- **针对性**：要求它专门检查 Tensor 的维度变化是否符合 Mamba 的状态空间方程。
#### **E. 快捷键与 Shell 集成**
- **中断输出**：如果发现 Agent 开始产生大量无用的代码垃圾，立即按 `Ctrl+C` 停止。
- **管道操作**：你可以把其他命令的结果传给 Claude。例如：`cat experiment_logs.txt | claude "总结这些训练指标"`。

---
### 3. 针对你的团队配置建议

既然你已经安装了 `ccswitch`，你可以结合多窗口这样玩：

- **窗口 1**：`ccswitch use haiku` -> 运行 **@Project-Lead**（常驻，负责全局把控）。
- **窗口 2**：`ccswitch use sonnet` -> 运行 **@Coder**（负责调试代码）。
- **窗口 3**：`ccswitch use opus` -> 运行 **@Paper-Architect**（专门撰写 Methodology 章节）。
**你需要我为你演示一个如何通过 `tmux` 管理这四个并行 Agent 窗口的脚本吗？**