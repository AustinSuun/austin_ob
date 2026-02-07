// Typing Animation for Homepage
document.addEventListener("nav", () => {
  const typingElement = document.querySelector(".typing-animation")
  if (!typingElement) return

  const text = typingElement.getAttribute("data-text") || ""
  const speed = parseInt(typingElement.getAttribute("data-speed") || "80")
  
  let index = 0
  typingElement.textContent = ""
  typingElement.classList.add("typing")
  
  function type() {
    if (index < text.length) {
      typingElement.textContent += text.charAt(index)
      index++
      setTimeout(type, speed)
    } else {
      typingElement.classList.remove("typing")
      typingElement.classList.add("typed")
    }
  }
  
  // Start typing after a small delay
  setTimeout(type, 300)
})
