
## 🛠️ Arch Linux 安装 Quartz 实战指南

### 1. 基础环境配置 (Arch 特色)

在 Arch 上，我们优先使用官方仓库的 Node.js LTS 版本以确保稳定性，同时必须安装构建工具。

Bash

```
# 1. 安装 Node.js LTS (Jod版本, v22) 和 npm
# 注意：虽然你之前用了 v25，但为了避免 sharp 编译报错，推荐用 LTS
sudo pacman -S nodejs-lts-jod npm git

# 2. 安装基础开发工具包 (解决 node-gyp 编译报错的关键)
sudo pacman -S base-devel libvips

# 3. 验证版本 (确保 node > 18.14)
node -v
npm -v
```

---

### 2. Quartz 核心安装与初始化

建议将 `quartz` 文件夹放在你的个人项目目录（如 `~/Projects`），而不是下载目录。

Bash

```
# 1. 克隆代码库
git clone https://github.com/jackyzha0/quartz.git
cd quartz

# 2. 安装项目依赖 (如遇网络问题可加镜像源)
npm install --registry=https://registry.npmmirror.com

# 3. 初始化并链接你的 Obsidian 仓库
npx quartz create
```

**初始化选项建议：**

- **Setup方式**: `Symlink an existing folder` (软链接，实时同步且省空间)。
    
- **输入路径**: `/home/austin/文档/austin_ob` (你的绝对路径)。
    
- **链接格式**: `Treat links as shortest path` (匹配 Obsidian 默认设置)。
    

---

### 3. 关键配置修复 (避坑总结)

为了顺利启动，我们手动修复了刚才遇到的两个报错：

- **修复报错 A：Emoji/OG图片渲染失败**
    
    打开 `quartz.config.ts`，注释掉以下行：
    
    TypeScript
    
    ```
    // Component.CustomOgImages(), 
    ```
    
- **修复报错 B：缺少首页**
    
    在你的 Obsidian 仓库根目录下创建一个 `index.md` 文件。
    
- **修复报错 C：YAML格式错误**
    
    确保笔记开头的 `---` 之间只有标准的 `key: value`（如 `title: 我的首页`），不要塞入正文内容。
    

---

### 4. 本地预览与日常同步

这是你之后最常用的两个命令：

|**动作**|**命令**|**作用**|
|---|---|---|
|**启动预览**|`npx quartz build --serve`|本地打开 `localhost:8081` 查看效果|
|**一键发布**|`npx quartz sync`|将笔记更新同步到 GitHub 并上线|

---

### 5. GitHub 部署流程

一旦本地满意了，按以下步骤推送到全球：

Bash

```
# 1. 关联你新建的 GitHub 仓库
git remote add origin git@github.com:AustinSuun/你的仓库名.git

# 2. 执行首次同步
npx quartz sync
```

**GitHub 网页端最后一步：** 在仓库 **Settings -> Pages** 里，把 **Source** 改为 **GitHub Actions**。