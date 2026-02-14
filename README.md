# 🌿 Austin's Digital Garden

> **探索人工智能的数理基础与工程实践**  
> _Powered by Quartz 4.0 & Academic Refinement Aesthetic_

[![Deploy Status](https://github.com/AustinSuun/austin_ob/actions/workflows/deploy.yml/badge.svg)](https://github.com/AustinSuun/austin_ob/actions)

## 📖 项目简介

欢迎来到 **[人杰地灵东箭南金](https://austinsuun.github.io/austin_ob/)** 的数字花园。
这不仅仅是一个博客，更是一个**有机生长的知识网络**。在这里，我记录每一次灵光的闪现与代码的重构，从深度学习的底层原理，到强化学习的决策智能，再到计算机视觉的感知边界。

本项目基于 [Quartz v4](https://quartz.jzhao.xyz/) 深度定制，融合了现代化的高级审美与学术论文级的排版体验。

## ✨ 核心特性

### 🎨 极致的学术审美 (Academic Refinement)
- **Source Han Sans CN Unification**: 全站统一使用`思源黑体 CN`（Noto Sans SC），构建极具人文气息与严谨学术感的视觉基调。
- **Booktabs Style Tables**: 借鉴学术论文排版，移除所有垂直边框，仅保留优雅的水平线设计（三线表风格），极度简约且专业。
- **Dynamic Homepage**: 首屏动态打字机效果 (Typewriter Effect) 与四宫格核心功能导航 (Feature Grid)。
- **Dark Mode Perfected**: 针对 OLED 与长久阅读优化的深色模式，色彩配比经过多次学术级对比度调优。

### 🧠 深度知识管理
- **Bi-directional Links**: 像神经元一样的双向链接，构建紧密的知识图谱。
- **Full-text Search**: 基于 WASM 的毫秒级全文检索，配合增强的 Z-Index 层级管理，交互丝滑。
- **Academic Support**: 完美支持 LaTeX 数学公式渲染、代码高亮与引用预览。
  - **Smart Math Centering**: 独家开发的智能脚本，自动检测文档中的纯公式段落并实施完美居中，彻底解决移动端与复杂布局下的公式错位问题。
- **Timeline View**: 动态时间轴，按时间线性回顾思维轨迹。

### 💬 互动与反馈
- **Giscus Comments**: 基于 GitHub Discussions 的评论系统，支持 `pathname` 稳定映射，即使域名变更也能找回讨论。
- **Umami Analytics**: 隐私优先、现代化的后台访问量统计，彻底摆脱失效脚本的干扰。
- **Content Freshness**: 智能检测文章时效性（365天过期提醒），确保知识的针对性与有效性。

## 📂 内容版块

- **🎓 学术课程**: 强化学习、算法设计与分析笔记。
- **🔬 论文研读**: 3D 点云、目标检测领域的包括 *OpenPCDet*, *MMDet3D* 等前沿论文解析。
- **🧪 实验档案**: 从理论到代码复现的完整记录。
- **🛠️ 工具环境**: Linux 运维、Quartz 搭建与效率工具指南。

## 🚀 快速开始

### 环境要求
- Node.js v18.14+
- npm v9+

### 本地运行
```bash
# 安装依赖
npm install

# 启动本地预览服务器 (热重载)
npx quartz build --serve
```
访问 `http://localhost:8080` 开启探索。

### 部署更新
```bash
# 构建并同步到 GitHub Pages
npx quartz sync
```

## 🎨 Obsidian 深度集成 (Austin Theme)

本项目提供了与 Quartz 网页风格 **1:1 复刻** 的 Obsidian 主题样式，让您的本地写作体验与网页浏览体验无缝衔接。

### ✨ 同步特性
- **Typography & Fonts**: 统一使用 `思源黑体 CN` 与 `Inter` 字体组合，阅读体验高度一致。
- **Gradient Headings**: 本地完美还原 H1 的渐变色标题与 H2 的品牌色光感标题。
- **Booktabs Tables**: 自动适配亮/暗模式的学术三线表样式。
- **Inline Code Style**: 统一的浅灰色背景行内代码样式，拒绝突兀的默认配色。
- **Math Formulae**: 针对 Obsidian 预览模式优化的数学公式居中显示。

### 启用同款样式
1. 样式文件源：`austin-quartz-style.css` (会自动部署到 `.obsidian/snippets/austin-theme.css`)
2. 打开 Obsidian **设置** > **外观** (Appearance)。
3. 在 **CSS 代码片段** (CSS snippets) 区域，点击刷新按钮。
4. 找到 `austin-theme` 并启用开关。

现在，您的 Obsidian 将拥有与网页版完全一致的 **字体、配色、表格与排版**。

## 📄 许可证

本项目内容遵循 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议。
代码部分遵循 [MIT License](LICENSE)。

---
<div align="center">
  © 2024-2026 Austin Suun. Built with ❤️ and Quartz.
</div>
