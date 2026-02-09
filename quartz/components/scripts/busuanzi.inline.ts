
const loadBusuanzi = () => {
  const scriptId = "busuanzi-script"
  const oldScript = document.getElementById(scriptId)
  if (oldScript) {
    oldScript.remove()
  }

  const script = document.createElement("script")
  script.src = "https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
  script.id = scriptId
  script.async = true
  script.referrerPolicy = "no-referrer-when-downgrade" 
  
  // 增加加载失败/超时的处理（针对本地环境或广告拦截）
  script.onerror = () => {
    console.warn("Busuanzi script failed to load. Check ad blocker.")
  }

  document.head.appendChild(script)

  // 本地开发环境的回退显示
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    setTimeout(() => {
      const pv = document.getElementById('busuanzi_value_site_pv')
      const uv = document.getElementById('busuanzi_value_site_uv')
      if (pv && pv.innerText === "") {
        pv.innerText = "Local"
        console.log("Busuanzi: Local fallback applied (no data received)")
      }
      if (uv && uv.innerText === "") uv.innerText = "Local"
    }, 3000) // 3秒后如果没有数据，显示 Placeholder
  }
}

document.addEventListener("nav", loadBusuanzi)

// 首次加载
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadBusuanzi)
} else {
  loadBusuanzi()
}
