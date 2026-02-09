import { computePosition, flip, inline, shift } from "@floating-ui/dom"
import { normalizeRelativeURLs } from "../../util/path"
import { fetchCanonical } from "./util"

const p = new DOMParser()
let activeAnchor: HTMLAnchorElement | null = null

async function mouseEnterHandler(
  this: HTMLAnchorElement,
  { clientX, clientY }: { clientX: number; clientY: number },
) {
  const link = (activeAnchor = this)
  if (link.dataset.noPopover === "true") {
    return
  }

  async function setPosition(popoverElement: HTMLElement) {
    const { x, y } = await computePosition(link, popoverElement, {
      strategy: "fixed",
      middleware: [inline({ x: clientX, y: clientY }), shift(), flip()],
    })
    Object.assign(popoverElement.style, {
      transform: `translate(${x.toFixed()}px, ${y.toFixed()}px)`,
    })
  }

  function showPopover(popoverElement: HTMLElement) {
    clearActivePopover()
    popoverElement.classList.add("active-popover")
    setPosition(popoverElement as HTMLElement)

    if (hash !== "") {
      const targetAnchor = `#popover-internal-${hash.slice(1)}`
      const heading = popoverInner.querySelector(targetAnchor) as HTMLElement | null
      if (heading) {
        // leave ~12px of buffer when scrolling to a heading
        popoverInner.scroll({ top: heading.offsetTop - 12, behavior: "instant" })
      }
    }
  }

  const targetUrl = new URL(link.href)
  const hash = decodeURIComponent(targetUrl.hash)
  targetUrl.hash = ""
  targetUrl.search = ""
  const popoverId = `popover-${link.pathname}`
  const prevPopoverElement = document.getElementById(popoverId)

  // dont refetch if there's already a popover
  if (!!document.getElementById(popoverId)) {
    showPopover(prevPopoverElement as HTMLElement)
    return
  }

  const response = await fetchCanonical(targetUrl).catch((err) => {
    console.error(err)
  })

  if (!response) return
  const [contentType] = response.headers.get("Content-Type")!.split(";")
  const [contentTypeCategory, typeInfo] = contentType.split("/")

  const popoverElement = document.createElement("div")
  popoverElement.id = popoverId
  popoverElement.classList.add("popover")
  const popoverInner = document.createElement("div")
  popoverInner.classList.add("popover-inner")
  popoverInner.dataset.contentType = contentType ?? undefined
  popoverElement.appendChild(popoverInner)

  switch (contentTypeCategory) {
    case "image":
      const img = document.createElement("img")
      img.src = targetUrl.toString()
      img.alt = targetUrl.pathname

      popoverInner.appendChild(img)
      break
    case "application":
      switch (typeInfo) {
        case "pdf":
          const pdf = document.createElement("iframe")
          pdf.src = targetUrl.toString()
          popoverInner.appendChild(pdf)
          break
        default:
          break
      }
      break
    default:
      const contents = await response.text()
      const html = p.parseFromString(contents, "text/html")
      normalizeRelativeURLs(html, targetUrl)
      // prepend all IDs inside popovers to prevent duplicates
      html.querySelectorAll("[id]").forEach((el) => {
        const targetID = `popover-internal-${el.id}`
        el.id = targetID
      })
      const elts = [...html.getElementsByClassName("popover-hint")]
      if (elts.length === 0) return

      elts.forEach((elt) => popoverInner.appendChild(elt))
  }

  if (!!document.getElementById(popoverId)) {
    return
  }

  document.body.appendChild(popoverElement)
  if (activeAnchor !== this) {
    return
  }

  showPopover(popoverElement)
}

function clearActivePopover() {
  activeAnchor = null
  const allPopoverElements = document.querySelectorAll(".popover")
  allPopoverElements.forEach((popoverElement) => popoverElement.classList.remove("active-popover"))
}





let timeoutId: number | NodeJS.Timeout | null = null
let lastHoveredLink: HTMLAnchorElement | null = null

// Use event delegation for more robust handling of dynamic content and SPA navigation
document.addEventListener("nav", () => {
    // Clean up any existing popovers on navigation
    const allPopovers = document.querySelectorAll(".popover")
    allPopovers.forEach(el => el.remove())
    
    // Reset state
    if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
    }
    lastHoveredLink = null
})

// Global event listener for mouseover (mouseenter does not bubble, mouseover does)
window.addEventListener("mouseover", (e) => {
    const target = e.target as HTMLElement
    const link = target.closest("a.internal") as HTMLAnchorElement
    
    // If we are not over an internal link, or we moved to a different link
    if (!link || link !== lastHoveredLink) {
        // If we were tracking a link, and now we are not over it (or over a different one)
        // Clear the old tracking
        if (lastHoveredLink) {
             if (timeoutId) {
                clearTimeout(timeoutId)
                timeoutId = null
            }
            lastHoveredLink = null
            // Don't clear active popover immediately if we moved to the popover itself (unlikely with this logic, but safe)
            // Actually, we usually want to clear popover if we move off the link
            clearActivePopover()
        }
    }

    // If we are over a valid internal link
    if (link) {
         if (link === lastHoveredLink) {
             // We are still over the same link, do nothing (keep timer running if it acts)
             return
         }

         // New link hover
         lastHoveredLink = link
         
         if (timeoutId) clearTimeout(timeoutId)
         
         timeoutId = setTimeout(() => {
             // Re-validate state execution time
             if (lastHoveredLink !== link) return
             if (!link.matches(':hover')) return 
             if (!link.isConnected) return
             
             mouseEnterHandler.call(link, { clientX: e.clientX, clientY: e.clientY })
         }, 500)
    }
})

// We don't need explicit mouseout because mouseover on 'body' or other elements will trigger the "!link" check above.
// But we might want to catch leaving the window or generic clearing.
window.addEventListener("mouseout", (e) => {
    // If we leave the document or a specific element, we might need to clear.
    // However, the mouseover logic handles "moving to something else".
    // The only edge case is moving out of the browser window or to a non-element?
    // Let's add a safety check for when mouse leaves the link directly if not caught by mouseover elsewhere
    
    if (lastHoveredLink && !lastHoveredLink.contains(e.relatedTarget as Node)) {
         // We genuinely left the link and went to something that isn't inside it
         // But wait! If we moved to a child of the link, that's fine (mouseover handles bubbling usually, but mouseout fires on children too)
         
         // Using relatedTarget to see where we went
         const related = e.relatedTarget as HTMLElement
         if (related && related.closest("a.internal") === lastHoveredLink) return // Moved internal to link structure

         // Ok, we really left the link
         if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
        lastHoveredLink = null
        clearActivePopover()
    }
})
