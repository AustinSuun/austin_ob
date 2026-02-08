---
title: 欢迎来到我的数字花园 🪐
---

<style>
/* --- 首页深度对齐重构 (稳健版) --- */

/* 1. 物理隐藏默认的系统生成组件 */
/* 包含标题、日期、阅读时长以及页脚的一些冗余信息 */
.article-title, 
.content-meta, 
.page-footer, 
.backlinks,
.graph,
.toc { 
  display: none !important; 
  visibility: hidden !important;
}

/* 2. 核心布局配置 */
:root {
  --sidePanelWidth: 0px !important;
}

.page {
  /* 允许 Grid 正常工作，但三栏比例改为 0:1:0 */
  grid-template-columns: 0px 1fr 0px !important;
}

/* 强制左边栏不占位 */
.sidebar.left, 
.sidebar.right {
  width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  display: none !important;
}

/* 3. 居中容器 */
.page .center {
  grid-column: 2 / 3 !important; /* 锁定在中间那一栏 */
  justify-self: center !important;
  width: 100% !important;
  max-width: 1100px !important;
  margin: 0 auto !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}

/* 4. 修改顶部导航栏容器，确保它也在中轴线上 */
.header {
  grid-column: 1 / 4 !important; /* 跨越所有栏以实现全局居中 */
  display: flex !important;
  justify-content: center !important;
  padding: 2rem 0 !important;
}

/* 4. 打字机效果与个人信息样式 */
.hero-section {
  text-align: center;
  padding: 5rem 1rem 2rem;
  width: 100%;
}

.profile-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  animation: fadeIn 1.5s ease-out;
}

.avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--lightgray);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.avatar:hover { transform: scale(1.1) rotate(5deg); border-color: var(--secondary); }

.nickname {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--darkgray);
  letter-spacing: 1px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.hero-title {
  font-size: 3rem;
  font-weight: 850;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  min-height: 4.5rem;
  margin-bottom: 0.5rem;
}

/* 使用容器保持宽度稳定，防止打字时页面晃动 */
.typing-container {
  position: relative;
  display: inline-block;
}

.ghost-text {
  visibility: hidden;
  user-select: none;
  white-space: nowrap;
}

.hero-text {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid var(--secondary);
  background: linear-gradient(120deg, var(--secondary), rgb(94, 146, 255), var(--tertiary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: 
    typing 2s steps(10, end) forwards,
    blink-caret 0.75s step-end infinite;
}

.hero-icon {
  display: inline-block;
  animation: float 4s ease-in-out infinite;
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: var(--secondary); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--gray);
  max-width: 600px;
  margin: 1.5rem auto 3rem;
  line-height: 1.6;
}

.btn-primary {
  padding: 0.8rem 2.5rem;
  border-radius: 50px;
  background: var(--secondary) !important;
  color: white !important;
  text-decoration: none !important;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(41, 163, 255, 0.3);
}

/* 卡片布局 */
.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.8rem;
  margin: 4rem 0;
  width: 100%;
}

.feature-card {
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.feature-card:hover { transform: translateY(-8px); border-color: var(--secondary); box-shadow: 0 12px 30px rgba(0,0,0,0.06); }

.card-icon { font-size: 2.2rem; margin-bottom: 1.2rem; color: var(--secondary); }
.card-title { font-size: 1.3rem; margin-bottom: 0.6rem; }
.card-desc { color: var(--gray); font-size: 0.95rem; margin-bottom: 1.5rem; flex-grow: 1; }

.link-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem; }
.link-list a.internal { padding: 0.5rem 1rem; background: rgba(0,0,0,0.03); border-radius: 50px; text-decoration: none !important; color: var(--darkgray) !important; font-size: 0.85rem; font-weight: 650; }
.link-list a.internal:hover { background: var(--secondary); color: white !important; }

:root[saved-theme="dark"] .feature-card { background: rgba(30, 30, 46, 0.4); border-color: rgba(255,255,255,0.05); }

/* 底部链接 */
.footer-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 5rem;
  padding: 2rem 0;
  border-top: 1px solid var(--lightgray);
  width: 100%;
}
.social-link { color: var(--gray) !important; text-decoration: none !important; font-size: 0.9rem; }
</style>

<div class="hero-section">
<div class="hero-title">
<div class="typing-container">
  <span class="ghost-text">欢迎来到我的数字花园</span>
  <span class="hero-text">欢迎来到我的数字花园</span>
</div>
<span class="hero-icon">🪐</span>
</div>
<div class="hero-subtitle">
沉淀计算机科学、深度学习与算法理论。<br>
在这里，让思想与代码共舞。
</div>

<div class="profile-area">
  <img src="static/avatar.jpg" alt="Avatar" class="avatar">
  <span class="nickname">人杰地灵东箭南金</span>
</div>

<div class="hero-actions">
<a href="Timeline" class="btn-primary">
📅 查看时间轴
</a>
</div>
</div>

<div class="grid-cards">

<div class="feature-card">
<div class="card-icon">🎓</div>
<div class="card-title">学术课程</div>
<div class="card-desc">理论推导与核心知识沉淀，构建坚实的知识体系。</div>
<div class="link-list">
[[课程/强化学习/000-强化学习 目录|🤖 强化学习]]
[[课程/算法设计与分析/101-算法概论|🧮 算法设计]]
</div>
</div>

<div class="feature-card">
<div class="card-icon">🔬</div>
<div class="card-title">论文研读</div>
<div class="card-desc">追踪前沿与深度解析。深入浅出的学术思考。</div>
<div class="link-list">
[[论文/论文精读/000-如何阅读一篇论文|📄 论文方法论]]
[[论文/正在阅读/|📖 正在研读]]
</div>
</div>

<div class="feature-card">
<div class="card-icon">🧪</div>
<div class="card-title">实验档案</div>
<div class="card-desc">从理论走向实践。代码复现与环境配置实战。</div>
<div class="link-list">
[[实验/openpcdet-LION环境配置|🦁 OpenPCDet]]
[[实验/MMDetection3D|📦 MMDet3D]]
</div>
</div>

<div class="feature-card">
<div class="card-icon">🛠️</div>
<div class="card-title">工具 & 环境</div>
<div class="card-desc">工欲善其事，必先利其器。效率工具与运维笔记。</div>
<div class="link-list">
[[工具/quartz部署ob笔记|🚀 Quartz 搭建]]
[[工具/服务器SSH本地连接|🐧 服务器运维]]
</div>
</div>
</div>

<div class="footer-links">
<a href="relax" class="social-link">
🎮 休息一下
</a>
<a href="https://space.bilibili.com/258889817" class="social-link" target="_blank">
📺 Bilibili 主页
</a>
<a href="https://github.com/AustinSuun/austin_ob" class="social-link" target="_blank">
🐙 GitHub 仓库
</a>
</div>
