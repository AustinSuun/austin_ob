
const getRandomBone = (arr: any[]) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 定义事件处理函数，确保引用稳定
const handleRandomClick = async (e: Event) => {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  
  try {
    // 1. 获取 baseDir
    let baseDir = target.getAttribute("data-base-dir") || "."
    
    // 2. 尝试构建 fetch URL
    // 优先使用传入的 relative path，但在 404 页面可能失效
    let fetchUrl = `${baseDir}/static/contentIndex.json`
    
    // 3. 执行 Fetch
    let res = await fetch(fetchUrl)

    // 4. 重试机制：如果相对路径失败，尝试根绝对路径 (适用于 404 页面 URL 深度不确定的情况)
    if (!res.ok) {
        console.warn(`RandomPage: Failed to fetch from ${fetchUrl}, trying absolute path...`)
        fetchUrl = "/static/contentIndex.json"
        res = await fetch(fetchUrl)
        
        // 如果绝对路径成功了，说明 baseDir 计算有误（可能是 404 页面），修正 baseDir 以便后续跳转
        if (res.ok) {
            baseDir = "" // 修正为根目录
        }
    }

    if (!res.ok) {
      console.error("RandomPage: Failed to fetch content index.")
      return
    }
    
    const data = await res.json()
    const slugs = Object.keys(data).filter((slug: string) => !slug.startsWith("tags/") && slug !== "index")
    
    if (slugs.length > 0) {
      const slug = getRandomBone(slugs)
      // 处理 baseDir 和 slug 的拼接，避免多重斜杠
      const cleanBase = baseDir.replace(/\/$/, "")
      window.location.href = `${cleanBase}/${slug}`
    }
  } catch (err) {
    console.error("RandomPage: Error during random walk:", err)
  }
}

function setupRandomWalk() {
  const randomLinks = document.querySelectorAll(".random-btn")
  randomLinks.forEach(link => {
    link.removeEventListener("click", handleRandomClick)
    link.addEventListener("click", handleRandomClick)
  })
}

// 监听导航事件
document.addEventListener("nav", setupRandomWalk)

// 针对首次加载（包括 404 页面）
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupRandomWalk)
} else {
  // 稍微延迟一下以确保 DOM 确实就绪（特别是对于某些动态渲染的情况）
  setTimeout(setupRandomWalk, 100)
}
