---
日期: 2026-03-05T09:56:00
作者:
  - Austin
tags:
draft: false
---

# 安装
```
curl -fsSL https://claude.ai/install.sh | bash
```
或
```
npm install -g @anthropic-ai/claude-code
```
没有 node，需要安装一下

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

- **文件引用**：`@path/to/mamba_block.py 这个算子的复杂度是多少？`
    
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