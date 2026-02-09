
const centerMath = () => {
  const paragraphs = document.querySelectorAll('p')
  paragraphs.forEach(p => {
    // Avoid double processing
    if (p.classList.contains('center-checked')) return
    p.classList.add('center-checked')

    // Check if paragraph contains plain math
    const mathElements = p.querySelectorAll('.katex, .MathJax, .MathJax_Preview, mjx-container')
    
    // If no math, skip
    if (mathElements.length === 0) return

    // Clone to check content
    const clone = p.cloneNode(true) as HTMLElement
    
    // Remove all math elements from clone
    const internalMath = clone.querySelectorAll('.katex, .MathJax, .MathJax_Preview, mjx-container')
    internalMath.forEach(el => el.remove())
    
    // Remove all whitespace
    const textContent = clone.textContent || ""
    
    // If no text remains, it means the p tag ONLY contained math
    // We treat this as a "Block Math" paragraph
    if (textContent.trim().length === 0) {
      p.classList.add('centered-math-block')
      p.style.textAlign = 'center'
      p.style.display = 'flex'
      p.style.flexDirection = 'column' // Handle multiple lines if any
      p.style.alignItems = 'center'
      p.style.justifyContent = 'center'
      p.style.width = '100%'
      p.style.overflowX = 'auto'
      p.style.overflowY = 'hidden' // Fix vertical scrollbar issue
    }
  })
}

document.addEventListener("nav", centerMath)
// Also run immediately just in case
centerMath()
