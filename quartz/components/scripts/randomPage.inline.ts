
const getRandomBone = (arr: any[]) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

document.addEventListener("nav", () => {
  const randomLink = document.querySelector("#random-button") as HTMLElement
  if (!randomLink) return

  randomLink.addEventListener("click", async (e) => {
    e.preventDefault()
    try {
      // 获取 baseDir，用于构建 fetch URL 和跳转 URL
      const baseDir = randomLink.getAttribute("data-base-dir") || "."
      
      const res = await fetch(`${baseDir}/static/contentIndex.json`)
      if (!res.ok) {
        console.error("Failed to fetch content index")
        return
      }
      
      const data = await res.json()
      // 过滤掉 index 页和标签页
      const slugs = Object.keys(data).filter((slug: string) => !slug.startsWith("tags/") && slug !== "index")
      
      if (slugs.length > 0) {
        const slug = getRandomBone(slugs)
        // 跳转到目标页面
        window.location.href = `${baseDir}/${slug}`
      }
    } catch (err) {
      console.error("Failed to random walk:", err)
    }
  })
})
