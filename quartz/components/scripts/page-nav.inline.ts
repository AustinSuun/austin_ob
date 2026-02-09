function setupWarmNav() {
  const article = document.querySelector('article')
  if (!article) return

  const paragraphs = article.querySelectorAll('p')
  paragraphs.forEach((p) => {
    const text = p.innerText.trim()
    if (text.startsWith('下一节') || text.startsWith('Next Section')) {
      p.classList.add('warm-next-nav')
    }
  })
}

document.addEventListener('nav', setupWarmNav)
window.addEventListener('DOMContentLoaded', setupWarmNav)
