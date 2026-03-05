// iframe auto-resize: listen for postMessage from embedded HTML files
document.addEventListener("nav", () => {
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "iframe-resize") {
      document.querySelectorAll("iframe").forEach(function (iframe) {
        try {
          if (iframe.contentWindow === e.source) {
            iframe.style.height = e.data.height + 20 + "px"
          }
        } catch (err) {}
      })
    }
  })
})
