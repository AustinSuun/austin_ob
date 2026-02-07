// Back to Top Button
document.addEventListener("nav", () => {
  const backToTopBtn = document.getElementById("back-to-top")
  if (!backToTopBtn) return

  function toggleButton() {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("visible")
    } else {
      backToTopBtn.classList.remove("visible")
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  window.addEventListener("scroll", toggleButton, { passive: true })
  backToTopBtn.addEventListener("click", scrollToTop)
  
  window.addCleanup(() => {
    window.removeEventListener("scroll", toggleButton)
    backToTopBtn.removeEventListener("click", scrollToTop)
  })
  
  // Initial check
  toggleButton()
})
