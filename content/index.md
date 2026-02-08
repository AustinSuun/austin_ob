---
title: 
---

<style>
/* 首页特有样式 - 覆盖默认的 article 布局 */
.page .center {
    max-width: 1200px !important; /* 更宽的布局以适应网格 */
    padding: 0 2rem;
}

/* 英雄区域 (Hero Section) */
.hero-section {
    text-align: center;
    padding: 4rem 1rem 3rem;
    position: relative;
    overflow: hidden;
}

.hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
    background: linear-gradient(120deg, var(--secondary), var(--tertiary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
}

.hero-subtitle {
    font-size: 1.25rem;
    color: var(--gray);
    margin-bottom: 2rem;
    font-weight: 400;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
}

.hero-actions {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.btn-primary, .btn-secondary {
    padding: 0.8rem 1.8rem;
    border-radius: 12px;
    font-weight: 600;
    text-decoration: none !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-primary {
    background: var(--secondary);
    color: white !important;
    box-shadow: 0 4px 14px rgba(41, 163, 255, 0.3);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(41, 163, 255, 0.4);
    background: var(--secondary); /* 保持颜色 */
}

.btn-secondary {
    background: rgba(130, 177, 255, 0.1);
    color: var(--secondary) !important;
    border: 1px solid rgba(130, 177, 255, 0.2);
}

.btn-secondary:hover {
    background: rgba(130, 177, 255, 0.2);
    transform: translateY(-2px);
}

/* 卡片网格系统 */
.grid-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 3rem 0;
}

.feature-card {
    background: var(--light);
    border: 1px solid var(--lightgray);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    border-color: var(--secondary);
}

.card-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
    background: rgba(130, 177, 255, 0.1);
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    color: var(--secondary);
}

.card-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--dark);
}

.card-desc {
    color: var(--gray);
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
    line-height: 1.6;
    flex-grow: 1;
}

/* 链接列表样式 - 模拟 Callout 但更轻量 */
.link-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.link-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem;
    background: rgba(0,0,0,0.02);
    border-radius: 8px;
    text-decoration: none !important;
    color: var(--darkgray) !important;
    font-size: 0.9rem;
    transition: background 0.2s;
}

.link-item:hover {
    background: rgba(0,0,0,0.05);
    color: var(--secondary) !important;
}

/* 暗色模式适配 */
:root[saved-theme="dark"] .feature-card {
    background: rgba(30, 30, 46, 0.6); /* 半透明背景 */
    backdrop-filter: blur(10px);
    border-color: rgba(255,255,255,0.05);
}

:root[saved-theme="dark"] .feature-card:hover {
    background: rgba(30, 30, 46, 0.8);
    border-color: var(--secondary);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

:root[saved-theme="dark"] .link-item {
    background: rgba(255,255,255,0.03);
}

:root[saved-theme="dark"] .link-item:hover {
    background: rgba(255,255,255,0.08);
}

/* 最近更新/社交栏 */
.footer-links {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--lightgray);
    opacity: 0.8;
}

.social-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--gray) !important;
    text-decoration: none !important;
    transition: color 0.2s;
    font-size: 0.95rem;
}

.social-link:hover {
    color: var(--secondary) !important;
}

</style>

<div class="hero-section">
    <div class="hero-title">灵感空间 🪐</div>
    <div class="hero-subtitle">
        沉淀计算机科学、深度学习与算法理论。<br>
        在这里，让思想与代码共舞。
    </div>
    <div class="hero-actions">
        <a href="Timeline" class="btn-primary">
            📅 查看时间轴
        </a>
        <a href="relax" class="btn-secondary">
            🎮 休息一下
        </a>
    </div>
</div>

<div class="grid-cards">
    <!-- 学术课程 -->
    <div class="feature-card">
        <div class="card-icon">🎓</div>
        <div class="card-title">学术课程</div>
        <div class="card-desc">理论推导与核心知识沉淀，构建坚实的知识体系。</div>
        <div class="link-list">
            [[课程/强化学习/000-强化学习 目录|<div class="link-item">🤖 强化学习 (RL)</div>]]
            [[课程/算法设计与分析/101-算法概论|<div class="link-item">🧮 算法设计与分析</div>]]
        </div>
    </div>

    <!-- 论文研读 -->
    <div class="feature-card">
        <div class="card-icon">🔬</div>
        <div class="card-title">论文研读</div>
        <div class="card-desc">追踪最新前沿，深度解析学术思路与创新点。</div>
        <div class="link-list">
            [[论文/论文精读/000-如何阅读一篇论文|<div class="link-item">📄 论文精读方法论</div>]]
            [[论文/正在阅读/|<div class="link-item">📖 正在研读中</div>]]
        </div>
    </div>

    <!-- 实验档案 -->
    <div class="feature-card">
        <div class="card-icon">🧪</div>
        <div class="card-title">实验档案</div>
        <div class="card-desc">代码复现与环境配置实战，从理论走向实践。</div>
        <div class="link-list">
            [[实验/openpcdet-LION环境配置|<div class="link-item">🦁 OpenPCDet-LION 环境</div>]]
            [[实验/MMDetection3D|<div class="link-item">📦 MMDetection3D 实践</div>]]
        </div>
    </div>

    <!-- 工具与环境 -->
    <div class="feature-card">
        <div class="card-icon">🛠️</div>
        <div class="card-title">工具 & 环境</div>
        <div class="card-desc">工欲善其事，必先利其器。效率工具与运维笔记。</div>
        <div class="link-list">
            [[工具/quartz部署ob笔记|<div class="link-item">🚀 Quartz 博客搭建</div>]]
            [[工具/服务器SSH本地连接|<div class="link-item">🐧 Linux & 服务器运维</div>]]
        </div>
    </div>
</div>

<div class="footer-links">
    <a href="https://space.bilibili.com/258889817" class="social-link" target="_blank">
        📺 Bilibili 主页
    </a>
    <a href="https://github.com/AustinSuun/austin_ob" class="social-link" target="_blank">
        🐙 GitHub 仓库
    </a>
</div>
