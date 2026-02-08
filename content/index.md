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
footer,
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
  max-width: 1400px !important;
  margin: 0 auto !important;
  padding: 0 2rem !important;
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

.profile-social {
  margin-top: 0.5rem;
  display: flex;
  gap: 1rem;
}

.profile-social a {
  text-decoration: none !important;
  color: var(--gray);
  font-size: 1.2rem;
  transition: all 0.2s ease;
  padding: 0.3rem;
  border-radius: 50%;
}

.profile-social a:hover {
  color: var(--secondary);
  background: rgba(0,0,0,0.05);
  transform: translateY(-2px);
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




/* 卡片布局 - 强制桌面端四列 */
.grid-cards {
  display: grid;
  gap: 1.5rem;
  margin: 2rem 0;
  width: 100%;
  /* 默认移动优先：单列 */
  grid-template-columns: 1fr;
}

/* 平板/小屏：两列 */
@media (min-width: 600px) {
  .grid-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面大屏：四列 */
@media (min-width: 1000px) {
  .grid-cards {
    grid-template-columns: repeat(4, 1fr);
  }
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

/* 6. 花园统计样式 */
.garden-stats {
  margin-top: 2rem;
  font-size: 0.85rem;
  color: var(--gray);
  opacity: 0.8;
  letter-spacing: 0.5px;
  display: flex !important;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  animation: fadeIn 2s ease-out;
}
.stat-divider { opacity: 0.3; }
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
  <div class="profile-social">
  <div class="profile-social">
    <a href="https://space.bilibili.com/258889817" target="_blank" title="Bilibili" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 8px; transition: background 0.2s;">
      <svg viewBox="0 0 1024 1024" width="24" height="24"><path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0z" fill="#FB7299"/><path d="M716.3 350.5H307.7c-37.5 0-68 30.5-68 68v229.5c0 37.5 30.5 68 68 68h408.5c37.5 0 68-30.5 68-68V418.5c0-37.5-30.5-68-68-68z m-262.1 230c-23.4 0-42.4-19-42.4-42.4s19-42.4 42.4-42.4 42.4 19 42.4 42.4-19 42.4-42.4 42.4z m214.2 0c-23.4 0-42.4-19-42.4-42.4s19-42.4 42.4-42.4 42.4 19 42.4 42.4-19 42.4-42.4 42.4zM327.9 220.6l62.4 80.2h15.3l-62.4-80.2c-3.6-4.6-9-7.2-14.8-7.2h-7.4c-9.5 0-17.7 7.7-17.7 17.2 0 4.5 1.8 8.8 4.9 12l19.7 25.2z m304.5-47.2c-5.8 0-11.2 2.6-14.8 7.2l-62.4 80.2h54.9l62.4-80.2c3.1-3.2 4.9-7.5 4.9-12 0-9.5-8.2-17.2-17.7-17.2h-7.3z" fill="#FFFFFF"/></svg>
      <span style="font-weight: 700; font-size: 1.1rem; color: var(--dark); letter-spacing: -0.5px;">bilibili</span>
    </a>
    <a href="https://github.com/AustinSuun/austin_ob" target="_blank" title="GitHub" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 8px; transition: background 0.2s;">
      <svg viewBox="0 0 1024 1024" width="24" height="24"><path d="M512 0C229.2 0 0 229.2 0 512c0 226.2 146.7 418.1 350.1 485.8 25.6 4.7 34.9-11.1 34.9-24.6 0-12.1-0.4-44.2-0.7-86.7-142.3 30.9-172.4-68.6-172.4-68.6-23.3-59.2-56.8-74.9-56.8-74.9-46.5-31.8 3.5-31.1 3.5-31.1 51.4 3.6 78.5 52.8 78.5 52.8 45.6 78.2 119.7 55.6 148.9 42.5 4.6-33 17.8-55.6 32.4-68.4-113.6-12.9-233-56.8-233-252.6 0-55.8 19.9-101.4 52.6-137.1-5.3-12.9-22.8-64.9 5-135.2 0 0 42.9-13.7 140.6 52.5 40.8-11.4 84.5-17.1 128.1-17.3 43.5 0.2 87.3 5.9 128.1 17.3 97.6-66.2 140.5-52.5 140.5-52.5 27.9 70.3 10.4 122.3 5.1 135.2 32.8 35.7 52.6 81.3 52.6 137.1 0 196.1-119.5 239.5-233.4 252.1 18.3 15.8 34.7 46.9 34.7 94.5 0 68.2-0.6 123.2-0.6 139.9 0 13.6 9.3 29.5 35.2 24.5C877.4 930 1024 738.1 1024 512 1024 229.2 794.8 0 512 0z" fill="#181717"/></svg>
      <span style="font-weight: 700; font-size: 1.1rem; color: var(--dark); letter-spacing: -0.5px;">GitHub</span>
    </a>
  </div>
  </div>
</div>

<div class="hero-actions">
<a href="Timeline" id="timeline-btn" class="btn-primary">
⏳ 查看时间线
</a>
</div>



<div class="garden-stats" id="stats-container">
  <!-- 动态加载统计数据 -->
  <span>正在盘点花园资产...</span>
</div>

<script>
async function loadGardenStats() {
  const container = document.getElementById('stats-container');
  if (!container) return;
  
  try {
    // 尝试从根路径获取，兼容不同的部署环境
    const response = await fetch('static/contentIndex.json');
    if (!response.ok) throw new Error('Fetch failed');
    const data = await response.json();
    
    // 使用标准 function 避开可能的字符转义问题
    const keys = Object.keys(data);
    let count = 0;
    for (var i = 0; i < keys.length; i++) {
      var slug = keys[i];
      if (slug !== 'index' && slug.indexOf('templates') === -1) {
        count++;
      }
    }
    
    container.innerHTML = '<span>已整理 <b>' + count + '</b> 篇笔记</span>' +
                          '<span class="stat-divider">|</span>' +
                          '<span>稳定运行 <b>365+</b> 天</span>' +
                          '<span class="stat-divider">|</span>' +
                          '<span>思想与代码共舞</span>';
  } catch (e) {
    console.error('Stats load error:', e);
    // 降级显示
    container.innerHTML = '<span>每一天，都在构建知识的星系</span>';
  }
}

// Quartz 4 使用 SPA 导航，监听 nav 事件
document.addEventListener("nav", loadGardenStats);
// 初始加载也执行一次
loadGardenStats();
</script>
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

<style>
/* 8. 数字化背景纹理 (Digital Grid) */
body {
  background-color: var(--light);
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 30px 30px;
  background-position: center top;
}

:root[saved-theme="dark"] body {
  background-color: var(--dark);
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
}

/* 9. 全景专业页脚 (Premium Lab Footer) */
.garden-footer {
  margin-top: 0;
  padding: 1rem 0 1rem;
  border-top: 1px solid var(--lightgray);
  text-align: center;
  position: relative;
  width: 100%;
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.footer-social {
  display: flex;
  gap: 2rem;
}

.footer-social a {
  text-decoration: none;
  color: var(--gray);
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(0,0,0,0.03);
}

.footer-social a:hover {
  color: var(--secondary);
  background: rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

.copyright {
  font-size: 0.85rem;
  color: var(--gray);
  opacity: 0.8;
  line-height: 1.6;
}

.copyright b { font-weight: 600; color: var(--darkgray); }

</style>

<div class="garden-footer">
  <div class="footer-content">
    <div class="footer-social">
      <a href="relax" title="休息一下">🎮 休息室</a>
      <a href="index.xml" title="RSS 订阅">📡 RSS</a>
    </div>
    <div class="copyright">
      © 2024-2026 <b>Austin Suun</b>. All Rights Reserved.<br>
      Built with <a href="https://quartz.jzhao.xyz/" target="_blank">Quartz 4.0</a> • <a href="https://obsidian.md/" target="_blank">Obsidian</a>
    </div>
  </div>
</div>


