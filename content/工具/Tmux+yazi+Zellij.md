---
Date: 2025-11-16T13:36:00
作者:
  - Austin Suun
tags:
链接:
---

> [!NOTE] 简要介绍
>  在服务器使用 yazi 和tmux

**ToDo**

- [ ] Tmux 和 yazi 的安装，使用

--- 

`tmux` 是一个强大的终端复用工具，可以让你在一个终端窗口内运行多个会话，并且支持分屏、窗口切换、会话管理等功能。下面是一些常见的 `tmux` 命令和用法：

### 1. **启动和管理 tmux 会话**

- 启动一个新的 tmux 会话：
    
    ```bash
    tmux
    ```
    
- 启动一个新的命名会话：
    
    ```bash
    tmux new-session -s session_name
    ```
    
- 列出所有 tmux 会话：
    
    ```bash
    tmux list-sessions
    ```
    
- 重新连接到一个会话：
    
    ```bash
    tmux attach-session -t session_name
    ```
    
- 分离当前会话（从 tmux 会话中退出，但会话仍在后台运行）：  
    按下 `Ctrl + b`，然后按下 `d` 键（`Ctrl + b` 是 tmux 的默认前缀键）。
    
- 关闭会话：  
    在会话内输入：
    
    ```bash
    exit
    ```
    
    或者按 `Ctrl + b`，然后按 `:` 键，输入 `kill-session`。
    

### 2. **窗口管理**

- 创建一个新窗口：  
    按下 `Ctrl + b`，然后按 `c`。
    
- 切换到下一个窗口：  
    按下 `Ctrl + b`，然后按 `n`。
    
- 切换到上一个窗口：  
    按下 `Ctrl + b`，然后按 `p`。
    
- 切换到指定窗口（窗口编号从 0 开始）：  
    按下 `Ctrl + b`，然后按窗口编号（例如，按 `0`）。
    
- 关闭当前窗口：  
    在窗口内输入 `exit`，或者按下 `Ctrl + b`，然后按 `&`。
    

### 3. **窗格管理（分屏）**

- 水平分屏（上下分割）：  
    按下 `Ctrl + b`，然后按 `%`。
    
- 垂直分屏（左右分割）：  
    按下 `Ctrl + b`，然后按 `"`。
    
- 切换到下一个窗格：  
    按下 `Ctrl + b`，然后按 `o`。
    
- 切换到上一个窗格：  
    按下 `Ctrl + b`，然后按 `;`。
    
- 调整窗格大小：  
    按下 `Ctrl + b`，然后按住 `Ctrl` 和箭头键（上下左右）。
    
- 关闭当前窗格：  
    按下 `Ctrl + b`，然后按 `x`。
    
- 将窗格移动到新窗口：  
    按下 `Ctrl + b`，然后按 `!`。
    

### 4. **复制模式**

- 进入复制模式：  
    按下 `Ctrl + b`，然后按 `[`。
    
- 在复制模式中向上/向下滚动：  
    使用箭头键。
    
- 进入选择模式并开始选择文本：  
    按下空格键。
    
- 复制文本：  
    按下 `Enter` 键。
    
- 退出复制模式：  
    按下 `q` 键。
    

### 5. **分离和重新连接**

- 分离当前会话：  
    按下 `Ctrl + b`，然后按 `d`。
    
- 重新连接到一个会话：
    
    ```bash
    tmux attach-session -t session_name
    ```
    

### 6. **会话和窗格的其他常用命令**

- 分离并自动重新连接到最近的会话：
    
    ```bash
    tmux attach
    ```
    
- 删除所有会话：
    
    ```bash
    tmux kill-server
    ```
    
- 在当前会话中列出所有窗格：
    
    ```bash
    tmux list-panes
    ```
    
- 在当前会话中关闭所有窗格：
    
    ```bash
    tmux kill-window
    ```
    

### 7. **tmux 配置**

你可以在 `~/.tmux.conf` 文件中进行自定义配置，常见配置项包括：

- 修改前缀键：
    
    ```bash
    # 将前缀键修改为 'Ctrl + a'
    set-option -g prefix C-a
    bind-key C-a send-prefix
    ```
    
- 设置自动重新加载配置文件：
    
    ```bash
    # 按 'r' 重载 tmux 配置
    bind r source-file ~/.tmux.conf \; display-message "Config reloaded!"
    ```
    

### 8. **常见的快捷键总结**

- `Ctrl + b`：tmux 前缀键，后续按键都基于这个前缀。
    
- `c`：新建一个窗口。
    
- `n`：切换到下一个窗口。
    
- `p`：切换到上一个窗口。
    
- `%`：水平分屏。
    
- `"`：垂直分屏。
    
- `o`：切换到下一个窗格。
    
- `x`：关闭当前窗格。
    
- `[`：进入复制模式。
    
- `q`：退出复制模式。
    

通过这些基本命令和快捷键，你可以有效地使用 `tmux` 来管理你的终端会话，提升工作效率。如果你有更具体的需求或问题，可以继续询问！


# Zellij
安装
```
snap install zellij --classic
```

既然你在开发 **HybridMamba** 这种需要长时间跑实验、监控 GPU 的项目，**Zellij** 绝对是比 tmux 更现代、更友好的选择（它是用 Rust 写的，天然契合高性能工具的直觉）。
以下是关于 Zellij **会话（Session）** 管理的核心操作：

---
### 1. 开启新会话 (Start)
在终端直接输入 `zellij` 即可进入。但为了以后方便重连，建议**命名会话**：
- **创建命名会话：**
    ```
    zellij -s hybrid_mamba_train
    ```
    _这样即使你断开了 SSH，后台的训练脚本依然会运行。_
- **使用特定布局打开：**
    如果你想一打开就分好屏（比如左边写代码，右边看 `nvidia-smi`），可以使用：
    ```
    zellij --layout welcome
    ```
---
### 2. 离开会话 (Detach)
如果你想让程序在后台运行，自己先退出 Zellij：
- **快捷键：** `Ctrl + o`（进入 Session 模式），然后按 `d` (Detach)。
- **注意：** 不要直接按 `exit` 或者 `Ctrl + d`（那会直接杀掉当前窗口的所有进程）。
---
### 3. 查看与再次连接 (List & Attach)
当你重新登录服务器，想回到之前的实验进度时：
- **查看当前运行中的所有会话：**
    ```
    zellij list-sessions
    # 简写
    zellij ls
    ```
- **重新连接到指定会话：**
    ```
    zellij attach hybrid_mamba_train
    ```
- **快速连接最近的一个会话：**
    ```
    zellij attach
    ```
---
### 4. 技巧：如果会话已经“挂起”了怎么办？
有时候因为网络波动，会话显示 `(EXITED)` 但还没完全关掉，或者你想强制接管：
- **强制连接（即使已有其他客户端在线）：**
    ```
    zellij attach -f <name>
    ```
---
### 5. 给 Austin 的进阶建议（针对点云实验监控）
在 Zellij 里，你可以利用其底部的状态栏提示进行操作。针对你的开发流，我推荐记住这两个组合：
1. **新建窗口（Tab）：** `Ctrl + t` -> `n`。你可以一个 Tab 跑 **Claude Code**，一个 Tab 跑 **OpenPCDet** 训练。
2. **分屏（Pane）：** `Ctrl + p` -> `r` (右分屏) 或 `d` (下分屏)。方便你一边改 `Mamba` 的配置文件，一边观察输出 log。

