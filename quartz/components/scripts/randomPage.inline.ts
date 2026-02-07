
const getRandomBone = (arr: any[]) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 封装 setup 函数，确保可以在不同生命周期调用
function setupRandomWalk() {
  const randomLinks = document.querySelectorAll(".random-btn")
  if (randomLinks.length === 0) return

  const handleClick = async (e: Event) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    try {
      // 获取 baseDir，如果不存在则默认为 "."
      // 注意：在 404 页面，如果是深层路径，"." 可能会有问题，但 data-base-dir 应该是正确的 relative path
      const baseDir = target.getAttribute("data-base-dir") || "."
      
      // 构建 contentIndex 的完整路径
      // 使用 URL 构造器来处理路径凭借，避免双重斜杠等问题
      // 但 fetch 接受相对路径
      const fetchUrl = `${baseDir}/static/contentIndex.json`
      
      const res = await fetch(fetchUrl)
      if (!res.ok) {
        console.error(`Failed to fetch content index from ${fetchUrl}`)
        return
      }
      
      const data = await res.json()
      const slugs = Object.keys(data).filter((slug: string) => !slug.startsWith("tags/") && slug !== "index")
      
      if (slugs.length > 0) {
        const slug = getRandomBone(slugs)
        // 跳转到目标页面
        window.location.href = `${baseDir}/${slug}`
      }
    } catch (err) {
      console.error("Failed to random walk:", err)
    }
  }

  // 移除旧的监听器以防重复（虽然 inline script 通常只执行一次，但在 SPA 导航中要注意）
  // 这里的简单做法是直接添加，因为每次 nav 会重新执行 script 吗？
  // Quartz 的 script loader 行为是在每次 nav 后执行 afterDOMLoaded script
  
  randomLinks.forEach(link => {
    // 避免重复绑定
    link.removeEventListener("click", handleClick) 
    link.addEventListener("click", handleClick)
  })
}

// 监听 Quartz 的导航事件
document.addEventListener("nav", setupRandomWalk)

// 立即尝试执行一次（针对首次加载或 404 页面）
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupRandomWalk)
} else {
  setupRandomWalk()
}
