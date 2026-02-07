// Image Lightbox
document.addEventListener("nav", () => {
  const images = document.querySelectorAll("article img")
  
  images.forEach((img) => {
    // Skip if already processed
    if (img.getAttribute("data-lightbox")) return
    
    img.setAttribute("data-lightbox", "true")
    img.style.cursor = "zoom-in"
    
    img.addEventListener("click", () => {
      const lightbox = document.createElement("div")
      lightbox.className = "lightbox"
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <img src="${img.src}" alt="${img.alt || ''}" />
          <button class="lightbox-close">&times;</button>
        </div>
      `
      
      document.body.appendChild(lightbox)
      document.body.style.overflow = "hidden"
      
      setTimeout(() => lightbox.classList.add("active"), 10)
      
      function close() {
        lightbox.classList.remove("active")
        setTimeout(() => {
          document.body.removeChild(lightbox)
          document.body.style.overflow = ""
        }, 300)
      }
      
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || (e.target as HTMLElement).classList.contains("lightbox-close")) {
          close()
        }
      })
    })
  })
})
