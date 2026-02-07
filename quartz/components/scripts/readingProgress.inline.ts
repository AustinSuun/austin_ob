// Reading Progress Bar
document.addEventListener("nav", () => {
  const progressBar = document.getElementById("reading-progress-bar")
  if (!progressBar) return

  function updateProgressBar() {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollableHeight = documentHeight - windowHeight
    const progress = (scrollTop / scrollableHeight) * 100

    progressBar.style.width = `${Math.min(progress, 100)}%`
  }

  window.addEventListener("scroll", updateProgressBar, { passive: true })
  window.addCleanup(() => window.removeEventListener("scroll", updateProgressBar))
  
  // Initial update
  updateProgressBar()
})
