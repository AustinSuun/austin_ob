---
日期: 2026-02-07
作者:
  - Austin
tags:
draft: false
---
# 可以将html嵌入到markdown中，用于网页中显示
## 以下是一些html嵌入到markdown中的例子

<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
  <a href="/static/voxel-viz.html" target="_blank" style={{
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <span>Show Full Screen</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
  </a>
</div>

<iframe 
  src="/static/voxel-viz.html" 
  width="100%"
  height="4000"
  frameBorder="0"
  scrolling="no"
  style={{
    border: 'none', 
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    display: 'block',
    margin: '0 auto'
  }}
></iframe>