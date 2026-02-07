---
日期: 2026-02-06T19:07:00
作者:
  - Austin
tags:
---
> 具体的流程问 AI，这里只是大致流程


## 一、 本地 Quartz 环境配置

这部分确保你的研究笔记能从本地物理目录正确同步到发布仓库中。

1. **环境初始化**：
    
    - 确保安装 **Node.js (v22+)** 和 **Go** 语言环境。
        
    - 在 `quartz` 目录执行 `npm ci` 安装核心依赖。
        
2. **内容物理同步化**：
    
    - 由于 GitHub Actions 无法识别本地软链接（Symlink），必须弃用软链接，改用 **`rsync`** 命令将笔记从原始目录（`main` 分支）物理拷贝到 Quartz 的 `content/` 文件夹。
        
3. **核心文件调整 (`quartz.config.ts`)**：
    
    - **Base URL**：必须设置 `baseUrl: "AustinSuun.github.io/你的仓库名"`，否则网页无法加载 CSS/JS。
        
    - **主题定制**：在 `theme` 字段中根据学术审美调整颜色（如将链接色 `secondary` 改为科技蓝）和 Google 字体。
        

---

## 二、 GitHub 网页端权限配置

这是最关键的“临门一脚”，必须手动解锁 GitHub 的云端写权限。

1. **Workflow 写入权限**：
    
    - 路径：`Settings` -> `Actions` -> `General`。
        
    - 操作：滚动到底部，勾选 **Read and write permissions**。
        
2. **解锁部署环境**：
    
    - 路径：`Settings` -> `Environments` -> `github-pages`。
        
    - 操作：在 **Deployment branches** 中添加 **`v4`** 分支，允许非 main 分支发布。
        
3. **指定发布源**：
    
    - 路径：`Settings` -> `Pages`。
        
    - 操作：在 **Build and deployment** 下将 **Source** 切换为 **GitHub Actions**。
        

---

## 三、 自动化发布流程 (核心命令)

为了实现“一键发布” **HybridMamba** 的最新进展，建议在 `.bashrc` 中配置 `publish` 函数。

### 1. 核心自动化脚本

Bash

```
function publish() {
    # 1. 物理同步：将 main 笔记同步到 v4 content 目录
    rsync -av --delete "$HOME/文档/austin_ob/" "$HOME/Projects/quartz/content/"
    
    # 2. 进入发布目录并强制添加物理文件
    cd "$HOME/Projects/quartz"
    git add content/
    
    # 3. 触发云端构建
    npx quartz sync
}
```

### 2. 日常操作命令对照表

|**阶段**|**执行动作**|**主要命令**|
|---|---|---|
|**同步内容**|物理拷贝并推送到 GitHub|`publish` (自定义函数)|
|**触发构建**|启动 GitHub Actions 渲染|`npx quartz sync`|
|**检查状态**|查看 Git 记录是否包含 .md 文件|`git status`|

---

## 四、 常见问题避坑

- **XML 报错**：若打开网页只看到代码，检查 `index.md` 是否有 YAML 头部，或 `baseUrl` 是否漏掉了仓库名。
    
- **子模块冲突**：若笔记目录含 `.git` 文件夹，必须将其删除（`rm -rf .git`），否则 Git 会将其识别为无法读取的空指针。
    
- **类型变更报错**：若 `git status` 显示 `类型变更：content`，需执行 `git rm --cached content` 清除软链接记录。
    

**Austin，你现在尝试运行 `publish` 后的网页显示正常了吗？** 如果已经成功，我们可以进一步优化你的 **Latex 公式** 渲染配置。



# 主题
https://github.com/saberzero1/quartz-themes#installation